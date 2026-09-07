/**
 * Frontend API client.
 * Wraps fetch calls to the backend API.
 * All functions return parsed JSON or throw on error.
 *
 * Split deployment: set VITE_API_BASE_URL (e.g. https://api.playback.rachmat.pro)
 * to call the BE on a different origin. Leave empty for same-origin via Vite proxy.
 * credentials: 'include' is required for session-cookie auth on cross-origin.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const BASE = API_BASE ? `${API_BASE}/api` : '/api'
export const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : '/auth'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch paginated conversation list with filters.
 * @param {Object} params - Filter params (from, to, agent, channel, sentiment, tag, keyword, minDuration, page, limit)
 */
export async function fetchConversations(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  return request(`/conversations?${query.toString()}`);
}

/**
 * Fetch a single conversation with full detail.
 * @param {string} id - Conversation ID
 */
export async function fetchConversation(id) {
  return request(`/conversations/${id}`);
}

/**
 * Fetch analytics data.
 * @param {'volume' | 'kpis' | 'sentiment' | 'top-agents'} type
 * @param {Object} params - Query params (from, to, granularity, limit)
 */
export async function fetchAnalytics(type, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  return request(`/analytics/${type}?${query.toString()}`);
}

/**
 * Get the audio URL for a conversation.
 * Fetches the audio endpoint -- if the server returns a JSON { url } (Blob Storage SAS URL),
 * returns that URL. Otherwise returns the endpoint path for direct streaming (local dev).
 * @param {string} conversationId
 * @returns {Promise<string|null>} The audio URL, or null if not found
 */
export async function fetchAudioUrl(conversationId) {
  const res = await fetch(`${BASE}/audio/${conversationId}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 401) {
      throw new Error('Your session has expired. Please sign in again.')
    }
    if (res.status === 403) {
      throw new Error('You are not allowed to access this recording.')
    }

    throw new Error('Audio service is temporarily unavailable.')
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Local development streams audio directly from the API.
    return `${BASE}/audio/${conversationId}`;
  }

  const data = await res.json();
  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new Error('Audio service returned an invalid recording URL.')
  }
  return data.url;
}

/**
 * Get the audio URL for a conversation (sync, for local dev streaming).
 * @deprecated Use fetchAudioUrl() instead for Blob Storage support.
 * @param {string} conversationId
 */
export function getAudioUrl(conversationId) {
  return `${BASE}/audio/${conversationId}`;
}

/**
 * Fetch all agents (id + name), sorted alphabetically.
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
export async function fetchAgents() {
  const res = await request('/agents');
  return res.data;
}

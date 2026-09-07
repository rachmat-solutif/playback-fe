# API Integration - Playback FE

How the frontend talks to `playback-be`.

## Base URL

`src/lib/api.js` derives the API origin from `VITE_API_BASE_URL`:

```js
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const BASE = API_BASE ? `${API_BASE}/api` : '/api'
export const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : '/auth'
```

| Mode | `VITE_API_BASE_URL` | Requests |
|------|---------------------|----------|
| Local dev (same-origin) | `""` (empty) | `/api/...`, `/auth/...` via Vite proxy to `http://localhost:3000` |
| Split / staging / prod | `https://api.playback.rachmat.pro` | `https://api.playback.rachmat.pro/api/...` |

The value is baked at build time by Vite. Change it -> rebuild.

`src/context/AuthContext.jsx` and `src/components/ProtectedRoute.jsx` derive the same `AUTH_BASE` locally so auth redirects stay consistent with API calls.

## Vite Proxy (local dev)

`vite.config.js`:

```js
proxy: {
  '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
  '/auth': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
  '/health': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
}
```

- The browser stays on `http://localhost:5173` - no CORS, and the `secureSession` cookie works as `sameSite: lax`.
- `VITE_API_PROXY_TARGET` can point at a staging BE for FE-only development.

## Credentials and CORS

All API calls use `credentials: 'include'`:

```js
fetch(`${BASE}/conversations?${query}`, { credentials: 'include' })
fetch(`${AUTH_BASE}/me`, { credentials: 'include' })
```

For split origins (FE `https://playback.rachmat.pro`, BE `https://api.playback.rachmat.pro`):

- BE must enable CORS:

  ```ts
  await app.register(cors, {
    origin: ['https://playback.rachmat.pro', 'http://localhost:5173'],
    credentials: true,
  })
  ```

- BE session cookie must be `sameSite: none` + `secure: true` (already set when `NODE_ENV` is `staging`/`production`). Local dev can keep `lax`.
- FE `import.meta.env.VITE_API_BASE_URL` must be the BE origin (no trailing slash).

## Endpoints

### Conversations

- `GET /api/conversations` - list with filters `from, to, agent, channel, sentiment, tag, keyword, minDuration, page, limit`. `useConversationFilters` builds the query. Returns `{ data: Conversation[], total, page, limit }`.
- `GET /api/conversations/:id` - detail with populated `agent`, `customer`, `tags`, `transcript_segments`, `audio_files`, `conversation_metrics`. `ConversationDetail.jsx` calls this on mount.

### Analytics

- `GET /api/analytics/volume?from&to&granularity=day|hour` - used by `ContactVolumeChart.jsx`
- `GET /api/analytics/kpis?from&to` - KPI cards + delta
- `GET /api/analytics/sentiment?from&to` - sentiment breakdown
- `GET /api/analytics/top-agents?from&to` - ranked agents

### Audio

- `GET /api/audio/:conversationId` - `fetchAudioUrl(id)` in `src/lib/api.js`:

  ```js
  const res = await fetch(`${BASE}/audio/${id}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  // 404 -> null, 401/403 -> thrown with user-facing message
  // non-JSON -> return `${BASE}/audio/${id}` (local streaming with Range)
  // JSON      -> return data.url (Azure Blob SAS URL, short-lived)
  ```

- `GET /api/agents` - `fetchAgents()` for `SearchBar` autocomplete.

### Auth

- `GET /auth/me` - session check; returns user JSON or 401.
- `GET /auth/login` - redirect to Entra ID authorization URL.
- `GET /auth/callback` - Entra redirect landing (BE handles code exchange, sets session cookie, redirects to FE).
- `GET /auth/logout` - destroy session + redirect to Entra logout.

Entra env (`ENTRA_*`, `SESSION_*`) and `AUTH_PROVIDER` live in `playback-be`. For local dev the BE can run with `AUTH_BYPASS=true` so `/auth/me` returns a mock user.

## Error Handling

`request()` in `api.js` throws `Error(body.error || res.statusText)`. Callers should catch and render:

- `401` - session expired -> redirect to `/auth/login`
- `403` - not allowed to access recording
- `429` - rate limit (100 req/min per IP)
- `5xx` - "Audio service is temporarily unavailable" etc.

## Example: calling the API

```js
import { fetchConversations, fetchAudioUrl } from '../lib/api.js'

const { data, total } = await fetchConversations({ keyword: 'billing', page: 1, limit: 20 })
const url = await fetchAudioUrl(conversationId) // SAS URL or streaming path
```

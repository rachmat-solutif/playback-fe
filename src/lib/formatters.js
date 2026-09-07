// Formatting helpers shared across routes/components.

/** Seconds -> "m:ss" (e.g. 5:07). Used by the audio player and duration columns. */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/** "2026-06-14" -> "Jun 14, 2026" */
export function formatDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Full timestamp -> "Jun 14, 2026, 3:42 PM" */
export function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** 12345 -> "12,345" */
export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n || 0)
}

/** Percentage change with sign, e.g. +12.4% */
export function formatDelta(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/** YYYY-MM-DD for a Date, in local time. */
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Shorten a 24-char hex ObjectId for display. Strips leading zeros but keeps
 *  at least 5 characters (zero-padded) so short IDs remain recognizable. */
export function formatConversationId(id) {
  if (!id) return ''
  const stripped = id.replace(/^0+/, '') || '0'
  return stripped.length < 5 ? stripped.padStart(5, '0') : stripped
}

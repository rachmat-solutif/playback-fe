import { CHANNEL_LABELS } from '../lib/constants.js'

// Compact channel indicator (call / chat / email) with an inline SVG icon.
function ChannelIcon({ channel }) {
  const cls = 'h-4 w-4'
  if (channel === 'call') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
        <path d="M6.6 10.8a15.9 15.9 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 003.6.58 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.58 3.6 1 1 0 01-.24 1z" />
      </svg>
    )
  }
  if (channel === 'chat') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
        <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V5a1 1 0 011-1z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
      <path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm1.4 2L12 12l7.6-5z" />
    </svg>
  )
}

export function ChannelBadge({ channel }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <ChannelIcon channel={channel} />
      {CHANNEL_LABELS[channel] || channel}
    </span>
  )
}

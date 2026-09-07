import { SENTIMENT_META } from '../lib/constants.js'

// Small colored badge for a conversation's sentiment. Contrast-safe palette (rules section 9).
export function SentimentBadge({ sentiment }) {
  const meta = SENTIMENT_META[sentiment] || SENTIMENT_META.neutral
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.badge}`}
    >
      {meta.label}
    </span>
  )
}

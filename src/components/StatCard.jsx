import { formatDelta } from '../lib/formatters.js'

// GA-style KPI tile. `deltaGood` flips the color logic for metrics where "down is good"
// (e.g. negative-sentiment rate, avg handle time). `tone` renders a colored background
// variant (one|two|three|brand) with white text for the dashboard KPI row.
const TONE_BG = {
  one: 'bg-card-one',
  two: 'bg-card-two',
  three: 'bg-card-three',
  brand: 'bg-primary-600',
}

export function StatCard({ label, value, delta, deltaGood = 'up', hint, tone }) {
  const colored = Boolean(tone && TONE_BG[tone])
  const hasDelta = typeof delta === 'number' && delta !== 0
  const isUp = delta > 0
  const positive = deltaGood === 'up' ? isUp : !isUp

  // On colored cards keep text readable (white-ish); on plain cards use semantic tokens.
  const deltaColor = colored
    ? 'text-white/90'
    : !hasDelta
      ? 'text-faint'
      : positive
        ? 'text-success'
        : 'text-error'

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        colored ? `${TONE_BG[tone]} border-transparent text-white` : 'border-line bg-surface'
      }`}
    >
      <p className={`text-sm font-medium ${colored ? 'text-white/80' : 'text-muted'}`}>{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className={`text-2xl font-semibold ${colored ? 'text-white' : 'text-strong'}`}>{value}</p>
        {hasDelta && (
          <span className={`flex items-center gap-0.5 text-sm font-medium ${deltaColor}`}>
            {isUp ? <ArrowUp /> : <ArrowDown />}
            {formatDelta(Math.abs(delta))}
          </span>
        )}
      </div>
      {hint && <p className={`mt-1 text-xs ${colored ? 'text-white/70' : 'text-faint'}`}>{hint}</p>}
    </div>
  )
}

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

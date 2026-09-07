import { useState, useEffect } from 'react'
import { fetchAnalytics } from '../lib/api.js'
import { CHANNELS, CHANNEL_COLORS, CHANNEL_LABELS } from '../lib/constants.js'

// Contact Volume trend. Stacked bars broken down by channel, with a Day / Hour
// granularity toggle within the same component.
export function ContactVolumeChart({ from, to }) {
  const [granularity, setGranularity] = useState('day') // "day" | "hour"
  const [data, setData] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchAnalytics('volume', { from, to, granularity })
      .then((res) => {
        if (!cancelled) {
          // Map API response to chart format (add 'total' field and channel shorthands)
          const mapped = (res.data || []).map((d) => ({
            ...d,
            call: d.byChannel?.call || 0,
            chat: d.byChannel?.chat || 0,
            email: d.byChannel?.email || 0,
            total: d.count || 0,
          }))
          setData(mapped)
        }
      })
      .catch(console.error)
    return () => { cancelled = true }
  }, [granularity, from, to])

  const maxTotal = Math.max(1, ...data.map((d) => d.total))
  const totalContacts = data.reduce((s, d) => s + d.total, 0)

  // Keep the axis readable on wide ranges by thinning day labels.
  const labelStride = granularity === 'day' ? Math.ceil(data.length / 15) : 2

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-strong">Contact Volume</h2>
          <p className="text-xs text-muted">
            {totalContacts.toLocaleString()} contacts - {granularity === 'day' ? 'by day' : 'by hour of day'}
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-line p-0.5"
          role="group"
          aria-label="Chart granularity"
        >
          {[
            { key: 'day', label: 'By Day' },
            { key: 'hour', label: 'By Hour' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setGranularity(opt.key)}
              aria-pressed={granularity === opt.key}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                granularity === opt.key
                  ? 'bg-tab-active text-white'
                  : 'text-muted hover:bg-tab-hover/10 hover:text-tab-active'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-4">
        {CHANNELS.map((ch) => (
          <span key={ch} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHANNEL_COLORS[ch] }} />
            {CHANNEL_LABELS[ch]}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="flex h-56 items-end gap-[3px] overflow-hidden">
        {data.map((d, i) => (
          <div key={d.date || d.hour} className="group flex h-full flex-1 flex-col items-center justify-end">
            <div
              className="relative flex w-full flex-col justify-end"
              style={{ height: `${(d.total / maxTotal) * 100}%` }}
              title={`${d.label}: ${d.total} contacts`}
            >
              {/* Stack channels bottom-up */}
              {CHANNELS.map((ch) =>
                d[ch] > 0 ? (
                  <div
                    key={ch}
                    style={{
                      height: `${(d[ch] / d.total) * 100}%`,
                      backgroundColor: CHANNEL_COLORS[ch],
                    }}
                    className="w-full first:rounded-t-sm"
                  />
                ) : null,
              )}
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block dark:bg-black">
                {d.label}: {d.total}
              </div>
            </div>
            <span className="mt-1 h-4 truncate text-[9px] text-faint">
              {i % labelStride === 0 ? d.label : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

import { RANGE_PRESETS, presetToRange } from '../hooks/useDateRangeFilter.js'
import { formatDate } from '../lib/formatters.js'

// Primary scope control. Preset buttons + custom from/to inputs. State lives in
// the URL via the useDateRangeFilter hook passed in as props.
export function DateRangeFilter({ from, to, onChange }) {
  const update = (key, value) => onChange({ from, to, [key]: value })

  const dateInputClass =
    'mt-0.5 rounded-md border border-line bg-surface px-2 py-1 text-sm text-strong focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm">
      <div className="mr-1">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Date range</p>
        <p className="text-sm font-medium text-body">
          {formatDate(from)} - {formatDate(to)}
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-line p-0.5">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(presetToRange(preset.days))}
            className="rounded-md px-3 py-1 text-sm font-medium text-muted hover:bg-tab-hover/10 hover:text-tab-active"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div>
          <label htmlFor="range-from" className="block text-xs font-medium text-muted">
            From
          </label>
          <input
            id="range-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => update('from', e.target.value)}
            className={dateInputClass}
          />
        </div>
        <div>
          <label htmlFor="range-to" className="block text-xs font-medium text-muted">
            To
          </label>
          <input
            id="range-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => update('to', e.target.value)}
            className={dateInputClass}
          />
        </div>
      </div>
    </div>
  )
}

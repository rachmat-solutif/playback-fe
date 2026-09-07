import { useState, useRef, useEffect } from 'react'

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

/**
 * Standalone DateRangePicker component
 * Reusable across projects - no external dependencies beyond React + Tailwind
 * 
 * @param {string} from - Start date ISO string (YYYY-MM-DD)
 * @param {string} to - End date ISO string (YYYY-MM-DD)
 * @param {function} onChange - Callback with { from, to }
 * @param {number} maxDateRange - Optional: max days between from/to
 */
export function DateRangePicker({ from, to, onChange, maxDateRange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('presets') // 'presets' | 'custom'
  const containerRef = useRef(null)

  const handlePreset = (days) => {
    const end = new Date()
    const start = new Date()

    if (days === 1) {
      // "Yesterday" -- single day
      start.setDate(start.getDate() - 1)
      end.setDate(end.getDate() - 1)
    } else {
      start.setDate(start.getDate() - days)
    }

    onChange({
      from: formatDate(start),
      to: formatDate(end),
    })
    setIsOpen(false)
  }

  const handleFromChange = (e) => {
    const newFrom = e.target.value
    let newTo = to

    // Enforce max date range
    if (maxDateRange && newFrom && newTo) {
      const fromDate = new Date(newFrom)
      const toDate = new Date(newTo)
      const diffDays = (toDate - fromDate) / (1000 * 60 * 60 * 24)
      if (diffDays > maxDateRange) {
        const adjustedTo = new Date(fromDate)
        adjustedTo.setDate(adjustedTo.getDate() + maxDateRange)
        newTo = formatDate(adjustedTo)
      }
    }

    onChange({ from: newFrom, to: newTo })
  }

  const handleToChange = (e) => {
    const newTo = e.target.value
    let newFrom = from

    // Enforce max date range
    if (maxDateRange && newFrom && newTo) {
      const fromDate = new Date(newFrom)
      const toDate = new Date(newTo)
      const diffDays = (toDate - fromDate) / (1000 * 60 * 60 * 24)
      if (diffDays > maxDateRange) {
        const adjustedFrom = new Date(toDate)
        adjustedFrom.setDate(adjustedFrom.getDate() - maxDateRange)
        newFrom = formatDate(adjustedFrom)
      }
    }

    onChange({ from: newFrom, to: newTo })
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayText = from && to 
    ? `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`
    : 'Select dates'

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium
          hover:bg-surface-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : ''}
        `}
      >
        <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {displayText}
        <svg className={`h-4 w-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 rounded-xl border border-line bg-surface p-4 shadow-xl">
          {/* Tabs */}
          <div className="mb-4 flex rounded-lg bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'presets' ? 'bg-surface text-strong shadow-sm' : 'text-muted hover:text-body'
              }`}
            >
              Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'custom' ? 'bg-surface text-strong shadow-sm' : 'text-muted hover:text-body'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset.days)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-body hover:bg-surface-muted"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Custom Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">From</label>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={handleFromChange}
                  onClick={(e) => e.target.showPicker()}
                  className="w-full cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-sm text-strong focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">To</label>
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={handleToChange}
                  onClick={(e) => e.target.showPicker()}
                  className="w-full cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-sm text-strong focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              {maxDateRange && (
                <p className="text-xs text-muted">Maximum range: {maxDateRange} days</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-muted">
              {from && to && `${calculateDays(from, to)} days`}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange({ from: '', to: '' })
                setIsOpen(false)
              }}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helpers
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function calculateDays(from, to) {
  const start = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
}

export default DateRangePicker
import { useCallback } from 'react'
import { fetchAgents } from '../lib/api.js'
import { Autocomplete } from './Autocomplete.jsx'
import { DateRangePicker } from './DateRangePicker.jsx'

// Advanced search / filter panel. Each control is a labeled input; filters combine
// with AND logic in the useConversationFilters hook.
const FIELD_CLASS =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-strong placeholder:text-faint focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

export function SearchBar({ filters, onChange, onBatchChange, onClear, activeCount, resultCount }) {
  const selectedAgents = filters.agents || []

  // AJAX fetch for the autocomplete -- filters by query on the client side
  // after fetching from the API. Could be moved server-side for large datasets.
  const fetchAgentOptions = useCallback(async (query) => {
    const agents = await fetchAgents()
    const names = agents.map((a) => a.name)
    if (!query) return names
    const lower = query.toLowerCase()
    return names.filter((name) => name.toLowerCase().includes(lower))
  }, [])

  const handleAgentSelect = (agent) => {
    onChange('agents', [...selectedAgents, agent])
  }

  const handleAgentRemove = (agent) => {
    onChange('agents', selectedAgents.filter((a) => a !== agent))
  }

  const handleDateRangeChange = ({ from, to }) => {
    onBatchChange({ from, to })
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      {/* Keyword search */}
      <div className="mb-4">
        <label htmlFor="search-q" className="mb-1 block text-sm font-medium text-body">
          Search transcripts, customers, agents...
        </label>
        <input
          id="search-q"
          type="search"
          placeholder="e.g. refund, billing, Maya..."
          value={filters.q}
          onChange={(e) => onChange('q', e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      {/* Structured filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Multi-select Agent autocomplete */}
        <div>
          <Autocomplete
            label="Agent"
            placeholder="Select agents..."
            selected={selectedAgents}
            onSelect={handleAgentSelect}
            onRemove={handleAgentRemove}
            fetchOptions={fetchAgentOptions}
            debounceMs={150}
          />
        </div>

        {/* Date range */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-sm font-medium text-body">
            Date range
          </label>
          <DateRangePicker
            from={filters.from}
            to={filters.to}
            onChange={handleDateRangeChange}
            maxDateRange={365}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          <span className="font-semibold text-strong">{resultCount}</span> conversations
          {activeCount > 0 && ` - ${activeCount} filter${activeCount > 1 ? 's' : ''} active`}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

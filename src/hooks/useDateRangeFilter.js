// Shared date-range scope control, backed by URL query params (?from=YYYY-MM-DD&to=YYYY-MM-DD)
// so filtered views are shareable/bookmarkable (rules section 5). Defaults to the last 30 days.

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toISODate } from '../lib/formatters.js'

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29) // inclusive 30-day window
  return { from: toISODate(from), to: toISODate(to) }
}

// Named presets surfaced by the DateRangeFilter component.
export const RANGE_PRESETS = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '60d', label: 'Last 60 days', days: 60 },
]

export function presetToRange(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: toISODate(from), to: toISODate(to) }
}

export function useDateRangeFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const fallback = defaultRange()

  const from = searchParams.get('from') || fallback.from
  const to = searchParams.get('to') || fallback.to

  const setRange = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set('from', next.from)
          params.set('to', next.to)
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return useMemo(() => ({ from, to, setRange }), [from, to, setRange])
}

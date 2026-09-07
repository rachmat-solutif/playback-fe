// Advanced-search filtering for the conversations list. Filters are held in URL
// query params (shareable) and combined with AND logic by default (rules section 5).
// Now fetches from the backend API instead of filtering mock data in-memory.

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchConversations } from '../lib/api.js'

// Filter keys we read/write from the query string.
export const FILTER_KEYS = ['q', 'agents', 'from', 'to', 'page', 'perPage']

// Default pagination values
const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 20

export function useConversationFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [results, setResults] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const filters = useMemo(() => {
    const get = (k) => searchParams.get(k) || ''
    return {
      q: get('q'),
      agents: get('agents') ? get('agents').split(',') : [],
      from: get('from'),
      to: get('to'),
      page: Number(get('page')) || DEFAULT_PAGE,
      perPage: Number(get('perPage')) || DEFAULT_PER_PAGE,
    }
  }, [searchParams])

  // Fetch from API whenever filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const params = {}
    if (filters.q) params.keyword = filters.q
    if (filters.agents.length) params.agent = filters.agents[0] // API takes single agent name
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    params.page = filters.page
    params.limit = filters.perPage

    fetchConversations(params)
      .then((res) => {
        if (!cancelled) {
          setResults(res.data)
          setTotalItems(res.total)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to fetch conversations:', err)
          setResults([])
          setTotalItems(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [filters.q, filters.agents.join(','), filters.from, filters.to, filters.page, filters.perPage])

  const totalPages = Math.ceil(totalItems / filters.perPage)

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (key === 'agents' && Array.isArray(value)) {
            if (value.length) params.set(key, value.join(','))
            else params.delete(key)
          } else if (value) {
            params.set(key, value)
          } else {
            params.delete(key)
          }
          // Reset to page 1 when any non-page filter changes
          if (key !== 'page') params.set('page', '1')
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Batch-update multiple filters in a single URL update (avoids race conditions)
  const setFilters = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          let hasNonPage = false
          for (const [key, value] of Object.entries(updates)) {
            if (key === 'agents' && Array.isArray(value)) {
              if (value.length) params.set(key, value.join(','))
              else params.delete(key)
            } else if (value) {
              params.set(key, value)
            } else {
              params.delete(key)
            }
            if (key !== 'page') hasNonPage = true
          }
          if (hasNonPage) params.set('page', '1')
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        FILTER_KEYS.forEach((k) => params.delete(k))
        return params
      },
      { replace: true },
    )
  }, [setSearchParams])

  const activeCount = useMemo(
    () => FILTER_KEYS.filter((k) => {
      if (k === 'agents') return filters.agents.length > 0
      if (k === 'page' || k === 'perPage') return false
      return filters[k]
    }).length,
    [filters],
  )

  return { 
    filters, 
    setFilter,
    setFilters,
    clearFilters, 
    results, 
    activeCount,
    totalItems,
    totalPages,
    loading,
  }
}

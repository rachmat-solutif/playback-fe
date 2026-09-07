import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Tailwind UI-style AJAX Autocomplete Combobox
 *
 * Fetches suggestions from an async data source as the user types (debounced).
 * Supports multi-select with chips, keyboard navigation, and accessible ARIA markup.
 *
 * @param {string} label - Field label
 * @param {string} placeholder - Input placeholder text
 * @param {string[]} selected - Currently selected values
 * @param {function} onSelect - Called with value when an option is selected
 * @param {function} onRemove - Called with value when a chip is removed
 * @param {function} fetchOptions - Async function: (query: string) => Promise<string[]>
 * @param {number} debounceMs - Debounce delay in ms (default 200)
 */
export function Autocomplete({
  label,
  placeholder = 'Search...',
  selected = [],
  onSelect,
  onRemove,
  fetchOptions,
  debounceMs = 200,
}) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceRef = useRef(null)

  // Fetch options when query changes (debounced)
  const loadOptions = useCallback(
    (searchQuery) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const results = await fetchOptions(searchQuery)
          setOptions(results.filter((r) => !selected.includes(r)))
        } catch {
          setOptions([])
        } finally {
          setLoading(false)
        }
      }, debounceMs)
    },
    [fetchOptions, selected, debounceMs],
  )

  // Load all options on initial open (empty query)
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    loadOptions(query)
  }, [loadOptions, query])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setActiveIndex(-1)
    setIsOpen(true)
    loadOptions(value)
  }

  const handleSelect = (value) => {
    onSelect(value)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      handleOpen()
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && options[activeIndex]) {
          handleSelect(options[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
      case 'Backspace':
        if (!query && selected.length > 0) {
          onRemove(selected[selected.length - 1])
        }
        break
    }
  }

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex]
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const inputId = `autocomplete-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`
  const listboxId = `${inputId}-listbox`

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-body">
          {label}
        </label>
      )}

      {/* Input area with chips */}
      <div
        className={`
          flex flex-wrap items-center gap-1 rounded-lg border bg-surface px-3 py-2
          focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-line'}
        `}
      >
        {/* Selected chips */}
        {selected.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          >
            {value}
            <button
              type="button"
              onClick={() => onRemove(value)}
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-600 dark:hover:bg-primary-800 dark:hover:text-primary-200"
              aria-label={`Remove ${value}`}
            >
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          placeholder={selected.length === 0 ? placeholder : ''}
          value={query}
          onChange={handleInputChange}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm text-strong placeholder:text-faint focus:outline-none focus:ring-0"
        />

        {/* Chevron button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
            } else {
              handleOpen()
              inputRef.current?.focus()
            }
          }}
          className="ml-1 flex-shrink-0 text-muted hover:text-body"
          aria-label="Toggle options"
        >
          <svg className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Dropdown options list */}
      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg focus:outline-none"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-muted">Loading...</li>
          )}

          {!loading && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">
              {query ? 'No results found.' : 'No options available.'}
            </li>
          )}

          {!loading &&
            options.map((option, index) => (
              <li
                key={option}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected.includes(option)}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`
                  relative cursor-pointer select-none px-3 py-2 text-sm
                  ${index === activeIndex ? 'bg-primary-600 text-white' : 'text-body'}
                `}
              >
                <span className="block truncate">{option}</span>
                {selected.includes(option) && (
                  <span
                    className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                      index === activeIndex ? 'text-white' : 'text-primary-600'
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'

import { seriesAPI } from '@/lib/api/series'
import { formatSeriesDisplay } from '@/lib/utils/series-formatter'
import type { ComicSeries } from '@/types/search.types'

interface SeriesAutocompleteProps {
  value: ComicSeries | null
  onSelect: (series: ComicSeries | null) => void
  error?: string
  required?: boolean
}

export function SeriesAutocomplete({
  value,
  onSelect,
  error,
  required = false,
}: SeriesAutocompleteProps) {
  const [query, setQuery] = useState(value?.title || '')
  const [results, setResults] = useState<ComicSeries[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Update display when value prop changes (e.g., when edit page loads data)
  useEffect(() => {
    if (value) {
      // Use displayName from API when available, otherwise format locally
      const displayText =
        value.displayName || formatSeriesDisplay(value, { includePublisher: false, includeType: true })
      setQuery(displayText)
    } else {
      setQuery('')
    }
  }, [value])

  // Debounce search
  useEffect(() => {
    // Don't search if we already have a selected value (prevents dropdown on pre-fill)
    if (value) {
      return
    }

    if (!query || query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await seriesAPI.search(query)
        setResults(data.series || [])
        setIsOpen(true)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Series search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (series: ComicSeries) => {
    onSelect(series)
    // Use displayName from API when available (canonical name), otherwise format locally
    const displayText =
      series.displayName || formatSeriesDisplay(series, { includePublisher: false, includeType: true })
    setQuery(displayText)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  // Render a single autocomplete option with alias support
  // Two formats:
  // 1. Direct title match (matchedAlias is null): single-line with displayName
  // 2. Alias match: two-line with alias name, "Part of:" canonical, publisher
  const renderSeriesOption = (series: ComicSeries) => {
    const displayName =
      series.displayName || formatSeriesDisplay(series, { includePublisher: false, includeType: true })

    if (series.matchedAlias) {
      // ALIAS MATCH: Two-line format
      return (
        <>
          <div className="font-semibold text-slate-950">
            {series.matchedAlias}
            {series.aliasIssueRange && (
              <span className="ml-1 font-normal text-slate-400">({series.aliasIssueRange})</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Part of: {displayName}</div>
          <div className="text-xs text-slate-400">{series.publisher}</div>
        </>
      )
    }

    // DIRECT TITLE MATCH: Single-line format
    return (
      <>
        <div className="font-medium text-slate-950">{displayName}</div>
        <div className="text-xs text-slate-400">{series.publisher}</div>
      </>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="series" className="mb-2 block text-sm font-medium text-slate-950">
        Comic Series {required && <span className="text-error-red">*</span>}
      </label>
      <input
        id="series"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!e.target.value) {
            onSelect(null)
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Start typing to search..."
        required={required}
        className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue ${
          error ? 'border-error-red' : value ? 'border-success-green' : 'border-slate-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-error-red">{error}</p>}
      {!error && value && <p className="mt-1 text-xs text-success-green">✓ Selected</p>}
      {!error && !value && (
        <p className="mt-1 text-xs text-slate-600">
          Select series type (Annual, Giant-Size) from dropdown
        </p>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-slate-300 bg-white shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-slate-600">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-collector-blue"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-slate-600">No results found</div>
          ) : (
            results.map((series, index) => (
              <button
                key={`${series.id}-${series.type}${series.matchedAlias ? `-${series.matchedAlias}` : ''}`}
                type="button"
                onClick={() => handleSelect(series)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                {renderSeriesOption(series)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'

import { seriesAPI } from '@/lib/api/series'
import { formatSeriesDisplay } from '@/lib/utils/series-formatter'
import type { ComicSeries } from '@/types/search.types'

import { FIELD, FIELD_ERROR, FIELD_HINT, FIELD_LABEL } from './formStyles'

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
        value.displayName || formatSeriesDisplay(value, { includePublisher: false })
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
      series.displayName || formatSeriesDisplay(series, { includePublisher: false })
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
      series.displayName || formatSeriesDisplay(series, { includePublisher: false })

    if (series.matchedAlias) {
      // ALIAS MATCH: Two-line format
      return (
        <>
          <div className="font-semibold text-ink">
            {series.matchedAlias}
            {series.aliasIssueRange && (
              <span className="ml-1 font-normal text-muted-foreground">({series.aliasIssueRange})</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Part of: {displayName}</div>
          <div className="text-xs text-muted-foreground">{series.publisher}</div>
        </>
      )
    }

    // DIRECT TITLE MATCH: Single-line format
    return (
      <>
        <div className="font-medium text-ink">{displayName}</div>
        <div className="text-xs text-muted-foreground">{series.publisher}</div>
      </>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="series" className={FIELD_LABEL}>
        Comic Series{' '}
        {required && (
          <>
            <span className="text-danger" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
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
        aria-invalid={error ? true : undefined}
        className={`${FIELD} ${error ? 'border-danger' : value ? 'border-ok' : ''}`}
      />
      {error && <p className={FIELD_ERROR}>{error}</p>}
      {!error && value && <p className="mt-1.5 text-[13px] font-semibold text-ok">✓ Selected</p>}
      {!error && !value && (
        <p className={FIELD_HINT}>
          Select series type (Annual, Giant-Size) from dropdown
        </p>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-button border border-line-strong bg-surface shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No results found</div>
          ) : (
            results.map((series, index) => (
              <button
                key={`${series.id}-${series.type}${series.matchedAlias ? `-${series.matchedAlias}` : ''}`}
                type="button"
                onClick={() => handleSelect(series)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left hover:bg-primary-tint ${
                  index === selectedIndex ? 'bg-primary-tint' : ''
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

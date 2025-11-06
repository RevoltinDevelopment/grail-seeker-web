'use client'

import { useState, useEffect, useRef } from 'react'
import { seriesAPI } from '@/lib/api/series'
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
      setQuery(
        `${value.title} (Vol. ${value.volume}, ${value.yearRange})${value.type ? ` ${value.type}` : ''}`
      )
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
    setQuery(
      `${series.title} (Vol. ${series.volume}, ${series.yearRange})${series.type ? ` ${series.type}` : ''}`
    )
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

  const getDisplayName = (series: ComicSeries) => {
    return `${series.title}${series.type ? ` ${series.type}` : ''} (Vol. ${series.volume}, ${series.yearRange}) - ${series.publisher}`
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
                key={`${series.id}-${series.type}`}
                type="button"
                onClick={() => handleSelect(series)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium text-slate-950">{getDisplayName(series)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

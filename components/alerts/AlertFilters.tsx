'use client'

import type { AlertsSortMode } from '@/lib/api/user'

interface AlertFiltersProps {
  platform: 'all' | 'ebay' | 'heritage' | 'comiclink'
  matchType: 'all' | 'direct_match' | 'near_miss'
  onPlatformChange: (platform: 'all' | 'ebay' | 'heritage' | 'comiclink') => void
  onMatchTypeChange: (matchType: 'all' | 'direct_match' | 'near_miss') => void
  sortMode?: AlertsSortMode
  onSortModeChange?: (sort: AlertsSortMode) => void
  collapseState?: 'all' | 'none' | 'mixed'
  onToggleAll?: () => void
}

const COLLAPSE_ROTATION: Record<'all' | 'none' | 'mixed', string> = {
  none: 'rotate-0',      // chevron points down — all expanded
  all: '-rotate-90',     // chevron points right — all collapsed
  mixed: '-rotate-45',   // chevron points lower-right (4:30) — mixed
}

export function AlertFilters({
  platform,
  matchType,
  sortMode,
  onPlatformChange,
  onMatchTypeChange,
  onSortModeChange,
  collapseState,
  onToggleAll,
}: AlertFiltersProps) {
  const hasActiveFilters = platform !== 'all' || matchType !== 'all'

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex-shrink-0">
          <span className="text-sm font-semibold text-slate-700">Filter by:</span>
        </div>

        {/* Platform Filter */}
        <div className="min-w-0">
          <label htmlFor="platform-filter" className="sr-only">
            Platform
          </label>
          <select
            id="platform-filter"
            value={platform}
            onChange={(e) =>
              onPlatformChange(e.target.value as 'all' | 'ebay' | 'heritage' | 'comiclink')
            }
            className="w-full rounded-md border-2 border-slate-300 px-4 py-2 pr-10 text-sm outline-none transition-colors focus:border-collector-blue focus:ring-2 focus:ring-collector-blue/20 sm:w-auto"
          >
            <option value="all">All Platforms</option>
            <option value="ebay">eBay</option>
            <option value="heritage">Heritage</option>
          </select>
        </div>

        {/* Match Type Filter */}
        <div className="min-w-0">
          <label htmlFor="match-type-filter" className="sr-only">
            Match Type
          </label>
          <select
            id="match-type-filter"
            value={matchType}
            onChange={(e) =>
              onMatchTypeChange(e.target.value as 'all' | 'direct_match' | 'near_miss')
            }
            className="w-full rounded-md border-2 border-slate-300 px-4 py-2 pr-10 text-sm outline-none transition-colors focus:border-collector-blue focus:ring-2 focus:ring-collector-blue/20 sm:w-auto"
          >
            <option value="all">All Matches</option>
            <option value="direct_match">🎯 Direct Matches</option>
            <option value="near_miss">💎 Near Misses</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              onPlatformChange('all')
              onMatchTypeChange('all')
            }}
            className="whitespace-nowrap text-sm text-collector-blue hover:text-collector-navy hover:underline"
          >
            Clear Filters
          </button>
        )}

        {/* Sort Control — only on pages that support it */}
        {sortMode !== undefined && onSortModeChange && (
          <>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Sort by:</span>
              <div className="flex overflow-hidden rounded-md border-2 border-slate-300 text-sm font-medium">
                <button
                  onClick={() => onSortModeChange('date')}
                  className={`px-3 py-1.5 transition-colors ${
                    sortMode === 'date'
                      ? 'bg-collector-blue text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  By Date
                </button>
                <button
                  onClick={() => onSortModeChange('book')}
                  className={`border-l-2 border-slate-300 px-3 py-1.5 transition-colors ${
                    sortMode === 'book'
                      ? 'bg-collector-blue text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  By Book
                </button>
              </div>

              {/* Collapse-all toggle — lives inside the sort unit so it never wraps away from it */}
              {collapseState !== undefined && onToggleAll && (
                <button
                  onClick={onToggleAll}
                  aria-label={collapseState === 'all' ? 'Expand all groups' : 'Collapse all groups'}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-500 transition-colors hover:border-collector-blue hover:text-collector-blue"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${COLLAPSE_ROTATION[collapseState]}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

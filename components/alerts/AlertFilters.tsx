'use client'

interface AlertFiltersProps {
  platform: 'all' | 'ebay' | 'heritage' | 'comiclink'
  matchType: 'all' | 'direct_match' | 'near_miss'
  onPlatformChange: (platform: 'all' | 'ebay' | 'heritage' | 'comiclink') => void
  onMatchTypeChange: (matchType: 'all' | 'direct_match' | 'near_miss') => void
}

export function AlertFilters({
  platform,
  matchType,
  onPlatformChange,
  onMatchTypeChange,
}: AlertFiltersProps) {
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex-shrink-0">
          <span className="text-sm font-semibold text-slate-700">Filter by:</span>
        </div>

        {/* Platform Filter */}
        <div className="min-w-0 flex-1">
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
            <option value="heritage">Heritage (Coming Q1 2026)</option>
            <option value="comiclink">ComicLink (Coming Q1 2026)</option>
          </select>
        </div>

        {/* Match Type Filter */}
        <div className="min-w-0 flex-1">
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

        {/* Clear Filters Button (only show if filters are active) */}
        {(platform !== 'all' || matchType !== 'all') && (
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
      </div>
    </div>
  )
}

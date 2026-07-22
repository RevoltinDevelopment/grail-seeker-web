'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCard } from '@/components/alerts/AlertCard'
import { AlertFilters } from '@/components/alerts/AlertFilters'
import { AlertGroupHeader } from '@/components/alerts/AlertGroupHeader'
import { useAlerts } from '@/hooks/useAlerts'
import { useArchiveGroups } from '@/hooks/useArchiveGroups'
import { useUiPreferences } from '@/hooks/useUiPreferences'
import type { AlertsSortMode } from '@/lib/api/user'

const INITIAL_LOAD = 20
const LOAD_MORE_SIZE = 20

// Renders one By-Book group's archived alerts, paginated independently.
// Only ever mounted while its group is expanded — collapsed groups never
// call useAlerts, so a fresh page load fetches zero group alert data
// until the user manually expands something (see Dev Notes, Gap 2/3).
function ArchiveGroupAlerts({
  searchId,
  platform,
  matchType,
}: {
  searchId: string
  platform: 'all' | 'ebay' | 'heritage' | 'comiclink'
  matchType: 'all' | 'direct_match' | 'near_miss'
}) {
  const [loadedCount, setLoadedCount] = useState(INITIAL_LOAD)

  const { alerts, pagination, isLoading } = useAlerts({
    status: 'archived',
    searchId,
    platform,
    matchType,
    limit: loadedCount,
    offset: 0,
  })

  const totalAlerts = pagination?.total ?? 0
  const hasMore = alerts.length < totalAlerts

  return (
    <div className="mt-2 space-y-4 pl-2">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} isArchived />
      ))}
      {hasMore && (
        <div className="flex flex-col items-center pt-2">
          <button
            onClick={() => setLoadedCount((prev) => prev + LOAD_MORE_SIZE)}
            disabled={isLoading}
            className="rounded-md border-2 border-collector-blue px-4 py-1.5 text-sm font-semibold text-collector-blue transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more for this book ↓'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ArchiveClient() {
  const searchParams = useSearchParams()
  const searchId = searchParams.get('search')

  const [loadedCount, setLoadedCount] = useState(INITIAL_LOAD)
  const [platform, setPlatform] = useState<'all' | 'ebay' | 'heritage' | 'comiclink'>('all')
  const [matchType, setMatchType] = useState<'all' | 'direct_match' | 'near_miss'>('all')
  // Tracks EXPANDED group ids (inverse of Active Alerts' collapsed-id tracking) —
  // an empty set means every group is collapsed, which is the required default
  // on every page load (collapse state is intentionally not persisted; Gap 3).
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const { archiveSort, setArchiveSort, isLoaded: prefsLoaded } = useUiPreferences()
  const { groups, isLoading: groupsLoading, error: groupsError } = useArchiveGroups({
    platform,
    matchType,
  })

  const isBookSort = archiveSort === 'book' && !searchId

  // By Date mode (default, or a scoped ?search= deep link): flat, paginated list.
  // Always called (rules of hooks) but only rendered/relied on when !isBookSort.
  const { alerts, pagination, isLoading } = useAlerts({
    limit: loadedCount,
    offset: 0,
    platform,
    matchType,
    searchId: searchId || undefined,
    status: 'archived',
  })

  // By Book mode: group list sourced from GET /api/alerts/archive-groups —
  // NOT from fetching every archived alert (Archive has no size ceiling,
  // unlike Active Alerts' ALL_ALERTS_LIMIT, so this bounds the initial fetch
  // regardless of how large a user's lifetime archive grows — Gap 2), and
  // NOT from /api/searches either (that endpoint excludes soft-deleted
  // searches, which would silently drop a deleted search's archived alerts
  // from Book mode while Date mode still shows them — code review Decision #2).
  const groupShells = useMemo(() => {
    return groups.map((g) => ({ id: g.searchId, title: g.title, count: g.count }))
  }, [groups])

  const isGroupExpanded = useCallback(
    (id: string) => expandedGroups.has(id),
    [expandedGroups]
  )

  const toggleGroupExpanded = useCallback((id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const collapseState: 'all' | 'none' | 'mixed' = useMemo(() => {
    if (groupShells.length === 0) return 'none'
    const expandedCount = groupShells.filter((g) => expandedGroups.has(g.id)).length
    if (expandedCount === groupShells.length) return 'none' // 0 collapsed = all expanded
    if (expandedCount === 0) return 'all' // all collapsed
    return 'mixed'
  }, [groupShells, expandedGroups])

  const handleToggleAll = useCallback(() => {
    if (collapseState === 'none' || collapseState === 'mixed') {
      setExpandedGroups(new Set())
    } else {
      setExpandedGroups(new Set(groupShells.map((g) => g.id)))
    }
  }, [collapseState, groupShells])

  const handlePlatformChange = (newPlatform: 'all' | 'ebay' | 'heritage' | 'comiclink') => {
    setPlatform(newPlatform)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleMatchTypeChange = (newMatchType: 'all' | 'direct_match' | 'near_miss') => {
    setMatchType(newMatchType)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleSortModeChange = (sort: AlertsSortMode) => {
    setArchiveSort(sort)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleLoadMore = () => {
    setLoadedCount((prev) => prev + LOAD_MORE_SIZE)
  }

  const totalArchived = isBookSort
    ? groupShells.reduce((sum, g) => sum + g.count, 0)
    : pagination?.total || 0
  const displayedCount = alerts.length
  const hasMore = !isBookSort && displayedCount < totalArchived

  const initialLoading = !prefsLoaded && (isBookSort ? groupsLoading : isLoading)

  if (initialLoading) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
          <p className="mt-4 text-slate-600">Loading archive...</p>
        </div>
      </div>
    )
  }

  const isEmpty = isBookSort
    ? groupShells.length === 0 && !groupsLoading
    : alerts.length === 0 && !isLoading

  return (
    <div className="container-custom py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold">Alerts Archive</h2>
          <p className="text-slate-600">
            {totalArchived > 0
              ? `Your historical finds - ${totalArchived} archived ${totalArchived === 1 ? 'alert' : 'alerts'}`
              : 'No archived alerts yet'}
          </p>
        </div>
        <Link
          href="/alerts"
          className="text-sm font-medium text-collector-blue hover:underline"
        >
          ← Back to Active
        </Link>
      </div>

      {/* Search Filter Banner */}
      {searchId && (
        <div className="mb-6 rounded-md border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">Showing results for a specific search.</p>
            <Link
              href="/alerts/archive"
              className="rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              View all alerts
            </Link>
          </div>
        </div>
      )}

      {/* Filter + Sort Controls */}
      <AlertFilters
        platform={platform}
        matchType={matchType}
        sortMode={archiveSort}
        onPlatformChange={handlePlatformChange}
        onMatchTypeChange={handleMatchTypeChange}
        onSortModeChange={handleSortModeChange}
        collapseState={isBookSort ? collapseState : undefined}
        onToggleAll={isBookSort ? handleToggleAll : undefined}
      />

      {/* Error State (Book mode group list failed to load — don't claim "no archived alerts") */}
      {isBookSort && groupsError && (
        <div className="rounded-lg border border-error-red bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-error-red">
            Couldn't load your archive groups. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!(isBookSort && groupsError) && isEmpty && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">📦</div>
          <h3 className="mb-2 text-xl font-semibold">No archived alerts</h3>
          <p className="mx-auto mb-6 max-w-md text-slate-600">
            Alerts are automatically archived when listings expire or when you dismiss them. Your
            archive will show the history of all your discoveries.
          </p>
          <Link
            href="/alerts"
            className="inline-block rounded-md border-2 border-collector-blue px-6 py-3 font-semibold text-collector-blue transition-colors hover:bg-blue-50"
          >
            View Active Alerts →
          </Link>
        </div>
      )}

      {/* By Book mode — grouped view, per-group pagination */}
      {isBookSort && groupShells.length > 0 && (
        <div className="space-y-3">
          {groupShells.map((group) => {
            const expanded = isGroupExpanded(group.id)
            return (
              <div key={group.id}>
                <AlertGroupHeader
                  title={group.title}
                  alertCount={group.count}
                  isCollapsed={!expanded}
                  onToggle={() => toggleGroupExpanded(group.id)}
                />
                {expanded && (
                  <ArchiveGroupAlerts
                    key={`${group.id}:${platform}:${matchType}`}
                    searchId={group.id}
                    platform={platform}
                    matchType={matchType}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* By Date mode — flat list with pagination */}
      {!isBookSort && alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} isArchived={true} />
          ))}
        </div>
      )}

      {/* Load More (By Date only) */}
      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-md bg-collector-blue px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : `Load ${LOAD_MORE_SIZE} More Alerts ↓`}
          </button>
          <p className="text-sm text-slate-600">
            Showing {displayedCount} of {totalArchived} archived alerts
          </p>
        </div>
      )}

      {/* Back to Top (By Date only, long lists) */}
      {!isBookSort && alerts.length > 20 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm text-collector-blue hover:underline"
          >
            ↑ Back to Top
          </button>
        </div>
      )}
    </div>
  )
}

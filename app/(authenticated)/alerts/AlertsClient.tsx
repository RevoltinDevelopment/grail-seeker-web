'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCard } from '@/components/alerts/AlertCard'
import { AlertFilters } from '@/components/alerts/AlertFilters'
import { AlertGroupHeader } from '@/components/alerts/AlertGroupHeader'
import { useAlerts } from '@/hooks/useAlerts'
import { useUiPreferences } from '@/hooks/useUiPreferences'
import type { AlertsSortMode } from '@/lib/api/user'
import type { Alert } from '@/types/alert.types'

const INITIAL_LOAD = 20
const LOAD_MORE_SIZE = 20
const ALL_ALERTS_LIMIT = 1000

export default function AlertsClient() {
  const searchParams = useSearchParams()
  const searchId = searchParams.get('search')

  const [loadedCount, setLoadedCount] = useState(INITIAL_LOAD)
  const [platform, setPlatform] = useState<'all' | 'ebay' | 'heritage' | 'comiclink'>('all')
  const [matchType, setMatchType] = useState<'all' | 'direct_match' | 'near_miss'>('all')

  const { alertsSort, isGroupCollapsed, setAlertsSort, toggleGroupCollapsed, isLoaded: prefsLoaded } =
    useUiPreferences()

  const isBookSort = alertsSort === 'book' && !searchId

  // By Book mode fetches everything at once; By Date mode uses pagination
  const { alerts, pagination, isLoading } = useAlerts({
    limit: isBookSort ? ALL_ALERTS_LIMIT : loadedCount,
    offset: 0,
    platform,
    matchType,
    searchId: searchId || undefined,
    status: 'active',
  })

  const handlePlatformChange = (newPlatform: 'all' | 'ebay' | 'heritage' | 'comiclink') => {
    setPlatform(newPlatform)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleMatchTypeChange = (newMatchType: 'all' | 'direct_match' | 'near_miss') => {
    setMatchType(newMatchType)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleSortModeChange = (sort: AlertsSortMode) => {
    setAlertsSort(sort)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleLoadMore = () => {
    setLoadedCount((prev) => prev + LOAD_MORE_SIZE)
  }

  // Group alerts by search for By Book mode
  const groupedAlerts = useMemo(() => {
    if (!isBookSort) return null

    const groups = new Map<string, { title: string; alerts: Alert[] }>()

    for (const alert of alerts) {
      const key = alert.searchId
      if (!groups.has(key)) {
        const title = `${alert.search.series.title} #${alert.search.issueNumber}`
        groups.set(key, { title, alerts: [] })
      }
      groups.get(key)!.alerts.push(alert)
    }

    return Array.from(groups.entries())
      .map(([id, group]) => ({ id, ...group }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [alerts, isBookSort])

  const totalAlerts = pagination?.total || 0
  const displayedCount = alerts.length
  const hasMore = !isBookSort && displayedCount < totalAlerts

  if (isLoading && !prefsLoaded) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
          <p className="mt-4 text-slate-600">Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold">Active Alerts</h2>
          <p className="text-slate-600">
            {totalAlerts > 0
              ? `Showing ${isBookSort ? totalAlerts : displayedCount} of ${totalAlerts} active ${totalAlerts === 1 ? 'alert' : 'alerts'}`
              : 'Your current grail discoveries'}
          </p>
        </div>
        <Link
          href="/alerts/archive"
          className="text-sm font-medium text-collector-blue hover:underline"
        >
          View Archive →
        </Link>
      </div>

      {/* Search Filter Banner */}
      {searchId && (
        <div className="mb-6 rounded-md border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">Showing results for a specific search.</p>
            <Link
              href="/alerts"
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
        sortMode={alertsSort}
        onPlatformChange={handlePlatformChange}
        onMatchTypeChange={handleMatchTypeChange}
        onSortModeChange={handleSortModeChange}
      />

      {/* Empty State */}
      {alerts.length === 0 && !isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">🔔</div>
          <h3 className="mb-2 text-xl font-semibold">No alerts yet</h3>
          <p className="mx-auto mb-6 max-w-md text-slate-600">
            We're monitoring eBay for your grails. You'll be notified via SMS the moment we find
            one.
          </p>
          <Link
            href="/searches/new"
            className="inline-block rounded-md border-2 border-collector-blue px-6 py-3 font-semibold text-collector-blue transition-colors hover:bg-blue-50"
          >
            Create Search →
          </Link>
        </div>
      )}

      {/* By Book mode — grouped view */}
      {isBookSort && groupedAlerts && groupedAlerts.length > 0 && (
        <div className="space-y-3">
          {groupedAlerts.map((group) => {
            const collapsed = isGroupCollapsed(group.id)
            return (
              <div key={group.id}>
                <AlertGroupHeader
                  title={group.title}
                  alertCount={group.alerts.length}
                  isCollapsed={collapsed}
                  onToggle={() => toggleGroupCollapsed(group.id)}
                />
                {!collapsed && (
                  <div className="mt-2 space-y-4 pl-2">
                    {group.alerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
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
            <AlertCard key={alert.id} alert={alert} />
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
            Showing {displayedCount} of {totalAlerts} alerts
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

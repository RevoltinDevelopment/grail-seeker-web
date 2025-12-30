'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCard } from '@/components/alerts/AlertCard'
import { AlertFilters } from '@/components/alerts/AlertFilters'
import { useAlerts } from '@/hooks/useAlerts'

const INITIAL_LOAD = 20
const LOAD_MORE_SIZE = 20

export default function ArchiveClient() {
  const [loadedCount, setLoadedCount] = useState(INITIAL_LOAD)
  const [platform, setPlatform] = useState<'all' | 'ebay' | 'heritage' | 'comiclink'>('all')
  const [matchType, setMatchType] = useState<'all' | 'direct_match' | 'near_miss'>('all')

  const { alerts, pagination, isLoading } = useAlerts({
    limit: loadedCount,
    offset: 0,
    platform,
    matchType,
    status: 'archived', // Archive system: Show only archived alerts
  })

  // Reset loaded count when filters change
  const handlePlatformChange = (newPlatform: 'all' | 'ebay' | 'heritage' | 'comiclink') => {
    setPlatform(newPlatform)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleMatchTypeChange = (newMatchType: 'all' | 'direct_match' | 'near_miss') => {
    setMatchType(newMatchType)
    setLoadedCount(INITIAL_LOAD)
  }

  const handleLoadMore = () => {
    setLoadedCount((prev) => prev + LOAD_MORE_SIZE)
  }

  const totalAlerts = pagination?.total || 0
  const displayedCount = alerts.length
  const hasMore = displayedCount < totalAlerts

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
          <p className="mt-4 text-slate-600">Loading archive...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold">Alerts Archive</h2>
          <p className="text-slate-600">
            {totalAlerts > 0
              ? `Your historical finds - ${totalAlerts} archived ${totalAlerts === 1 ? 'alert' : 'alerts'}`
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

      {/* Filter Controls */}
      <AlertFilters
        platform={platform}
        matchType={matchType}
        onPlatformChange={handlePlatformChange}
        onMatchTypeChange={handleMatchTypeChange}
      />

      {/* Empty State */}
      {alerts.length === 0 && !isLoading && (
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

      {/* Alert Cards List */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} isArchived={true} />
          ))}
        </div>
      )}

      {/* Load More Button */}
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
            Showing {displayedCount} of {totalAlerts} archived alerts
          </p>
        </div>
      )}

      {/* Back to Top Link (for long lists) */}
      {alerts.length > 20 && (
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

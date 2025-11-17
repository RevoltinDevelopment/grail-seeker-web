'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCard } from '@/components/alerts/AlertCard'
import { AlertFilters } from '@/components/alerts/AlertFilters'
import { useAlerts } from '@/hooks/useAlerts'

const INITIAL_LOAD = 20
const LOAD_MORE_SIZE = 20

export default function AlertsClient() {
  const [loadedCount, setLoadedCount] = useState(INITIAL_LOAD)
  const [platform, setPlatform] = useState<'all' | 'ebay' | 'heritage' | 'comiclink'>('all')
  const [matchType, setMatchType] = useState<'all' | 'direct_match' | 'near_miss'>('all')

  const { alerts, pagination, isLoading } = useAlerts({
    limit: loadedCount,
    offset: 0,
    platform,
    matchType,
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
          <p className="mt-4 text-slate-600">Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">All Alerts</h2>
          <p className="text-slate-600">
            {totalAlerts > 0
              ? `Showing ${displayedCount} of ${totalAlerts} ${totalAlerts === 1 ? 'alert' : 'alerts'}`
              : 'Your grail discoveries'}
          </p>
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

        {/* Alert Cards List */}
        {alerts.length > 0 && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
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
              Showing {displayedCount} of {totalAlerts} alerts
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

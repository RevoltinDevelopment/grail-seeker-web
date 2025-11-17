'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCard } from '@/components/alerts/AlertCard'
import { useToast } from '@/contexts/ToastContext'
import { useAlerts } from '@/hooks/useAlerts'
import { useSearches } from '@/hooks/useSearches'

export default function DashboardClient() {
  const { showToast } = useToast()
  const { searches, isLoading: isLoadingSearches } = useSearches()
  const { alerts, isLoading: isLoadingAlerts } = useAlerts({ limit: 2 }, { enableToasts: true })

  // Listen for new alert events and show toasts
  useEffect(() => {
    const handleNewAlert = () => {
      showToast(
        '🎯 New Grail Found!',
        `A new match has been found for one of your searches. Check your alerts to see details.`,
        'success',
        8000
      )

      // Optional: Play a sound
      // const audio = new Audio('/notification.mp3')
      // audio.play().catch(e => console.log('Audio play failed:', e))
    }

    window.addEventListener('new-alert', handleNewAlert)

    return () => {
      window.removeEventListener('new-alert', handleNewAlert)
    }
  }, [showToast])

  // Calculate stats
  const activeSearchesCount = searches.filter((s) => s.isActive).length
  const totalAlertsCount = searches.reduce((sum, s) => sum + (s.alertCount || 0), 0)
  const recentAlerts = alerts.slice(0, 2)

  if (isLoadingSearches || isLoadingAlerts) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">Dashboard</h2>
          <p className="text-slate-600">Your grail hunting overview</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Searches */}
          <Link
            href="/searches"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-600">Total Searches</h3>
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-3xl font-bold text-collector-navy">{searches.length}</p>
            <p className="mt-1 text-xs text-slate-500">{activeSearchesCount} active</p>
          </Link>

          {/* Active Searches */}
          <Link
            href="/searches"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-600">Active Monitoring</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-success-green">{activeSearchesCount}</p>
            <p className="mt-1 text-xs text-slate-500">
              {searches.length - activeSearchesCount} paused
            </p>
          </Link>

          {/* Total Alerts */}
          <Link
            href="/alerts"
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-600">Alerts Found</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-collector-blue">{totalAlertsCount}</p>
            <p className="mt-1 text-xs text-slate-500">All time matches</p>
          </Link>
        </div>

        {/* Recent Alerts Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent Alerts</h2>
              <p className="text-sm text-slate-600">Your latest grail discoveries</p>
            </div>
            {recentAlerts.length > 0 && (
              <Link
                href="/alerts"
                className="text-sm font-medium text-collector-blue hover:underline"
              >
                View All →
              </Link>
            )}
          </div>

          {recentAlerts.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">🔔</div>
              <h3 className="mb-2 text-xl font-semibold">No matches yet</h3>
              <p className="mx-auto mb-6 max-w-md text-slate-600">
                We're monitoring eBay for your grails. You'll be notified via SMS the moment we find
                one.
              </p>
              {searches.length === 0 && (
                <Link
                  href="/searches/new"
                  className="inline-block rounded-md bg-collector-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Create Your First Search
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Active Searches Preview */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Active Searches</h2>
              <p className="text-sm text-slate-600">Quick view of your monitoring</p>
            </div>
            <Link
              href="/searches"
              className="text-sm font-medium text-collector-blue hover:underline"
            >
              Manage All →
            </Link>
          </div>

          {searches.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">🔍</div>
              <h3 className="mb-2 text-xl font-semibold">No searches yet</h3>
              <p className="mb-6 text-slate-600">
                Create your first grail search to start monitoring.
              </p>
              <Link
                href="/searches/new"
                className="inline-block rounded-md border-2 border-collector-blue px-6 py-3 font-semibold text-collector-blue transition-colors hover:bg-blue-50"
              >
                Create Search →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searches.slice(0, 6).map((search) => (
                <div
                  key={search.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-sm font-semibold">
                      {search.series.title} #{search.issueNumber}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        search.isActive
                          ? 'bg-success-green text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {search.isActive ? '✓' : '⏸'}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-slate-600">
                    Vol. {search.series.volume} ({search.series.yearRange})
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      {search.alertCount || 0} {search.alertCount === 1 ? 'alert' : 'alerts'}
                    </span>
                    {search.maxPrice && (
                      <span className="text-slate-600">
                        Max: ${search.maxPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {searches.length > 0 && (
          <div className="mt-8">
            <Link
              href="/searches/new"
              className="block w-full rounded-md bg-collector-blue px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-blue-800 md:inline-block md:w-auto md:px-6 md:py-3"
            >
              + Create New Search
            </Link>
          </div>
        )}
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAlerts } from '@/hooks/useAlerts'
import { useSearches } from '@/hooks/useSearches'
import { useToast } from '@/contexts/ToastContext'
import Header from '@/components/layout/Header'
import type { User } from '@supabase/supabase-js'

export default function DashboardClient({ user }: { user: User }) {
  const { showToast } = useToast()
  const { searches, isLoading: isLoadingSearches } = useSearches()
  const { alerts, isLoading: isLoadingAlerts } = useAlerts({ limit: 3 }, { enableToasts: true })

  // Listen for new alert events and show toasts
  useEffect(() => {
    const handleNewAlert = (event: Event) => {
      const customEvent = event as CustomEvent
      const alert = customEvent.detail?.alert

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
  const recentAlerts = alerts.slice(0, 3)

  if (isLoadingSearches || isLoadingAlerts) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header user={user} />

        <main className="container-custom py-12">
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />

      {/* Main Content */}
      <main className="container-custom py-12">
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
                <div
                  key={alert.id}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-semibold">
                        {alert.search.series.title} #{alert.search.issueNumber}
                      </h3>
                      <p className="mb-3 text-sm text-slate-600">{alert.listing.title}</p>

                      <div className="mb-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">Price:</span>
                          <span className="font-semibold text-collector-navy">
                            ${alert.listing.price.toLocaleString()}
                          </span>
                        </div>
                        {alert.listing.grade && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Grade:</span>
                            <span className="font-semibold">{alert.listing.grade}</span>
                          </div>
                        )}
                        {alert.listing.gradingAuthority && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Graded by:</span>
                            <span className="font-semibold uppercase">
                              {alert.listing.gradingAuthority}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {alert.isDirectMatch && (
                          <span className="inline-flex items-center rounded-full bg-success-green px-2 py-1 text-xs font-semibold text-white">
                            ✓ Direct Match
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(alert.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {alert.listing.url && (
                      <a
                        href={alert.listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 whitespace-nowrap rounded-md bg-collector-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                      >
                        View on eBay →
                      </a>
                    )}
                  </div>
                </div>
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
          <div className="mt-8 flex justify-center">
            <Link
              href="/searches/new"
              className="rounded-md bg-collector-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
            >
              + Create New Search
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { PlatformNudgeBanner } from '@/components/dashboard/PlatformNudgeBanner'
import { LatestMatches } from '@/components/searches/LatestMatches'
import { useToast } from '@/contexts/ToastContext'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useSearches } from '@/hooks/useSearches'
import { searchesSummary } from '@/lib/utils/searches-summary'
import { formatIssueNumber, formatSeriesShort } from '@/lib/utils/series-formatter'

export default function SearchesClient() {
  const { searches, isLoading, error, deleteSearch, updateSearchStatus } = useSearches()
  // Story 1.49: the Independent Shops group renders as one aggregate pill,
  // never one pill per store -- see ux-design-independent-shops-platform-selector.md.
  const { groups } = usePlatforms()
  const indieGroup = groups.find((g) => g.label !== 'Core')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { showToast } = useToast()

  // Story 1.82: the new-match toast moved here from the Dashboard. Latest matches' realtime
  // subscription raises 'new-alert' when a match is found while the page is open.
  useEffect(() => {
    const onNewAlert = () =>
      showToast(
        'New match found',
        'A new match has been found for one of your searches. Check your alerts to see details.',
        'success',
        8000
      )
    window.addEventListener('new-alert', onNewAlert)
    return () => window.removeEventListener('new-alert', onNewAlert)
  }, [showToast])

  const handleDelete = async (id: string) => {
    await deleteSearch.mutateAsync(id)
    setDeleteConfirmId(null)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await updateSearchStatus.mutateAsync({ id, isActive: !currentStatus })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 tablet:px-8">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading searches...</p>
        </div>
      </div>
    )
  }

  // Story 1.82 (U-04): Searches is the app's home, in the drawn order (searches-home.html):
  // the marketplace nudge (the attention banner, U-05), the title with the line that replaces the
  // Dashboard's stat cards and New search, then Latest matches beside the list from 1,000 pixels
  // and above it below that. The cards themselves are U-05's.
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <PlatformNudgeBanner searches={searches} />

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
            Searches
          </h1>
          {searches.length > 0 && (
            <p className="mt-1 text-[15px] text-muted-foreground">{searchesSummary(searches)}</p>
          )}
        </div>
        <Link
          href="/searches/new"
          className="inline-flex min-h-touch items-center gap-2 rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline hover:bg-chip"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New search
        </Link>
      </div>

      <div className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_300px] desktop:items-start">
        <LatestMatches className="desktop:col-start-2 desktop:row-start-1" />

        <section
          className="desktop:col-start-1 desktop:row-start-1"
          aria-labelledby="your-searches-h"
        >
          <h2 id="your-searches-h" className="sr-only">
            Your searches
          </h2>

          {/* A failed load says so; it must never look like an account with no searches */}

          {error && (
            <p
              className="rounded-card border border-line bg-surface px-5 py-4 text-[15px] text-ink"
              role="alert"
            >
              Your searches could not be loaded. Refresh the page to try again.
            </p>
          )}

          {/* Empty state: does the Dashboard's welcoming (UX plan section 10) */}
          {!error && searches.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-10 text-center">
              <h3 className="text-[19px] font-bold text-ink">Start your first search</h3>
              <p className="max-w-[460px] text-[15px] text-muted-foreground">
                A search is one book, in the grades you want, at the price you&apos;ll pay. We check
                the marketplaces for it twice a day and tell you the moment we find one.
              </p>
              <Link
                href="/searches/new"
                className="inline-flex min-h-touch items-center rounded-button bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline"
              >
                Create your first search
              </Link>
            </div>
          )}

          {/* Search Cards Grid */}
          {searches.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
                >
                  {/* Series Title */}
                  <h3 className="mb-1 text-lg font-semibold">
                    {search.series.title}{' '}
                    {formatIssueNumber(search.issueNumber, search.issueVolumeText)}
                  </h3>
                  <p className="mb-4 text-sm text-slate-600">{formatSeriesShort(search.series)}</p>

                  {/* Search Criteria */}
                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Max Price:</span>
                      <span className="font-medium">
                        {search.maxPrice ? `$${search.maxPrice.toLocaleString()}` : 'Any'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Grade:</span>
                      <span className="font-medium">
                        {search.gradeMin && search.gradeMax
                          ? `${Number(search.gradeMin).toFixed(1)} - ${Number(search.gradeMax).toFixed(1)}`
                          : 'Any'}
                      </span>
                    </div>
                    {search.pageQuality && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pages:</span>
                        <span className="font-medium">{search.pageQuality}</span>
                      </div>
                    )}
                    {search.gradingAuthority && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Graded by:</span>
                        <span className="font-medium uppercase">{search.gradingAuthority}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        search.isActive
                          ? 'bg-success-green text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {search.isActive ? '✅ Active' : '⏸ Paused'}
                    </span>
                    {(search.currentAlertCount ?? 0) > 0 && (
                      <Link
                        href={`/alerts?search=${search.id}`}
                        className="ml-2 text-sm font-medium text-collector-blue hover:underline"
                      >
                        {search.currentAlertCount}{' '}
                        {search.currentAlertCount === 1 ? 'alert' : 'alerts'}
                      </Link>
                    )}
                    {(search.currentAlertCount ?? 0) > 0 &&
                      (search.archivedAlertCount ?? 0) > 0 && (
                        <span className="ml-2 text-sm text-slate-600">+</span>
                      )}
                    {(search.archivedAlertCount ?? 0) > 0 && (
                      <Link
                        href={`/alerts/archive?search=${search.id}`}
                        className="ml-2 text-sm font-medium text-collector-blue hover:underline"
                      >
                        {search.archivedAlertCount} archived
                      </Link>
                    )}
                    {(search.currentAlertCount ?? 0) === 0 &&
                      (search.archivedAlertCount ?? 0) === 0 && (
                        <span className="ml-2 text-sm text-slate-600">0 alerts</span>
                      )}
                  </div>

                  {/* Platforms — disabled platforms render grayed out with no check
                  so the card never claims monitoring that isn't happening (C1) */}
                  <div className="mb-4">
                    <p className="mb-1 text-xs text-slate-600">Monitoring:</p>
                    <div className="flex flex-wrap gap-1">
                      {search.platforms.includes('ebay') ? (
                        <span className="rounded bg-ebay-red px-2 py-1 text-xs text-white">
                          eBay ✓
                        </span>
                      ) : (
                        <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-400">
                          eBay
                        </span>
                      )}
                      {search.platforms.includes('heritage') ? (
                        <span
                          className="rounded px-2 py-1 text-xs text-white"
                          style={{ backgroundColor: '#8B4513' }}
                        >
                          Heritage ✓
                        </span>
                      ) : (
                        <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-400">
                          Heritage
                        </span>
                      )}
                      {search.platforms.includes('mycomicshop') ? (
                        <span className="rounded bg-mycomicshop-blue px-2 py-1 text-xs text-white">
                          MyComicShop ✓
                        </span>
                      ) : (
                        <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-400">
                          MyComicShop
                        </span>
                      )}
                      {indieGroup &&
                        indieGroup.platforms.length > 0 &&
                        (() => {
                          const total = indieGroup.platforms.length
                          const active = indieGroup.platforms.filter((p) =>
                            search.platforms.includes(p.slug)
                          ).length
                          if (active === 0) {
                            return (
                              <span className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-400">
                                {indieGroup.label}
                              </span>
                            )
                          }
                          const label = active === total ? `(${active})` : `(${active} of ${total})`
                          return (
                            <span className="rounded bg-collector-navy px-2 py-1 text-xs text-white">
                              {indieGroup.label} {label} ✓
                            </span>
                          )
                        })()}
                    </div>
                  </div>

                  {/* Metadata */}
                  <p className="mb-4 text-xs text-slate-500">
                    {search.lastCheckedAt
                      ? `Last checked: ${new Date(search.lastCheckedAt).toLocaleString()}`
                      : search.nextScheduledRunAt
                        ? `First search runs: ${new Date(search.nextScheduledRunAt).toLocaleString()}`
                        : 'Not yet checked'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/searches/${search.id}/edit`}
                      className="flex-1 rounded-md border-2 border-collector-blue px-3 py-2 text-center text-sm font-semibold text-collector-blue transition-colors hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(search.id, search.isActive)}
                      disabled={updateSearchStatus.isPending}
                      className="flex-1 rounded-md border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      {search.isActive ? '⏸ Pause' : '▶️ Resume'}
                    </button>
                  </div>

                  {/* Delete Button */}
                  {deleteConfirmId === search.id ? (
                    <div className="mt-3 rounded-md border border-error-red bg-red-50 p-3">
                      <p className="mb-2 text-sm font-medium text-error-red">Delete this search?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(search.id)}
                          disabled={deleteSearch.isPending}
                          className="flex-1 rounded-md bg-error-red px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteSearch.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 rounded-md border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(search.id)}
                      className="mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold text-error-red transition-colors hover:bg-red-50"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

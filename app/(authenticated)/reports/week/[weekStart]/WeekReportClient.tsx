'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWeekReport } from '@/hooks/useReports'
import { formatIssueNumber } from '@/lib/utils/series-formatter'
import type { BookFound } from '@/types/report.types'

interface Props {
  weekStart: string
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00Z')
  const end = new Date(weekStart + 'T00:00:00Z')
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-US', opts)}`
}

function StatRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-collector-navy">{value}</span>
    </div>
  )
}

function BooksFoundSection({ items }: { items: BookFound[] }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="py-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Books Found</p>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-collector-navy">{items.length}</span>
        {!expanded && (
          <button onClick={() => setExpanded(true)} className="text-xs text-collector-blue hover:underline">
            show all
          </button>
        )}
      </div>
      {expanded && (
        <>
          <div className="mt-2 space-y-2">
            {sorted.map((b) => {
              const isActive = b.listingStatus === 'active'
              const href = isActive ? (b.listingUrl ?? '/alerts') : '/alerts/archive'
              return isActive ? (
                <a
                  key={b.alertId}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors hover:border-collector-blue hover:bg-blue-50"
                >
                  <span className="font-medium text-collector-navy">{b.title}</span>
                  <span className="ml-2 shrink-0 text-collector-blue">↗</span>
                </a>
              ) : (
                <Link
                  key={b.alertId}
                  href={href}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors hover:border-collector-blue hover:bg-blue-50"
                >
                  <span className="font-medium text-collector-navy">{b.title}</span>
                  <span className="ml-2 shrink-0 text-slate-400">archive →</span>
                </Link>
              )
            })}
          </div>
          <button onClick={() => setExpanded(false)} className="mt-2 text-xs text-collector-blue hover:underline">
            hide all
          </button>
        </>
      )}
    </div>
  )
}

export default function WeekReportClient({ weekStart }: Props) {
  const { report, isLoading } = useWeekReport(weekStart)

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue" />
          <p className="mt-4 text-slate-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container-custom py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">📭</div>
          <h3 className="mb-2 text-xl font-semibold">No report found</h3>
          <p className="mb-6 text-slate-600">No data available for this week.</p>
          <Link href="/reports" className="text-sm font-medium text-collector-blue hover:underline">
            ← Back to Reports
          </Link>
        </div>
      </div>
    )
  }

  const totalSearches = report.ebaySearchesRun + report.heritageSearchesRun
  const hasFinds = report.alertsIssued > 0

  return (
    <div className="container-custom py-12">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/reports" className="text-sm font-medium text-collector-blue hover:underline">
          ← Back to Reports
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h2 className="mb-1 text-3xl font-bold">Week of {formatWeekRange(weekStart)}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          Complete
        </span>
      </div>

      {/* Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {/* Headline */}
        <div className="mb-5 rounded-md bg-slate-50 p-4">
          {hasFinds ? (
            <p className="font-semibold text-collector-navy">
              We found{' '}
              <span className="text-collector-blue">
                {report.alertsIssued} {report.alertsIssued === 1 ? 'book' : 'books'}
              </span>{' '}
              matching your searches this week.
            </p>
          ) : totalSearches > 0 ? (
            <p className="font-semibold text-collector-navy">
              We ran{' '}
              <span className="text-collector-blue">{totalSearches} {totalSearches === 1 ? 'search' : 'searches'}</span>{' '}
              on eBay this week on your behalf.{' '}
              <span className="text-slate-500">No matches that week.</span>
            </p>
          ) : (
            <p className="text-slate-600">No monitoring activity recorded for this week.</p>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {/* Books searched — sorted alphabetically */}
          {report.booksSearched.length > 0 && (
            <div className="py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Books Searched
              </p>
              {[...report.booksSearched]
                .sort((a, b) =>
                  a.seriesTitle.localeCompare(b.seriesTitle) ||
                  a.issueNumber.localeCompare(b.issueNumber)
                )
                .map((b, i) => (
                  <p key={i} className="text-sm text-slate-700">
                    {b.seriesTitle} {formatIssueNumber(b.issueNumber, b.issueVolumeText)}
                  </p>
                ))}
            </div>
          )}

          {/* Execution counts */}
          {(report.ebaySearchesRun > 0 || report.heritageSearchesRun > 0) && (
            <div className="py-3">
              <StatRow label="eBay searches run" value={report.ebaySearchesRun} />
              <StatRow label="Heritage searches run" value={report.heritageSearchesRun} />
            </div>
          )}

          {/* Books found — togglable, sorted alphabetically, with contextual links */}
          <BooksFoundSection items={report.booksFound} />

          {/* Lifecycle stats */}
          {(report.searchesCreated > 0 ||
            report.searchesDeleted > 0 ||
            report.alertsArchived > 0 ||
            report.alertsDismissed > 0) && (
            <div className="py-3">
              <StatRow label="Searches created" value={report.searchesCreated} />
              <StatRow label="Searches deleted" value={report.searchesDeleted} />
              <StatRow label="Alerts archived" value={report.alertsArchived} />
              <StatRow label="Alerts dismissed" value={report.alertsDismissed} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

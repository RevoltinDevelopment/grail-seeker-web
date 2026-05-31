'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useReports } from '@/hooks/useReports'
import type { WeekReport, PastWeekSummary, BookFound, BookSearched } from '@/types/report.types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00Z')
  const end = new Date(weekStart + 'T00:00:00Z')
  end.setUTCDate(end.getUTCDate() + 6)

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
  const endOpts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', endOpts)}`
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function totalSearches(report: Pick<WeekReport, 'ebaySearchesRun' | 'heritageSearchesRun'>): number {
  return report.ebaySearchesRun + report.heritageSearchesRun
}

// ─── stat row — only renders when value > 0 ──────────────────────────────────

function StatRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-collector-navy">{value}</span>
    </div>
  )
}

// ─── books searched list ──────────────────────────────────────────────────────

function BooksList({ items }: { items: BookSearched[] }) {
  if (items.length === 0) return null
  const sorted = [...items].sort((a, b) =>
    a.seriesTitle.localeCompare(b.seriesTitle) || a.issueNumber.localeCompare(b.issueNumber)
  )
  return (
    <div className="mt-1 space-y-0.5">
      {sorted.map((b, i) => (
        <p key={i} className="text-sm text-slate-700">
          {b.seriesTitle} #{b.issueNumber}
        </p>
      ))}
    </div>
  )
}

// ─── books found section (togglable) ─────────────────────────────────────────
// withLinks=true: current-week card — active alerts link to listing, archived to /alerts/archive
// withLinks=false: all-time card — plain text only (most will be archived, links add no value)

function BooksFoundSection({ items, withLinks }: { items: BookFound[]; withLinks: boolean }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Books Found</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-collector-navy">{items.length}</span>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-collector-blue hover:underline"
          >
            show all
          </button>
        )}
      </div>

      {expanded && (
        <>
          <div className="mt-2 space-y-2">
            {sorted.map((b) => {
              if (!withLinks) {
                return (
                  <div
                    key={b.alertId}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-collector-navy"
                  >
                    {b.title}
                  </div>
                )
              }
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
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs text-collector-blue hover:underline"
          >
            hide all
          </button>
        </>
      )}
    </div>
  )
}

// ─── week card ────────────────────────────────────────────────────────────────

function WeekCard({
  report,
  isCurrentWeek = false,
  withLinks = false,
}: {
  report: WeekReport
  isCurrentWeek?: boolean
  withLinks?: boolean
}) {
  const searches = totalSearches(report)
  const hasFinds = report.alertsIssued > 0
  const hasAnyActivity = searches > 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-collector-navy">
              {isCurrentWeek ? 'This Week' : 'All Time'}
            </h3>
            {isCurrentWeek && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-collector-blue">
                In Progress
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {isCurrentWeek
              ? formatWeekRange(report.weekStart)
              : `Since you joined`}
          </p>
        </div>
      </div>

      {/* Headline — adapts to finds vs no-finds */}
      <div className="mb-5 rounded-md bg-slate-50 p-4">
        {hasFinds ? (
          <p className="font-semibold text-collector-navy">
            We found{' '}
            <span className="text-collector-blue">
              {report.alertsIssued} {report.alertsIssued === 1 ? 'book' : 'books'}
            </span>{' '}
            matching your searches{isCurrentWeek ? ' this week' : ' since you joined'}.
          </p>
        ) : hasAnyActivity ? (
          <p className="font-semibold text-collector-navy">
            We ran{' '}
            <span className="text-collector-blue">{searches} {searches === 1 ? 'search' : 'searches'}</span>{' '}
            on eBay{isCurrentWeek ? ' this week' : ' since you joined'} on your behalf.{' '}
            <span className="text-slate-500">Still hunting.</span>
          </p>
        ) : (
          <p className="text-slate-600">
            Your first report is on its way — we check eBay at 9 AM and 7 PM EST every day.
          </p>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {/* Books searched */}
        {report.booksSearched.length > 0 && (
          <div className="py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Books Searched
            </p>
            <BooksList items={report.booksSearched} />
          </div>
        )}

        {/* Search execution counts */}
        {(report.ebaySearchesRun > 0 || report.heritageSearchesRun > 0) && (
          <div className="py-3">
            <StatRow label="eBay searches run" value={report.ebaySearchesRun} />
            <StatRow label="Heritage searches run" value={report.heritageSearchesRun} />
          </div>
        )}

        {/* Alerts & finds */}
        <BooksFoundSection items={report.booksFound} withLinks={withLinks} />

        {/* Active searches — current week only */}
        {isCurrentWeek && report.activeSearches !== undefined && report.activeSearches > 0 && (
          <div className="py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Active searches</span>
              <span className="font-semibold text-collector-navy">{report.activeSearches}</span>
            </div>
          </div>
        )}

        {/* Search & alert lifecycle — only show non-zero rows */}
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
  )
}

// ─── past weeks list ──────────────────────────────────────────────────────────

function PastWeeksList({ weeks }: { weeks: PastWeekSummary[] }) {
  if (weeks.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 text-lg font-bold text-collector-navy">Past Reports</h3>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Week
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                eBay Searches
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                Alerts
              </th>
              <th className="w-8 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weeks.map((week) => (
              <tr
                key={week.weekStart}
                className={`transition-colors hover:bg-slate-50 ${
                  week.alertsIssued > 0 ? '' : 'opacity-60'
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/reports/week/${week.weekStart}`}
                    className="font-medium text-collector-navy hover:text-collector-blue hover:underline"
                  >
                    Week of {formatWeekLabel(week.weekStart)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {week.ebaySearchesRun}
                </td>
                <td className="px-4 py-3 text-right">
                  {week.alertsIssued > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {week.alertsIssued}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">
                  <Link href={`/reports/week/${week.weekStart}`}>→</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── email toggle placeholder ─────────────────────────────────────────────────

function EmailTogglePlaceholder() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xl">📬</span>
        <div>
          <p className="text-sm font-semibold text-collector-navy">
            Get this report in your inbox every Sunday evening
          </p>
          <p className="text-xs text-slate-500">Weekly email digest</p>
        </div>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        Coming soon
      </span>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ReportsClient() {
  const { report, isLoading, error } = useReports()

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue" />
          <p className="mt-4 text-slate-600">Loading your report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container-custom py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">📊</div>
          <h3 className="mb-2 text-xl font-semibold">Report unavailable</h3>
          <p className="text-slate-600">Unable to load your report. Please try again later.</p>
          {error && (
            <p className="mt-3 rounded bg-red-50 px-3 py-2 text-left text-xs font-mono text-red-700">
              {String(error)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold">Reports</h2>
        <p className="text-slate-600">Everything we're doing for you, week by week</p>
      </div>

      {/* Email toggle placeholder */}
      <div className="mb-8">
        <EmailTogglePlaceholder />
      </div>

      {/* Current week + All time side by side on md+ */}
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <WeekCard report={report.currentWeek} isCurrentWeek={true} withLinks={true} />
        <WeekCard report={report.allTime as WeekReport} withLinks={false} />
      </div>

      {/* Past weeks */}
      <PastWeeksList weeks={report.pastWeeks} />

      {/* Tracking since note */}
      <p className="mt-6 text-center text-xs text-slate-400">
        eBay search counts tracked since{' '}
        {new Date(report.trackingSince + 'T00:00:00Z').toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        })}
      </p>
    </div>
  )
}

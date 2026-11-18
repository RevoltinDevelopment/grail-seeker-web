'use client'

/**
 * Story 1.100 (U-14): Reports, as drawn in reports-overview.html (approved by Mahan 2026-10-28).
 * This week, an accounting since the account was made, and past weeks as a list that never scrolls
 * sideways. The weekly email is hidden until it is real. Words: lib/reportRows.ts.
 */
import Link from 'next/link'

import {
  BooksList,
  EmptyState,
  FootNote,
  FoundList,
  HeadlineBox,
  KeyValueRows,
  PageTitle,
  Panel,
  Section,
  Tag,
} from '@/components/reports/ReportParts'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useReports } from '@/hooks/useReports'
import { totalSearchesRun } from '@/lib/constants/marketplaceDisplayOrder'
import {
  allTimeHeadline,
  booksSearchedRows,
  foundRows,
  keptFromLine,
  lifecycleRows,
  pastWeekSummary,
  searchesRunRows,
  seeAllText,
  sinceRange,
  tallyRows,
  thisWeekHeadline,
  weekLabel,
  weekRange,
} from '@/lib/reportRows'

import type { ReportsResponse } from '@/types/report.types'

/** Something happened to searches or alerts, even before any search ran (review). */
function anyLife(r: { searchesCreated: number; searchesDeleted: number; alertsArchived: number; alertsDismissed: number }): boolean {
  return r.searchesCreated + r.searchesDeleted + r.alertsArchived + r.alertsDismissed > 0
}

function ThisWeek({ report, displayNameFor }: { report: ReportsResponse; displayNameFor: (s: string) => string }) {
  const week = report.currentWeek
  const runs = totalSearchesRun(week.searchesRunByMarketplace)
  const copies = week.copiesFound ?? []
  const joined = report.joinedAt ? new Date(report.joinedAt) : null
  const firstWeek =
    joined && Number.isFinite(joined.getTime()) && week.weekStart
      ? joined.toISOString().slice(0, 10) >= week.weekStart
      : report.pastWeeks.length === 0
  const run = searchesRunRows(week.searchesRunByMarketplace, displayNameFor)
  const books = booksSearchedRows(week.booksSearched)
  return (
    <Panel label="This week">
      <div>
        <h2 className="text-card-title font-bold leading-[1.3] text-ink">
          This week <Tag>In progress</Tag>
        </h2>
        {week.weekStart && <p className="mt-0.5 text-sm text-muted-foreground">{weekRange(week.weekStart)}</p>}
      </div>
      <HeadlineBox headline={thisWeekHeadline({ copies: copies.length, searchesRun: runs, firstWeek, alerts: week.alertsIssued })} />
      {copies.length > 0 && (
        <Section title={`Books found · ${copies.length}`}>
          <FoundList rows={foundRows(copies, displayNameFor)} />
        </Section>
      )}
      {run.length > 0 && (
        <Section title="Searches run">
          <KeyValueRows rows={run} />
        </Section>
      )}
      {books.length > 0 && (
        <Section title={`Books searched · ${books.length}`}>
          <BooksList rows={books} />
        </Section>
      )}
      {(runs > 0 || anyLife(week)) && (
        <Section title="Your searches and alerts">
          <KeyValueRows rows={lifecycleRows(week, 'week')} />
        </Section>
      )}
    </Panel>
  )
}

function SinceYouJoined({ report, displayNameFor }: { report: ReportsResponse; displayNameFor: (s: string) => string }) {
  const all = report.allTime
  const runs = totalSearchesRun(all.searchesRunByMarketplace)
  const copies = all.copiesFound ?? 0
  const tally = tallyRows(all.booksFoundTally)
  const range = sinceRange(report.joinedAt)
  const books = booksSearchedRows(all.booksSearched)
  return (
    <Panel label="Since you joined">
      <div>
        <h2 className="text-card-title font-bold leading-[1.3] text-ink">
          Since you joined <Tag>All time</Tag>
        </h2>
        {range && <p className="mt-0.5 text-sm text-muted-foreground">{range}</p>}
      </div>
      <HeadlineBox headline={allTimeHeadline({ copies, searchesRun: runs })} />
      {copies > 0 && (
        <Section title={`Books found · ${copies.toLocaleString('en-US')}`}>
          <ul className="m-0 flex list-none flex-col p-0">
            {tally.rows.map((b) => (
              <li key={b.key} className="flex items-baseline justify-between gap-3 border-t border-line py-2 first:border-t-0 first:pt-0.5">
                <span className="min-w-0 text-[15px] font-semibold text-ink">{b.t}</span>
                <span className="flex-none text-right text-[15px] tabular-nums text-muted-foreground">{b.nLabel}</span>
              </li>
            ))}
          </ul>
          {tally.more && <p className="text-sm text-muted-foreground">{tally.more}</p>}
          <p className="flex flex-wrap gap-x-5">
            <Link
              href="/reports/books-found"
              className="inline-flex min-h-touch items-center text-[15px] font-semibold text-link underline underline-offset-[3px]"
            >
              {seeAllText(copies)}
            </Link>
          </p>
        </Section>
      )}
      {runs > 0 && (
        <Section title="Searches run">
          <KeyValueRows rows={searchesRunRows(all.searchesRunByMarketplace, displayNameFor)} />
        </Section>
      )}
      {books.length > 0 && (
        <Section title={`Books searched · ${books.length}`}>
          <BooksList rows={books} />
        </Section>
      )}
      {(runs > 0 || anyLife(all)) && (
        <Section title="Your searches and alerts">
          <KeyValueRows rows={lifecycleRows(all, 'allTime')} />
        </Section>
      )}
    </Panel>
  )
}

export default function ReportsClient() {
  const { report, isLoading, refetch } = useReports()
  const { displayNameFor } = usePlatforms()
  const keptFrom = report ? keptFromLine(report.trackingSince, report.joinedAt) : null

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <PageTitle title="Reports" sub="What your searches did for you, week by week" />

      {isLoading ? (
        <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
          Loading your report…
        </p>
      ) : !report ? (
        <EmptyState heading="We couldn't load your report" body="Your searches are still running. Try again in a moment." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid items-start gap-5 desktop:grid-cols-2">
            <ThisWeek report={report} displayNameFor={displayNameFor} />
            <SinceYouJoined report={report} displayNameFor={displayNameFor} />
          </div>

          {report.pastWeeks.length > 0 && (
            <section aria-labelledby="past-h" className="flex flex-col gap-3">
              <h2 id="past-h" className="text-card-title font-bold text-ink">
                Past weeks
              </h2>
              <ul className="m-0 list-none overflow-hidden rounded-card border border-line bg-surface p-0 shadow-sm">
                {report.pastWeeks.map((w) => (
                  <li key={w.weekStart} className="border-t border-line first:border-t-0">
                    <Link
                      href={`/reports/week/${w.weekStart}`}
                      className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 text-ink no-underline hover:bg-chip"
                    >
                      <span className="text-base font-semibold">{weekLabel(w.weekStart)}</span>
                      <span className="col-start-1 text-sm text-muted-foreground">{pastWeekSummary(w)}</span>
                      <svg
                        className="col-start-2 row-span-2 row-start-1 text-muted-foreground"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {keptFrom && <FootNote>{keptFrom}</FootNote>}
        </>
      )}
    </div>
  )
}

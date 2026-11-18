'use client'

/**
 * Story 1.100 (U-14): one past week, as drawn in reports-week.html (approved by Mahan 2026-10-28).
 * A week outside the account's reports (a malformed date, not a Monday, this week or later, before
 * the account was made) says so without asking the server, and so does the server's 400. A failed
 * read offers Try again, never the error's text. Words: lib/reportRows.ts.
 */

import {
  BackToReports,
  BooksList,
  EmptyState,
  FoundList,
  HeadlineBox,
  KeyValueRows,
  PageTitle,
  Panel,
  Section,
  Tag,
} from '@/components/reports/ReportParts'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useReports, useWeekReport } from '@/hooks/useReports'
import { totalSearchesRun } from '@/lib/constants/marketplaceDisplayOrder'
import {
  booksSearchedRows,
  foundRows,
  lifecycleRows,
  pastWeekHeadline,
  searchesRunRows,
  weekHasReport,
  weekLabel,
  weekRange,
} from '@/lib/reportRows'

interface Props {
  weekStart: string
}

export default function WeekReportClient({ weekStart }: Props) {
  // Read through the overview's query (5 minutes stale, usually cached), so a week before the account
  // was made says so once it arrives, on a link opened directly too (review)
  const { report: overview } = useReports()
  const joinedAt = overview?.joinedAt ?? null
  const possible = weekHasReport(weekStart, joinedAt)
  const { report, isLoading, error, refetch } = useWeekReport(weekStart, { enabled: possible })
  const { displayNameFor } = usePlatforms()

  const status = (error as { status?: number } | null)?.status
  const missing = !possible || status === 400

  let body: React.ReactNode
  if (missing) {
    body = (
      <EmptyState
        icon="calendar"
        heading="There is no report for that week"
        body="Reports start from the week you joined, and the current week is on the Reports page until it ends."
        back
      />
    )
  } else if (isLoading) {
    body = (
      <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
        Loading this report…
      </p>
    )
  } else if (!report) {
    body = (
      <EmptyState
        icon="calendar"
        heading="We couldn’t load this report"
        body="Your searches are still running. Try again in a moment."
        onRetry={() => refetch()}
        back
      />
    )
  } else {
    const runs = totalSearchesRun(report.searchesRunByMarketplace)
    const copies = report.copiesFound ?? []
    const run = searchesRunRows(report.searchesRunByMarketplace, displayNameFor)
    const books = booksSearchedRows(report.booksSearched)
    const life = lifecycleRows(report, 'week')
    const anyLife = report.searchesCreated + report.searchesDeleted + report.alertsArchived + report.alertsDismissed > 0
    body = (
      <>
        <PageTitle
          title={weekLabel(weekStart)}
          sub={
            <>
              {weekRange(weekStart, false)} <Tag>Complete</Tag>
            </>
          }
        />
        <Panel label="The week">
          <HeadlineBox headline={pastWeekHeadline({ copies: copies.length, searchesRun: runs, alerts: report.alertsIssued })} />
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
          {(runs > 0 || anyLife) && (
            <Section title="Your searches and alerts">
              <KeyValueRows rows={life} />
            </Section>
          )}
        </Panel>
      </>
    )
  }

  return (
    <div className="mx-auto flex max-w-[824px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <BackToReports />
      {body}
    </div>
  )
}

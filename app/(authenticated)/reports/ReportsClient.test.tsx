/**
 * Story 1.44: ReportsClient renders searchesRunByMarketplace dynamically
 * (one StatRow per marketplace, canonical order) instead of hardcoded
 * eBay/Heritage rows, so MyComicShop's contribution is no longer silently
 * dropped from the "This Week"/"All Time" cards or the Past Reports table.
 */

import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { WeekReport, PastWeekSummary, ReportsResponse } from '@/types/report.types'

vi.mock('@/hooks/useReports', () => ({
  useReports: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useReports } from '@/hooks/useReports'
import ReportsClient from './ReportsClient'

// Explicitly typed against the real WeekReport/PastWeekSummary/ReportsResponse
// interfaces (not an untyped object literal) so tsc catches fixture drift --
// same discipline as SearchesClient.test.tsx's own makeSearch().
function makeWeekReport(overrides: Partial<WeekReport> = {}): WeekReport {
  return {
    weekStart: '2026-09-07',
    booksSearched: [],
    searchesRunByMarketplace: {},
    alertsIssued: 0,
    booksFound: [],
    searchesCreated: 0,
    searchesDeleted: 0,
    alertsArchived: 0,
    alertsDismissed: 0,
    ...overrides,
  }
}

function makePastWeek(overrides: Partial<PastWeekSummary> = {}): PastWeekSummary {
  return {
    weekStart: '2026-08-31',
    totalSearchesRun: 0,
    alertsIssued: 0,
    ...overrides,
  }
}

// allTime's real shape (Omit<WeekReport, 'activeSearches'>) never carries
// weekStart -- there's no single "week" for an all-time aggregate (code
// review LOW-5). Deliberately built without it, not by omitting a field from
// makeWeekReport(), so this fixture matches the real backend payload exactly.
function makeAllTimeReport(overrides: Partial<ReportsResponse['allTime']> = {}): ReportsResponse['allTime'] {
  return {
    booksSearched: [],
    searchesRunByMarketplace: {},
    alertsIssued: 0,
    booksFound: [],
    searchesCreated: 0,
    searchesDeleted: 0,
    alertsArchived: 0,
    alertsDismissed: 0,
    ...overrides,
  }
}

function makeReportsResponse(overrides: Partial<ReportsResponse> = {}): ReportsResponse {
  return {
    trackingSince: '2026-05-30',
    currentWeek: makeWeekReport(),
    allTime: makeAllTimeReport(),
    pastWeeks: [],
    ...overrides,
  }
}

function mockUseReports(report: ReportsResponse) {
  vi.mocked(useReports).mockReturnValue({
    report,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useReports>)
}

describe('ReportsClient — per-marketplace search counts (Story 1.44)', () => {
  it('renders one StatRow per marketplace, in canonical order, for the current week card', () => {
    mockUseReports(
      makeReportsResponse({
        currentWeek: makeWeekReport({
          searchesRunByMarketplace: { MyComicShop: 5, eBay: 12, Heritage: 3 },
        }),
      })
    )

    render(<ReportsClient />)

    const rows = screen.getAllByText(/searches run$/)
    expect(rows.map((el) => el.textContent)).toEqual([
      'eBay searches run',
      'Heritage searches run',
      'MyComicShop searches run',
    ])
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders an unrecognized marketplace after all known ones, alphabetically, never dropping it', () => {
    mockUseReports(
      makeReportsResponse({
        currentWeek: makeWeekReport({
          searchesRunByMarketplace: { ComicLink: 7, eBay: 12, Heritage: 3, MyComicShop: 5 },
        }),
      })
    )

    render(<ReportsClient />)

    expect(screen.getByText('ComicLink searches run')).toBeInTheDocument()
    const rows = screen.getAllByText(/searches run$/)
    expect(rows.map((el) => el.textContent)).toEqual([
      'eBay searches run',
      'Heritage searches run',
      'MyComicShop searches run',
      'ComicLink searches run',
    ])
  })

  it('does not render a StatRow for a marketplace with a zero count', () => {
    mockUseReports(
      makeReportsResponse({
        currentWeek: makeWeekReport({
          searchesRunByMarketplace: { eBay: 12, Heritage: 0, MyComicShop: 0 },
        }),
      })
    )

    render(<ReportsClient />)

    expect(screen.getByText('eBay searches run')).toBeInTheDocument()
    expect(screen.queryByText('Heritage searches run')).not.toBeInTheDocument()
    expect(screen.queryByText('MyComicShop searches run')).not.toBeInTheDocument()
  })

  it('renders no empty execution-counts wrapper when every marketplace count is zero (code review LOW-2 — StatRow\'s own zero-guard hides the rows, but without the wrapper-level gate an empty, stray div would still render)', () => {
    mockUseReports(
      makeReportsResponse({
        currentWeek: makeWeekReport({ searchesRunByMarketplace: { eBay: 0, Heritage: 0 } }),
      })
    )

    render(<ReportsClient />)
    const currentWeekCard = screen.getByText('This Week').closest('.rounded-lg')
    expect(currentWeekCard?.querySelectorAll('.py-3')).toHaveLength(0)
  })

  it('sums across all marketplaces for the "We ran N searches" headline, not just eBay', () => {
    mockUseReports(
      makeReportsResponse({
        currentWeek: makeWeekReport({
          searchesRunByMarketplace: { eBay: 12, Heritage: 3, MyComicShop: 5 },
        }),
      })
    )

    render(<ReportsClient />)
    expect(screen.getByText(/We ran/)).toBeInTheDocument()
    expect(screen.getByText('20 searches')).toBeInTheDocument()
    expect(screen.getByText(/this week on your behalf\./)).toBeInTheDocument()
    expect(screen.queryByText(/on eBay/)).not.toBeInTheDocument()
  })

  it('renders the headline with exactly one space around "this week", not two (code review LOW-1 — regression guard for the double-space bug found and fixed during dev-story; default text matchers normalize whitespace and would miss this)', () => {
    mockUseReports(
      makeReportsResponse({
        currentWeek: makeWeekReport({ searchesRunByMarketplace: { eBay: 20 } }),
      })
    )

    render(<ReportsClient />)
    const headline = screen.getByText(
      (_, el) => el?.tagName === 'P' && el.textContent === 'We ran 20 searches this week on your behalf. Still hunting.'
    )
    expect(headline).toBeInTheDocument()
  })

  it('shows the corrected zero-activity copy without naming eBay specifically', () => {
    mockUseReports(makeReportsResponse({ currentWeek: makeWeekReport() }))

    render(<ReportsClient />)
    // Both cards (This Week + All Time) show the no-activity copy when empty.
    expect(
      screen.getAllByText(/we check for new listings at 9 AM and 7 PM EST every day\./)
    ).toHaveLength(2)
  })

  it('renders the All Time card correctly with real-world activity when its fixture has no weekStart at all (code review LOW-5 fix)', () => {
    mockUseReports(
      makeReportsResponse({
        allTime: makeAllTimeReport({ searchesRunByMarketplace: { eBay: 40, MyComicShop: 5 }, alertsIssued: 3 }),
      })
    )

    render(<ReportsClient />)
    expect(screen.getByText('All Time')).toBeInTheDocument()
    expect(screen.getByText('Since you joined')).toBeInTheDocument()
    expect(screen.getByText('eBay searches run')).toBeInTheDocument()
    expect(screen.getByText('MyComicShop searches run')).toBeInTheDocument()
  })

  it('past-weeks table shows a "Searches Run" column using the combined total, not an eBay-only figure', () => {
    mockUseReports(
      makeReportsResponse({
        pastWeeks: [makePastWeek({ weekStart: '2026-08-31', totalSearchesRun: 20, alertsIssued: 2 })],
      })
    )

    render(<ReportsClient />)
    expect(screen.getByText('Searches Run')).toBeInTheDocument()
    expect(screen.queryByText('eBay Searches')).not.toBeInTheDocument()

    // Scoped to the row's own cells (in column order), not just "20" appearing
    // anywhere on the page -- a Searches Run/Alerts column swap would still
    // pass an unscoped assertion (found on code review, LOW-3).
    const row = screen.getByText(/Week of/).closest('tr')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells[1]).toHaveTextContent('20')
    expect(cells[2]).toHaveTextContent('2')
  })

  it('shows the corrected "Search counts tracked since" footer without naming eBay specifically', () => {
    mockUseReports(makeReportsResponse({ trackingSince: '2026-05-30' }))

    render(<ReportsClient />)
    expect(screen.getByText(/Search counts tracked since/)).toBeInTheDocument()
    expect(screen.queryByText(/eBay search counts tracked/)).not.toBeInTheDocument()
  })
})

/**
 * Story 1.44: ReportsClient renders searchesRunByMarketplace dynamically
 * (one StatRow per marketplace, canonical order) instead of hardcoded
 * eBay/Heritage rows, so MyComicShop's contribution is no longer silently
 * dropped from the "This Week"/"All Time" cards or the Past Reports table.
 */

import { render, screen } from '@testing-library/react'
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

function makeReportsResponse(overrides: Partial<ReportsResponse> = {}): ReportsResponse {
  return {
    trackingSince: '2026-05-30',
    currentWeek: makeWeekReport(),
    allTime: makeWeekReport(),
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

  it('shows the corrected zero-activity copy without naming eBay specifically', () => {
    mockUseReports(makeReportsResponse({ currentWeek: makeWeekReport() }))

    render(<ReportsClient />)
    // Both cards (This Week + All Time) show the no-activity copy when empty.
    expect(
      screen.getAllByText(/we check for new listings at 9 AM and 7 PM EST every day\./)
    ).toHaveLength(2)
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
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('shows the corrected "Search counts tracked since" footer without naming eBay specifically', () => {
    mockUseReports(makeReportsResponse({ trackingSince: '2026-05-30' }))

    render(<ReportsClient />)
    expect(screen.getByText(/Search counts tracked since/)).toBeInTheDocument()
    expect(screen.queryByText(/eBay search counts tracked/)).not.toBeInTheDocument()
  })
})

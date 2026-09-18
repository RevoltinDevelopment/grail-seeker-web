/**
 * Story 1.44: WeekReportClient renders searchesRunByMarketplace dynamically
 * (one StatRow per marketplace, canonical order) instead of hardcoded
 * eBay/Heritage rows, matching ReportsClient's own Story 1.44 fix.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WeekReport } from '@/types/report.types'

vi.mock('@/hooks/useReports', () => ({
  useWeekReport: vi.fn(),
}))

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useWeekReport } from '@/hooks/useReports'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { usePlatforms } from '@/hooks/usePlatforms'
import WeekReportClient from './WeekReportClient'

// Story 1.49: default mock has no registry entries -- displayNameFor's
// fallback-to-raw-key behavior is what every pre-existing (Story 1.44) test
// exercises unchanged.
beforeEach(() => {
  vi.mocked(usePlatforms).mockReturnValue({
    groups: [],
    isLoading: false,
    error: null,
    displayNameFor: (slug: string) => slug,
    defaultEnabledSlugs: [],
  })
})

function makeWeekReport(overrides: Partial<WeekReport> = {}): WeekReport {
  return {
    weekStart: '2026-08-31',
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

function mockUseWeekReport(report: WeekReport | undefined) {
  vi.mocked(useWeekReport).mockReturnValue({
    report,
    isLoading: false,
  } as unknown as ReturnType<typeof useWeekReport>)
}

describe('WeekReportClient — per-marketplace search counts (Story 1.44)', () => {
  it('renders one StatRow per marketplace, in canonical order', () => {
    mockUseWeekReport(
      makeWeekReport({ searchesRunByMarketplace: { MyComicShop: 5, eBay: 12, Heritage: 3 } })
    )

    render(<WeekReportClient weekStart="2026-08-31" />)

    const rows = screen.getAllByText(/searches run$/)
    expect(rows.map((el) => el.textContent)).toEqual([
      'eBay searches run',
      'Heritage searches run',
      'MyComicShop searches run',
    ])
  })

  it('renders an unrecognized marketplace after all known ones, alphabetically, never dropping it', () => {
    mockUseWeekReport(
      makeWeekReport({
        searchesRunByMarketplace: { ComicLink: 7, eBay: 12, Heritage: 3, MyComicShop: 5 },
      })
    )

    render(<WeekReportClient weekStart="2026-08-31" />)

    const rows = screen.getAllByText(/searches run$/)
    expect(rows.map((el) => el.textContent)).toEqual([
      'eBay searches run',
      'Heritage searches run',
      'MyComicShop searches run',
      'ComicLink searches run',
    ])
  })

  it('does not render a StatRow for a marketplace with a zero count', () => {
    mockUseWeekReport(
      makeWeekReport({ searchesRunByMarketplace: { eBay: 12, Heritage: 0 } })
    )

    render(<WeekReportClient weekStart="2026-08-31" />)

    expect(screen.getByText('eBay searches run')).toBeInTheDocument()
    expect(screen.queryByText('Heritage searches run')).not.toBeInTheDocument()
  })

  it('sums across all marketplaces for the "We ran N searches" headline, not just eBay', () => {
    mockUseWeekReport(
      makeWeekReport({ searchesRunByMarketplace: { eBay: 12, Heritage: 3, MyComicShop: 5 } })
    )

    render(<WeekReportClient weekStart="2026-08-31" />)

    expect(screen.getByText('20 searches')).toBeInTheDocument()
    expect(screen.getByText(/this week on your behalf\./)).toBeInTheDocument()
    expect(screen.queryByText(/on eBay/)).not.toBeInTheDocument()
  })

  it('shows the no-activity copy when every marketplace is zero/absent', () => {
    mockUseWeekReport(makeWeekReport({ searchesRunByMarketplace: {} }))

    render(<WeekReportClient weekStart="2026-08-31" />)
    expect(screen.getByText('No monitoring activity recorded for this week.')).toBeInTheDocument()
  })
})

describe('WeekReportClient — Independent Shops slug resolution (Story 1.49)', () => {
  it('resolves a raw registry slug to its real display name, never showing it verbatim', () => {
    vi.mocked(usePlatforms).mockReturnValue({
      groups: [],
      isLoading: false,
      error: null,
      displayNameFor: (slug: string) => (slug === 'indie:bryscomics' ? "Bry's Comics" : slug),
      defaultEnabledSlugs: [],
    })
    mockUseWeekReport(makeWeekReport({ searchesRunByMarketplace: { eBay: 12, 'indie:bryscomics': 4 } }))

    render(<WeekReportClient weekStart="2026-08-31" />)
    expect(screen.getByText("Bry's Comics searches run")).toBeInTheDocument()
    expect(screen.queryByText('indie:bryscomics searches run')).not.toBeInTheDocument()
  })

  it('leaves the three known capitalized names untouched, unresolved', () => {
    vi.mocked(usePlatforms).mockReturnValue({
      groups: [],
      isLoading: false,
      error: null,
      displayNameFor: () => 'SHOULD NOT BE CALLED FOR KNOWN NAMES',
      defaultEnabledSlugs: [],
    })
    mockUseWeekReport(
      makeWeekReport({ searchesRunByMarketplace: { eBay: 12, Heritage: 3, MyComicShop: 5 } })
    )

    render(<WeekReportClient weekStart="2026-08-31" />)
    expect(screen.getByText('eBay searches run')).toBeInTheDocument()
    expect(screen.getByText('Heritage searches run')).toBeInTheDocument()
    expect(screen.getByText('MyComicShop searches run')).toBeInTheDocument()
  })
})

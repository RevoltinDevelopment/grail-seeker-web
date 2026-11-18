/**
 * Story 1.100 (U-14): Reports, as drawn in reports-overview.html. The words themselves are tested
 * in lib/reportRows.test.ts; these check each state of the page.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Copy, ReportsResponse } from '@/types/report.types'

const state = vi.hoisted(() => ({
  report: undefined as unknown,
  isLoading: false,
  error: null as unknown,
  refetch: vi.fn(),
}))
vi.mock('@/hooks/useReports', () => ({
  useReports: () => ({ report: state.report, isLoading: state.isLoading, error: state.error, refetch: state.refetch }),
}))
vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({ displayNameFor: (s: string) => ({ 'indie:cba': 'Comic Book Addiction' })[s] ?? s }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import ReportsClient from './ReportsClient'

const book = (seriesTitle: string, issueNumber: string) => ({ seriesTitle, issueNumber, issueVolumeText: null })
const copy = (over: Partial<Copy> = {}): Copy => ({
  alertId: 'c1',
  book: book('Werewolf by Night', '32'),
  marketplace: 'eBay',
  listingUrl: 'https://track.example/1',
  grade: { gradingAuthority: 'CGC', grade: 9.6, pageQuality: null },
  price: 5400,
  priceIsPlaceholder: false,
  nearMiss: false,
  foundAt: '2026-11-17T14:05:00Z',
  priceChange: null,
  now: { listingStatus: 'active', archiveReason: null, archivedAt: null },
  alerts: 1,
  ...over,
})

function makeReport(over: Partial<ReportsResponse> = {}): ReportsResponse {
  return {
    trackingSince: '2026-07-01',
    joinedAt: '2026-08-12T15:00:00Z',
    currentWeek: {
      weekStart: '2026-11-16',
      booksSearched: [book('X-Men', '94'), { ...book('Daredevil', '158'), searchDeleted: true }],
      searchesRunByMarketplace: { eBay: 84, Heritage: 84, MyComicShop: 84, 'indie:cba': 42 },
      alertsIssued: 2,
      copiesFound: [copy(), copy({ alertId: 'c2', listingUrl: 'https://track.example/2', book: book('X-Men', '94'), foundAt: '2026-11-16T14:00:00Z', now: { listingStatus: 'archived_expired', archiveReason: 'listing_sold', archivedAt: null } })],
      activeSearches: 6,
      searchesCreated: 1,
      searchesDeleted: 0,
      alertsArchived: 1,
      alertsDismissed: 0,
    },
    allTime: {
      booksSearched: [book('X-Men', '94')],
      searchesRunByMarketplace: { eBay: 862, Heritage: 862 },
      alertsIssued: 20,
      copiesFound: 9,
      booksFoundTally: [
        { ...book('The Amazing Spider-Man', '129'), searchDeleted: false, copies: 4 },
        { ...book('Iron Fist', '14'), searchDeleted: false, copies: 1 },
      ],
      searchesCreated: 8,
      searchesDeleted: 2,
      alertsArchived: 6,
      alertsDismissed: 1,
    },
    pastWeeks: [
      { weekStart: '2026-11-09', totalSearchesRun: 294, alertsIssued: 2 },
      { weekStart: '2026-11-02', totalSearchesRun: 280, alertsIssued: 0 },
    ],
    ...over,
  }
}

beforeEach(() => {
  state.report = makeReport()
  state.isLoading = false
  state.error = null
  state.refetch.mockReset()
})

describe('ReportsClient', () => {
  it('this week, as drawn: the range, the headline, each copy with where it is, the marketplaces and the counts', () => {
    render(<ReportsClient />)
    const week = screen.getByRole('region', { name: 'This week' })
    expect(within(week).getByText('Monday, Nov 16 to Sunday, Nov 22, 2026')).toBeInTheDocument()
    expect(within(week).getByText(/We found 2 books for you this week\./)).toBeInTheDocument()
    expect(within(week).getByText('Books found · 2')).toBeInTheDocument()
    const view = within(week).getByRole('link', { name: /Werewolf by Night #32 · CGC 9\.6\s*View on eBay/ })
    expect(view).toHaveAttribute('href', 'https://track.example/1')
    expect(view).toHaveAttribute('target', '_blank')
    // A sold copy opens its listing too, and says it sold (Story 1.103)
    expect(within(week).getByRole('link', { name: /X-Men #94 · CGC 9\.6\s*Sold/ })).toHaveAttribute('href', 'https://track.example/2')
    expect(within(week).getByText('Heritage Auctions')).toBeInTheDocument()
    expect(within(week).getByText('Comic Book Addiction')).toBeInTheDocument()
    expect(within(week).getByText('Books searched · 2')).toBeInTheDocument()
    expect(within(week).getByText('(search deleted)')).toBeInTheDocument()
    expect(within(week).getByText('Searches running')).toBeInTheDocument()
    expect(within(week).getByText('Alerts you dismissed')).toBeInTheDocument()
    expect(within(week).queryByText('Searches deleted')).toBeNull()
  })

  it('since you joined: copies, the tally with counts, and the link to Books found', () => {
    render(<ReportsClient />)
    const all = screen.getByRole('region', { name: 'Since you joined' })
    expect(within(all).getByText('From Aug 12, 2026')).toBeInTheDocument()
    expect(within(all).getByText(/We found 9 books for you since you joined\./)).toBeInTheDocument()
    expect(within(all).getByText('4 copies found')).toBeInTheDocument()
    expect(within(all).getByText('1 copy found')).toBeInTheDocument()
    // Just the count: no grades by company (Mahan, 2026-11-18)
    expect(within(all).queryByText(/CGC 9\.0/)).toBeNull()
    expect(within(all).queryByText(/Raw 8\.0/)).toBeNull()
    expect(within(all).getByRole('link', { name: 'See all 9 books found, with prices and where each is now' })).toHaveAttribute('href', '/reports/books-found')
    expect(within(all).getByText('Searches deleted')).toBeInTheDocument()
  })

  it('past weeks are links in a list, never a table; the foot names the date counts are kept from', () => {
    render(<ReportsClient />)
    expect(screen.queryByRole('table')).toBeNull()
    const past = screen.getByRole('region', { name: 'Past weeks' })
    expect(within(past).getByRole('link', { name: /Week of November 9, 2026\s*294 searches · 2 alerts/ })).toHaveAttribute('href', '/reports/week/2026-11-09')
    expect(within(past).getByText('280 searches · no alerts')).toBeInTheDocument()
    expect(screen.getByText('Search counts are kept from August 12, 2026.')).toBeInTheDocument()
    expect(screen.queryByText(/Coming soon|by email/i)).toBeNull()
  })

  it('the first week: nothing run yet, and no past weeks', () => {
    state.report = makeReport({
      joinedAt: '2026-11-17T10:00:00Z',
      currentWeek: { ...makeReport().currentWeek, searchesRunByMarketplace: {}, copiesFound: [], booksSearched: [book('X-Men', '94')], searchesCreated: 0, alertsArchived: 0 },
      allTime: { ...makeReport().allTime, searchesRunByMarketplace: {}, copiesFound: 0, booksFoundTally: [], searchesCreated: 0, searchesDeleted: 0, alertsArchived: 0, alertsDismissed: 0 },
      pastWeeks: [],
    })
    render(<ReportsClient />)
    expect(screen.getByText(/Your first report fills in as your searches run\./)).toBeInTheDocument()
    expect(screen.getByText(/Nothing has run yet\./)).toBeInTheDocument()
    expect(screen.queryByText('Your searches and alerts')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Past weeks' })).toBeNull()
  })

  it('a quiet Monday for an older account: this week fills in as searches run', () => {
    state.report = makeReport({ currentWeek: { ...makeReport().currentWeek, searchesRunByMarketplace: {}, copiesFound: [] } })
    render(<ReportsClient />)
    expect(screen.getByText(/This week’s report fills in as your searches run\./)).toBeInTheDocument()
  })

  it('a failed read says so with Try again, never the error text', () => {
    state.report = undefined
    state.error = new Error('TypeError: fetch failed at line 42')
    render(<ReportsClient />)
    expect(screen.getByRole('heading', { name: "We couldn't load your report" })).toBeInTheDocument()
    expect(screen.queryByText(/fetch failed/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.refetch).toHaveBeenCalled()
  })

  it('a refresh that fails keeps the report on screen (review)', () => {
    state.error = new Error('offline')
    render(<ReportsClient />)
    expect(screen.getByRole('region', { name: 'This week' })).toBeInTheDocument()
    expect(screen.queryByText("We couldn't load your report")).toBeNull()
  })

  it('searches created before any search ran still show (review)', () => {
    state.report = makeReport({
      joinedAt: '2026-11-17T10:00:00Z',
      currentWeek: { ...makeReport().currentWeek, searchesRunByMarketplace: {}, copiesFound: [], searchesCreated: 3, alertsArchived: 0 },
      pastWeeks: [],
    })
    render(<ReportsClient />)
    const week = screen.getByRole('region', { name: 'This week' })
    expect(within(week).getByText('Searches created')).toBeInTheDocument()
  })

  it('loading: the title, and a quiet line in place of the cards', () => {
    state.report = undefined
    state.isLoading = true
    render(<ReportsClient />)
    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByText('Loading your report…')).toHaveAttribute('aria-busy', 'true')
  })
})

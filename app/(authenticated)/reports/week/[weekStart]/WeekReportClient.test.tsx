/**
 * Story 1.100 (U-14): one past week, as drawn in reports-week.html.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WeekReport } from '@/types/report.types'

const state = vi.hoisted(() => ({
  report: undefined as unknown,
  isLoading: false,
  error: null as unknown,
  refetch: vi.fn(),
  calls: [] as { weekStart: string; enabled?: boolean }[],
  overview: undefined as unknown,
}))
vi.mock('@/hooks/useReports', () => ({
  useReports: () => ({ report: state.overview }),
  useWeekReport: (weekStart: string, opts: { enabled?: boolean } = {}) => {
    state.calls.push({ weekStart, enabled: opts.enabled })
    return { report: state.report, isLoading: state.isLoading, error: state.error, refetch: state.refetch }
  },
}))
vi.mock('@/hooks/usePlatforms', () => ({ usePlatforms: () => ({ displayNameFor: (s: string) => s }) }))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import WeekReportClient from './WeekReportClient'

const book = (seriesTitle: string, issueNumber: string) => ({ seriesTitle, issueNumber, issueVolumeText: null })
const week = (over: Partial<WeekReport> = {}): WeekReport => ({
  weekStart: '2026-11-09',
  booksSearched: [book('X-Men', '94'), { ...book('Iron Fist', '14'), searchDeleted: true }],
  searchesRunByMarketplace: { eBay: 84, Heritage: 84 },
  alertsIssued: 1,
  copiesFound: [
    {
      alertId: 'c1',
      book: book('The Amazing Spider-Man', '129'),
      marketplace: 'eBay',
      listingUrl: null,
      grade: { gradingAuthority: 'CGC', grade: 9.4, pageQuality: null },
      price: 4850,
      priceIsPlaceholder: false,
      nearMiss: false,
      foundAt: '2026-11-10T14:00:00Z',
      priceChange: null,
      now: { listingStatus: 'archived_expired', archiveReason: 'listing_sold', archivedAt: '2026-11-12T14:00:00Z' },
      alerts: 1,
    },
  ],
  searchesCreated: 1,
  searchesDeleted: 1,
  alertsArchived: 1,
  alertsDismissed: 0,
  ...over,
})

let client: QueryClient
const renderWeek = (weekStart: string) =>
  render(
    <QueryClientProvider client={client}>
      <WeekReportClient weekStart={weekStart} />
    </QueryClientProvider>
  )

beforeEach(() => {
  client = new QueryClient()
  state.report = week()
  state.isLoading = false
  state.error = null
  state.calls = []
  state.overview = undefined
  state.refetch.mockReset()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-18T17:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('WeekReportClient', () => {
  it('a week with finds, as drawn: the title, the real days, the copies and the counts', () => {
    renderWeek('2026-11-09')
    expect(screen.getByRole('heading', { name: 'Week of November 9, 2026' })).toBeInTheDocument()
    expect(screen.getByText(/Monday, Nov 9 to Sunday, Nov 15/)).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
    expect(screen.getByText(/We found 1 book for you that week\./)).toBeInTheDocument()
    // No listing link on record: the status, unlinked (Story 1.103)
    expect(screen.getByText('Sold Nov 12')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /The Amazing Spider-Man #129/ })).toBeNull()
    expect(screen.getByText('Heritage Auctions')).toBeInTheDocument()
    expect(screen.getByText('(search deleted)')).toBeInTheDocument()
    expect(screen.getByText('Searches deleted')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to Reports' })).toHaveAttribute('href', '/reports')
  })

  it('a week when nothing matched, and one when no searches ran', () => {
    state.report = week({ copiesFound: [], alertsIssued: 0 })
    const { unmount } = renderWeek('2026-11-09')
    expect(screen.getByText(/We ran 168 searches for you that week\./)).toBeInTheDocument()
    expect(screen.getByText('Nothing matched.')).toBeInTheDocument()
    unmount()
    state.report = week({ copiesFound: [], alertsIssued: 0, searchesRunByMarketplace: {}, searchesCreated: 0, searchesDeleted: 0, alertsArchived: 0 })
    renderWeek('2026-11-09')
    expect(screen.getByText(/No searches ran that week\./)).toBeInTheDocument()
    expect(screen.queryByText('Your searches and alerts')).toBeNull()
  })

  it.each([
    ['not a date', 'garbage'],
    ['not a Monday', '2026-11-10'],
    ['the current week', '2026-11-16'],
    ['a future week', '2026-11-30'],
  ])('%s: no report for that week, without asking the server', (_label, weekStart) => {
    renderWeek(weekStart)
    expect(screen.getByRole('heading', { name: 'There is no report for that week' })).toBeInTheDocument()
    expect(state.calls.length).toBeGreaterThan(0)
    expect(state.calls.every((c) => c.enabled === false)).toBe(true)
    expect(screen.getByRole('link', { name: 'Back to Reports' })).toHaveAttribute('href', '/reports')
  })

  it('a week before the account was made, once the overview is known (a link opened directly too)', () => {
    state.overview = { joinedAt: '2026-08-12T15:00:00Z' }
    renderWeek('2026-08-03')
    expect(screen.getByRole('heading', { name: 'There is no report for that week' })).toBeInTheDocument()
  })

  it('alerts on copies found in an earlier week: not "Nothing matched" (review)', () => {
    state.report = week({ copiesFound: [], alertsIssued: 1 })
    renderWeek('2026-11-09')
    expect(screen.getByText(/We ran 168 searches for you that week\./)).toBeInTheDocument()
    expect(screen.queryByText('Nothing matched.')).toBeNull()
  })

  it('a refresh that fails keeps the week on screen (review)', () => {
    state.error = Object.assign(new Error('socket hang up'), { status: 500 })
    renderWeek('2026-11-09')
    expect(screen.getByRole('heading', { name: 'Week of November 9, 2026' })).toBeInTheDocument()
  })

  it("the server's 400 is no report for that week", () => {
    state.report = undefined
    state.error = Object.assign(new Error('INVALID_WEEK'), { status: 400 })
    renderWeek('2026-11-09')
    expect(screen.getByRole('heading', { name: 'There is no report for that week' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('any other failure offers Try again, never the error text', () => {
    state.report = undefined
    state.error = Object.assign(new Error('socket hang up'), { status: 500 })
    renderWeek('2026-11-09')
    expect(screen.getByRole('heading', { name: 'We couldn’t load this report' })).toBeInTheDocument()
    expect(screen.queryByText(/socket hang up/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.refetch).toHaveBeenCalled()
  })
})

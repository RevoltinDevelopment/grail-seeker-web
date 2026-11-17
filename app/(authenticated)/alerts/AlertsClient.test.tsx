import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeAlert } from '@/lib/alertRows.fixture'

import type { Alert } from '@/types/alert.types'

import AlertsClient from './AlertsClient'

// Story 1.96 (U-11): Alerts, against alerts-list.html.
const state = vi.hoisted(() => ({
  alerts: [] as unknown[],
  isLoading: false,
  error: null as unknown,
  fetchedAfterMount: true,
  reported: [] as string[][],
  params: new URLSearchParams(),
  sort: 'date' as 'date' | 'book',
  collapsed: [] as string[],
  archive: vi.fn(),
  restore: vi.fn(),
  list: vi.fn(),
  searches: [] as unknown[],
  textsIncluded: true,
}))

vi.mock('next/navigation', () => ({ useSearchParams: () => state.params }))
vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: () => ({
    alerts: state.alerts,
    isLoading: state.isLoading,
    error: state.error,
    refetch: vi.fn(),
    isFetchedAfterMount: state.fetchedAfterMount,
  }),
}))
vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({
    groups: [
      {
        label: 'Marketplaces',
        platforms: [
          { slug: 'ebay', displayName: 'eBay', defaultEnabled: true },
          { slug: 'heritage', displayName: 'Heritage', defaultEnabled: true },
          { slug: 'mycomicshop', displayName: 'MyComicShop', defaultEnabled: true },
          { slug: 'indie:comicbookaddiction', displayName: 'Comic Book Addiction', defaultEnabled: true },
        ],
      },
    ],
    displayNameFor: (s: string) => s,
  }),
}))
vi.mock('@/hooks/useUnseenAlerts', () => ({
  useReportSeen: (ids: string[]) => state.reported.push([...ids]),
}))
vi.mock('@/hooks/useAccountSummary', () => ({
  useAccountSummary: () => ({ account: { plan: { textsIncluded: state.textsIncluded } } }),
}))
vi.mock('@/hooks/useUiPreferences', () => ({
  useUiPreferences: () => ({
    alertsSort: state.sort,
    collapsedGroups: state.collapsed,
    setAlertsSort: (s: 'date' | 'book') => (state.sort = s),
    isGroupCollapsed: (id: string) => state.collapsed.includes(id),
    toggleGroupCollapsed: vi.fn(),
    setAllGroupsCollapsed: (ids: string[]) => (state.collapsed = ids),
    isLoaded: true,
  }),
}))
vi.mock('@/lib/api/alerts', () => ({
  alertsAPI: { archive: state.archive, restore: state.restore, list: state.list },
}))
vi.mock('@/lib/api/searches', () => ({
  searchesAPI: { list: () => Promise.resolve({ searches: state.searches }) },
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(
    <QueryClientProvider client={client}>
      <AlertsClient />
    </QueryClientProvider>
  )
  return {
    ...utils,
    rerender: () =>
      utils.rerender(
        <QueryClientProvider client={client}>
          <AlertsClient />
        </QueryClientProvider>
      ),
  }
}

const rows = () => screen.queryAllByRole('listitem')

beforeEach(() => {
  state.alerts = []
  state.isLoading = false
  state.error = null
  state.fetchedAfterMount = true
  state.reported = []
  state.params = new URLSearchParams()
  state.sort = 'date'
  state.collapsed = []
  state.searches = []
  state.textsIncluded = true
  state.archive.mockReset().mockResolvedValue({ success: true })
  state.restore.mockReset().mockResolvedValue({ success: true })
  state.list.mockReset().mockResolvedValue({ alerts: [], pagination: { total: 7, limit: 1, offset: 0 } })
})

describe('Alerts', () => {
  it('shows each alert as a row, says how many on how many searches, and counts the archive', async () => {
    state.alerts = [
      makeAlert({ id: 'a', searchId: 's1' }),
      makeAlert({ id: 'b', searchId: 's2', listing: { platform: 'indie:comicbookaddiction' }, notificationSent: false }),
    ]
    renderPage()
    expect(rows()).toHaveLength(2)
    expect(screen.getByText('2 alerts on 2 searches')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View on Comic Book Addiction/ })).toHaveAttribute('target', '_blank')
    expect(await screen.findByRole('link', { name: 'Archived alerts (7)' })).toHaveAttribute('href', '/alerts/archive')
  })

  it('names every marketplace in the filter, a shop included', () => {
    state.alerts = [makeAlert()]
    renderPage()
    const select = screen.getByLabelText('Marketplace')
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'All marketplaces',
      'eBay',
      'Heritage Auctions',
      'MyComicShop',
      'Comic Book Addiction',
    ])
  })

  it('a filter that matches nothing says which, and Clear filters brings the alerts back', () => {
    state.alerts = [makeAlert()]
    renderPage()
    fireEvent.change(screen.getByLabelText('Matches'), { target: { value: 'near' } })
    expect(screen.getByRole('heading', { name: 'No near misses' })).toBeInTheDocument()
    expect(screen.getByText('Your one alert doesn\u2019t match the filters')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
    expect(rows()).toHaveLength(1)
  })

  it('with nothing found, points back to Searches', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'No alerts right now' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Searches' })).toHaveAttribute('href', '/searches')
  })

  it('shows 20, then 20 more', () => {
    state.alerts = Array.from({ length: 25 }, (_, i) => makeAlert({ id: `a${i}` }))
    renderPage()
    expect(rows()).toHaveLength(20)
    expect(screen.getByText('Showing 20 of 25 alerts')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }))
    expect(rows()).toHaveLength(25)
    expect(screen.queryByRole('button', { name: 'Show 20 more' })).toBeNull()
  })
})

describe('"New" for the visit (Decision #103)', () => {
  it('labels the rows not yet seen, reports what is on screen, and keeps the labels once seen', () => {
    state.alerts = [makeAlert({ id: 'new1' }), makeAlert({ id: 'old1', seenAt: '2026-11-15T10:00:00Z' })]
    const page = renderPage()
    expect(screen.getAllByText('New')).toHaveLength(1)
    expect(state.reported.at(-1)?.sort()).toEqual(['new1', 'old1'])
    // The report lands and the list refreshes with the seen mark: the label stays for the visit
    state.alerts = [makeAlert({ id: 'new1', seenAt: '2026-11-16T12:00:00Z' }), makeAlert({ id: 'old1', seenAt: '2026-11-15T10:00:00Z' })]
    page.rerender()
    expect(screen.getAllByText('New')).toHaveLength(1)
  })

  it('reports nothing and labels nothing until the list is read on this visit', () => {
    state.alerts = [makeAlert({ id: 'cached' })]
    state.fetchedAfterMount = false
    const page = renderPage()
    expect(screen.queryByText('New')).toBeNull()
    expect(state.reported.every((ids) => ids.length === 0)).toBe(true)
    state.alerts = [makeAlert({ id: 'cached', seenAt: '2026-11-15T10:00:00Z' })]
    state.fetchedAfterMount = true
    page.rerender()
    expect(screen.queryByText('New')).toBeNull()
  })

  it('in By book, a closed book reports none of its alerts', () => {
    state.sort = 'book'
    state.collapsed = ['s2']
    state.alerts = [makeAlert({ id: 'a', searchId: 's1' }), makeAlert({ id: 'b', searchId: 's2', search: { series: { title: 'X-Men', volume: 1 }, issueNumber: '94', issueVolumeText: null } })]
    renderPage()
    expect(state.reported.at(-1)).toEqual(['a'])
  })
})

describe('Dismiss and Undo', () => {
  const one = (): Alert => makeAlert({ id: 'd1' })

  it('dismisses at once, with "Moved to the archive." and Undo that brings it back', async () => {
    state.alerts = [one()]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Werewolf by Night #32, CGC 9.6, $5,400' }))
    expect(rows()).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('Moved to the archive.')
    expect(state.archive).toHaveBeenCalledWith('d1')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    })
    expect(state.restore).toHaveBeenCalledWith('d1')
    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('a failed Dismiss puts the row back and says so', async () => {
    state.archive.mockRejectedValue(new Error('down'))
    state.alerts = [one()]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^Dismiss/ }))
    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(screen.getByRole('status')).toHaveTextContent('That alert couldn’t be moved to the archive. Try again.')
  })

  it('a Dismiss of an alert the system already archived leaves it gone, with no error (review)', async () => {
    const { APIError } = await import('@/lib/api/client')
    state.archive.mockRejectedValue(new APIError(409, 'NOT_ACTIVE', 'archived'))
    state.alerts = [one()]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^Dismiss/ }))
    await act(async () => {})
    expect(rows()).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('Moved to the archive.')
  })

  it('an Undo pressed before the Dismiss reaches the server waits for it (review)', async () => {
    let finish: (v: unknown) => void = () => {}
    state.archive.mockReturnValue(new Promise((r) => (finish = r)))
    state.alerts = [one()]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^Dismiss/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await act(async () => {})
    expect(state.restore).not.toHaveBeenCalled()
    await act(async () => finish({ success: true }))
    await waitFor(() => expect(state.restore).toHaveBeenCalledWith('d1'))
  })

  it('a second click straight after a Dismiss does not dismiss the row that moved up (review)', () => {
    state.alerts = [makeAlert({ id: 'd1' }), makeAlert({ id: 'd2', listing: { price: 5100 } })]
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /^Dismiss/ })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /^Dismiss/ })[0])
    expect(state.archive).toHaveBeenCalledTimes(1)
    expect(rows()).toHaveLength(1)
  })

  it('a refused Undo says why and leaves the row in the archive', async () => {
    const { APIError } = await import('@/lib/api/client')
    state.restore.mockRejectedValue(new APIError(409, 'NEWER_ALERT', 'newer'))
    state.alerts = [one()]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^Dismiss/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    })
    expect(screen.getByRole('status')).toHaveTextContent('A newer alert for this listing is already in Alerts.')
    expect(rows()).toHaveLength(0)
  })
})

describe('By book', () => {
  it('the circle closes only the books on screen; a book hidden by a filter keeps its state (review)', () => {
    state.sort = 'book'
    state.collapsed = ['hidden']
    state.alerts = [makeAlert({ id: 'a', searchId: 's1' })]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse every book' }))
    expect(state.collapsed.sort()).toEqual(['hidden', 's1'])
  })
})

describe('opened from a search card', () => {
  it('names the search, links its archived alerts, and has no sort', async () => {
    state.params = new URLSearchParams('search=s1')
    state.searches = [
      {
        id: 's1',
        series: { title: 'The Amazing Spider-Man', volume: 1 },
        issueNumber: '129',
        issueVolumeText: null,
        gradeMin: 9,
        gradeMax: 9.4,
        gradingAuthority: 'CGC',
        maxPrice: 4500,
        archivedAlertCount: 3,
      },
    ]
    state.alerts = [makeAlert({ id: 'x', searchId: 's1' }), makeAlert({ id: 'y', searchId: 's2' })]
    renderPage()
    expect(await screen.findByText('The Amazing Spider-Man #129')).toBeInTheDocument()
    expect(screen.getByText('9.0 to 9.4 · CGC · up to $4,500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '3 archived' })).toHaveAttribute('href', '/alerts/archive?search=s1')
    expect(screen.getByText('1 alert for this search')).toBeInTheDocument()
    expect(rows()).toHaveLength(1)
    expect(screen.queryByRole('group', { name: 'Show alerts' })).toBeNull()
  })
})

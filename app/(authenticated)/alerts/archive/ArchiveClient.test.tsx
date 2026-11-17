import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeAlert } from '@/lib/alertRows.fixture'

import type { AlertFilters } from '@/lib/api/alerts'
import type { Alert } from '@/types/alert.types'

import ArchiveClient from './ArchiveClient'

// Story 1.98 (U-12): the archive, against alerts-archive.html. Real queries over a mocked API.
const state = vi.hoisted(() => ({
  params: new URLSearchParams(),
  sort: 'date' as 'date' | 'book',
  archived: [] as unknown[],
  groups: [] as { searchId: string; title: string; count: number }[],
  searches: [] as unknown[],
  failList: false,
  failGroups: false,
  list: vi.fn(),
  getArchiveGroups: vi.fn(),
  setArchiveSort: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useSearchParams: () => state.params }))
vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({
    groups: [
      {
        label: 'Marketplaces',
        platforms: [
          { slug: 'ebay', displayName: 'eBay', defaultEnabled: true },
          { slug: 'heritage', displayName: 'Heritage', defaultEnabled: true },
          { slug: 'mycomicshop', displayName: 'MyComicShop', defaultEnabled: true },
        ],
      },
    ],
    displayNameFor: (s: string) => s,
  }),
}))
vi.mock('@/hooks/useUiPreferences', () => ({
  useUiPreferences: () => ({ archiveSort: state.sort, setArchiveSort: state.setArchiveSort, isLoaded: true }),
}))
vi.mock('@/lib/api/alerts', () => ({ alertsAPI: { list: state.list, getArchiveGroups: state.getArchiveGroups } }))
vi.mock('@/lib/api/searches', () => ({
  searchesAPI: { list: () => Promise.resolve({ searches: state.searches }) },
}))

const archived = (id: string, reason: string, over: Parameters<typeof makeAlert>[0] = {}): Alert =>
  makeAlert({
    id,
    listingStatus: reason === 'user_dismissed' ? 'archived_dismissed' : 'archived_expired',
    archiveReason: reason,
    archivedAt: new Date(2026, 9, 24, 15).toISOString(),
    createdAt: new Date(2026, 9, 20, 9).toISOString(),
    ...over,
  })

function respond(params: AlertFilters = {}) {
  if (state.failList) return Promise.reject(new Error('Internal: relation does not exist'))
  let rows = state.archived as Alert[]
  if (params.searchId) rows = rows.filter((a) => a.searchId === params.searchId)
  if (params.platform && params.platform !== 'all') rows = rows.filter((a) => a.listing.platform === params.platform)
  if (params.matchType === 'near_miss') rows = rows.filter((a) => a.nearMiss)
  if (params.matchType === 'direct_match') rows = rows.filter((a) => !a.nearMiss)
  const limit = params.limit ?? 20
  return Promise.resolve({ alerts: rows.slice(0, limit), pagination: { total: rows.length, limit, offset: 0 } })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ArchiveClient />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 17, 12, 0))
  state.params = new URLSearchParams()
  state.sort = 'date'
  state.archived = []
  state.groups = []
  state.searches = []
  state.failList = false
  state.failGroups = false
  state.list.mockReset().mockImplementation(respond)
  state.getArchiveGroups
    .mockReset()
    .mockImplementation(() => (state.failGroups ? Promise.reject(new Error('boom')) : Promise.resolve({ groups: state.groups })))
  state.setArchiveSort.mockReset()
})
afterEach(() => vi.useRealTimers())

describe('the archive', () => {
  it('each archived alert says why, with the right link, in the shared row', async () => {
    state.archived = [
      archived('sold', 'listing_sold', { listing: { pageQuality: 'White Pages', grade: 9.4 } }),
      archived('removed', 'listing_removed'),
      archived('newer', 'superseded', {
        listing: { price: 3300 },
        supersededBy: { id: 'n', listingStatus: 'active', price: 3100, searchId: 's1' },
      }),
    ]
    renderPage()
    const list = await screen.findByRole('list', { name: 'Archived alerts, newest first' })
    const [sold, removed, newer] = within(list).getAllByRole('listitem')
    expect(within(sold).getByText('CGC 9.4 · White pages ·', { exact: false })).toBeInTheDocument()
    expect(within(sold).getByText('Sold · Oct 24')).toBeInTheDocument()
    expect(within(sold).getByText('eBay · alert Oct 20')).toBeInTheDocument()
    expect(within(sold).getByRole('link', { name: /See the sold listing/ })).toHaveAttribute('href', 'https://example.test/item')
    expect(within(removed).getByText('Removed by the seller on Oct 24, so there is nothing to view')).toBeInTheDocument()
    expect(within(removed).queryByRole('link')).toBeNull()
    expect(within(newer).getByText('Replaced by a newer alert on Oct 24, when the price dropped to $3,100')).toBeInTheDocument()
    expect(within(newer).getByRole('link', { name: 'See the newer alert' })).toHaveAttribute('href', '/alerts?search=s1')
    expect(screen.queryByRole('button', { name: /Dismiss/ })).toBeNull()
    expect(screen.queryByText('New')).toBeNull()
    await waitFor(() => expect(screen.getByText('3 archived alerts')).toBeInTheDocument())
  })

  it('Show 20 more asks for 20 more, keeping the rows on screen', async () => {
    state.archived = Array.from({ length: 25 }, (_, i) => archived(`a${i}`, 'listing_ended'))
    renderPage()
    const list = await screen.findByRole('list', { name: 'Archived alerts, newest first' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(20)
    expect(screen.getByText('Showing 20 of 25 archived alerts')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(20) // still there while it loads
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(25))
    expect(state.list).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 40, status: 'archived' }))
    expect(screen.queryByRole('button', { name: 'Show 20 more' })).toBeNull()
  })

  it('a failed Show 20 more says so and offers Try again, keeping the rows (review)', async () => {
    state.archived = Array.from({ length: 25 }, (_, i) => archived(`a${i}`, 'listing_ended'))
    renderPage()
    const list = await screen.findByRole('list', { name: 'Archived alerts, newest first' })
    state.failList = true
    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }))
    expect(await screen.findByText('Those alerts couldn’t be loaded.')).toBeInTheDocument()
    expect(within(list).getAllByRole('listitem')).toHaveLength(20)
    state.failList = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(25))
  })

  it('filters on the server and says how many of the whole archive match', async () => {
    state.archived = [
      archived('e1', 'listing_ended'),
      archived('m1', 'listing_ended', { listing: { platform: 'mycomicshop' } }),
      archived('n1', 'listing_sold', { nearMiss: { overBy: 350, maxPrice: 4500 } }),
    ]
    renderPage()
    await screen.findByRole('list', { name: 'Archived alerts, newest first' })
    fireEvent.change(screen.getByLabelText('Marketplace'), { target: { value: 'mycomicshop' } })
    await waitFor(() => expect(screen.getByText('1 of your 3 archived alerts matches the filters')).toBeInTheDocument())
    expect(state.list).toHaveBeenLastCalledWith(expect.objectContaining({ platform: 'mycomicshop' }))
    fireEvent.change(screen.getByLabelText('Matches'), { target: { value: 'near' } })
    expect(await screen.findByText('No archived alerts match these filters')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!)
    await waitFor(() => expect(screen.getByText('3 archived alerts')).toBeInTheDocument())
  })

  it('nothing archived: as drawn, with no filter bar', async () => {
    renderPage()
    expect(await screen.findByText('Nothing archived yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Alerts' })).toHaveAttribute('href', '/alerts')
    await waitFor(() => expect(screen.queryByLabelText('Marketplace')).toBeNull())
    expect(screen.getByText('Alerts for listings that sold or ended, and ones you dismissed')).toBeInTheDocument()
  })

  it('a failed read says so in plain words, never the error, and Try again reads again', async () => {
    state.failList = true
    renderPage()
    expect(await screen.findByText("We couldn't load your archive")).toBeInTheDocument()
    expect(screen.queryByText(/relation/)).toBeNull()
    state.failList = false
    state.archived = [archived('a', 'listing_sold')]
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Sold · Oct 24')).toBeInTheDocument()
  })

  it('opened from a search card: names the search, no sort, links back to the whole archive', async () => {
    state.params = new URLSearchParams('search=s2')
    state.searches = [
      { id: 's2', series: { title: 'Iron Fist' }, issueNumber: '14', issueVolumeText: null, gradeMin: 9.4, gradeMax: 9.4, gradingAuthority: 'cgc', maxPrice: 2500, archivedAlertCount: 2 },
    ]
    state.archived = [archived('i1', 'listing_ended', { searchId: 's2' }), archived('x', 'listing_ended')]
    renderPage()
    expect(await screen.findByText('Archived alerts for one search')).toBeInTheDocument()
    expect(await screen.findByText('Iron Fist #14')).toBeInTheDocument()
    expect(screen.getByText('9.4 · CGC · up to $2,500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All archived alerts' })).toHaveAttribute('href', '/alerts/archive')
    expect(screen.queryByRole('group', { name: /Show/ })).toBeNull()
    await waitFor(() => expect(screen.getByText('1 archived alert for this search')).toBeInTheDocument())
    expect(state.list).toHaveBeenCalledWith(expect.objectContaining({ searchId: 's2' }))
  })
})

describe('By book', () => {
  beforeEach(() => {
    state.sort = 'book'
    state.groups = [
      { searchId: 's1', title: 'Werewolf by Night #32', count: 2 },
      { searchId: 'gone', title: 'Daredevil #158', count: 1 },
    ]
    state.searches = [
      { id: 's1', series: { title: 'Werewolf by Night' }, issueNumber: '32', issueVolumeText: null, gradeMin: 9, gradeMax: 9.4, gradingAuthority: 'cgc', maxPrice: 6000 },
    ]
    state.archived = [
      archived('w1', 'listing_sold'),
      archived('w2', 'user_dismissed'),
      archived('d1', 'search_deleted', { searchId: 'gone' }),
    ]
  })

  it('opens with every book closed; a book opens to its rows; the circle opens and closes them all', async () => {
    renderPage()
    const ww = await screen.findByRole('button', { name: /Werewolf by Night #32/ })
    expect(ww).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(await screen.findByText('Search deleted')).toBeInTheDocument()
    expect(screen.getByText('9.0 to 9.4 · CGC · up to $6,000')).toBeInTheDocument()
    expect(await screen.findByText('3 archived alerts')).toBeInTheDocument()

    fireEvent.click(ww)
    expect(await screen.findByText('Dismissed by you · Oct 24')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(state.list).toHaveBeenCalledWith(expect.objectContaining({ searchId: 's1', status: 'archived' }))

    fireEvent.click(screen.getByRole('button', { name: 'Collapse every book' }))
    await waitFor(() => expect(screen.queryAllByRole('listitem')).toHaveLength(0))
    fireEvent.click(screen.getByRole('button', { name: 'Expand every book' }))
    expect(await screen.findByText('Archived when you deleted this search · Oct 24')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('an open book pages its own alerts with Show 20 more', async () => {
    state.groups = [{ searchId: 's1', title: 'Werewolf by Night #32', count: 23 }]
    state.archived = Array.from({ length: 23 }, (_, i) => archived(`w${i}`, 'listing_ended'))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Werewolf by Night #32/ }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(20))
    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(23))
  })

  it('a failed list of books says so, with Try again', async () => {
    state.failGroups = true
    renderPage()
    expect(await screen.findByText("We couldn't load your archive")).toBeInTheDocument()
    expect(screen.getByText('Grouped by book')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

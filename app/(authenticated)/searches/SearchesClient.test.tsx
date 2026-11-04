/**
 * Story 1.35: MyComicShop added as a third platform-status badge on each
 * search card, alongside the existing eBay and Heritage badges.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GrailSearch } from '@/types/search.types'

vi.mock('@/hooks/useSearches', () => ({
  useSearches: vi.fn(),
}))

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: vi.fn(),
}))

// Story 1.82: the page now holds the toast listener and Latest matches (tested on its own)
const toast = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }))
vi.mock('@/components/searches/LatestMatches', () => ({
  LatestMatches: () => <aside aria-label="Latest matches stand-in" />,
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useSearches } from '@/hooks/useSearches'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { usePlatforms } from '@/hooks/usePlatforms'
import SearchesClient from './SearchesClient'

const CORE_ONLY_GROUPS = [
  {
    label: 'Core',
    platforms: [
      { slug: 'ebay', displayName: 'eBay', defaultEnabled: true },
      { slug: 'heritage', displayName: 'Heritage', defaultEnabled: true },
      { slug: 'mycomicshop', displayName: 'MyComicShop', defaultEnabled: true },
    ],
  },
]

const WITH_INDIE_GROUPS = [
  ...CORE_ONLY_GROUPS,
  {
    label: 'Independent Shops',
    platforms: [
      { slug: 'indie:bryscomics', displayName: "Bry's Comics", defaultEnabled: true },
      { slug: 'indie:comicbookaddiction', displayName: 'Comic Book Addiction', defaultEnabled: false },
    ],
  },
]

function mockUsePlatforms(groups: typeof CORE_ONLY_GROUPS) {
  vi.mocked(usePlatforms).mockReturnValue({
    groups,
    isLoading: false,
    error: null,
    displayNameFor: (slug: string) => slug,
    defaultEnabledSlugs: [],
  })
}

// Explicitly typed as GrailSearch (not just inferred) so tsc catches fixture
// drift from the real shape -- found on adversarial review: an earlier
// version of this fixture used a made-up `series.startYear`/`endYear` shape
// instead of the real `series.yearRange` field formatSeriesShort() actually
// reads, which silently rendered "3rd Series (undefined)" in the real DOM
// with nothing catching it, since the `as unknown as` cast on the mocked
// hook's return value (below) bypasses structural checking on this object.
function makeSearch(platforms: string[], overrides: Partial<GrailSearch> = {}): GrailSearch {
  return {
    id: 'search-1',
    userId: 'user-1',
    series: {
      id: 'series-1',
      title: 'Airboy Comics',
      volume: 3,
      yearRange: '1945-1953',
      type: 'series',
      publisher: 'Hillman',
    },
    issueNumber: '2',
    issueId: null,
    issueVolumeText: '3',
    issuePublicationYear: 1946,
    aliasGroupId: null,
    isActive: true,
    notificationsEnabled: true,
    platforms,
    maxPrice: null,
    gradeMin: null,
    gradeMax: null,
    pageQuality: null,
    gradingAuthority: null,
    currentAlertCount: 0,
    archivedAlertCount: 0,
    lastCheckedAt: '2026-08-29T12:00:00Z',
    createdAt: '2026-08-29T00:00:00Z',
    updatedAt: '2026-08-29T00:00:00Z',
    ...overrides,
  }
}

function mockUseSearches(searches: GrailSearch[]) {
  vi.mocked(useSearches).mockReturnValue({
    searches,
    isLoading: false,
    error: null,
    createSearch: { mutateAsync: vi.fn() },
    updateSearch: { mutateAsync: vi.fn() },
    deleteSearch: { mutateAsync: vi.fn() },
    updateSearchStatus: { mutateAsync: vi.fn() },
  } as unknown as ReturnType<typeof useSearches>)
}

// Story 1.49: real registry response now required by every test in this
// file, not just the new Independent Shops describe block -- default to a
// Core-only registry so pre-existing tests need no per-test change; the new
// describe block below overrides it explicitly where a second group matters.
beforeEach(() => {
  mockUsePlatforms(CORE_ONLY_GROUPS)
})

describe('SearchesClient — MyComicShop badge (Story 1.35)', () => {
  it('shows a checked, colored MyComicShop badge when the search includes it', () => {
    mockUseSearches([makeSearch(['ebay', 'heritage', 'mycomicshop'])])

    render(<SearchesClient />)
    expect(screen.getByText('MyComicShop ✓')).toBeInTheDocument()
  })

  it('renders the rest of the card correctly, not just the badges (guards against fixture drift)', () => {
    mockUseSearches([makeSearch(['ebay', 'heritage', 'mycomicshop'])])

    render(<SearchesClient />)
    expect(screen.getByText(/Airboy Comics/)).toBeInTheDocument()
    expect(screen.getByText('3rd Series (1945-1953)')).toBeInTheDocument()
  })

  it('shows an unchecked, grayed-out MyComicShop badge when the search does not include it (e.g. every search created before Story 1.34)', () => {
    mockUseSearches([makeSearch(['ebay', 'heritage'])])

    render(<SearchesClient />)
    expect(screen.getByText('MyComicShop')).toBeInTheDocument()
    expect(screen.queryByText('MyComicShop ✓')).not.toBeInTheDocument()
  })

  it('eBay and Heritage badges still render correctly (regression)', () => {
    mockUseSearches([makeSearch(['ebay'])])

    render(<SearchesClient />)
    expect(screen.getByText('eBay ✓')).toBeInTheDocument()
    expect(screen.getByText('Heritage')).toBeInTheDocument()
    expect(screen.queryByText('Heritage ✓')).not.toBeInTheDocument()
  })
})

describe('SearchesClient — "Last checked" footer, pre-first-check state', () => {
  it('shows "Last checked" once a search has actually been checked', () => {
    mockUseSearches([makeSearch(['ebay'], { lastCheckedAt: '2026-08-29T12:00:00Z' })])

    render(<SearchesClient />)
    expect(screen.getByText(/^Last checked:/)).toBeInTheDocument()
  })

  it('shows "First search runs" instead of an epoch date before the first check has happened', () => {
    mockUseSearches([
      makeSearch(['ebay'], { lastCheckedAt: null, nextScheduledRunAt: '2026-09-04T13:00:00.000Z' }),
    ])

    render(<SearchesClient />)
    expect(screen.getByText(/^First search runs:/)).toBeInTheDocument()
    expect(screen.queryByText(/^Last checked:/)).not.toBeInTheDocument()
    // The original bug: new Date(null) renders as the Unix epoch.
    expect(screen.queryByText(/1969/)).not.toBeInTheDocument()
  })

  it('falls back to a plain message if neither timestamp is available', () => {
    mockUseSearches([makeSearch(['ebay'], { lastCheckedAt: null, nextScheduledRunAt: null })])

    render(<SearchesClient />)
    expect(screen.getByText('Not yet checked')).toBeInTheDocument()
  })
})

describe('SearchesClient — Independent Shops aggregate pill (Story 1.49)', () => {
  it('renders no fourth pill at all when the registry has no non-Core group (today\'s real state)', () => {
    mockUsePlatforms(CORE_ONLY_GROUPS)
    mockUseSearches([makeSearch(['ebay'])])

    render(<SearchesClient />)
    expect(screen.queryByText(/Independent Shops/)).not.toBeInTheDocument()
  })

  it('shows a grey, unchecked pill when zero independent shops are active for this search', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    mockUseSearches([makeSearch(['ebay'])])

    render(<SearchesClient />)
    expect(screen.getByText('Independent Shops')).toBeInTheDocument()
    expect(screen.queryByText(/Independent Shops \(/)).not.toBeInTheDocument()
  })

  it('shows "Independent Shops (N) ✓" when every independent shop is active', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    mockUseSearches([makeSearch(['ebay', 'indie:bryscomics', 'indie:comicbookaddiction'])])

    render(<SearchesClient />)
    expect(screen.getByText('Independent Shops (2) ✓')).toBeInTheDocument()
  })

  it('shows "Independent Shops (N of M) ✓" when only some independent shops are active', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    mockUseSearches([makeSearch(['ebay', 'indie:bryscomics'])])

    render(<SearchesClient />)
    expect(screen.getByText('Independent Shops (1 of 2) ✓')).toBeInTheDocument()
  })

  it('the three Core pills still render exactly as before, alongside the new pill (regression)', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    mockUseSearches([makeSearch(['ebay', 'indie:bryscomics'])])

    render(<SearchesClient />)
    expect(screen.getByText('eBay ✓')).toBeInTheDocument()
    expect(screen.getByText('Heritage')).toBeInTheDocument()
    expect(screen.getByText('MyComicShop')).toBeInTheDocument()
  })
})

// Story 1.82 (U-04): the page around the cards
describe('SearchesClient: the home page (Story 1.82)', () => {
  it('says what the searches are doing under the title, and offers New search', () => {
    vi.mocked(useSearches).mockReturnValue({
      searches: [makeSearch(['ebay'], { isActive: true }), makeSearch(['ebay'], { id: 's2', isActive: false }), makeSearch(['ebay'], { id: 's3', isActive: true, held: true })],
      isLoading: false,
      deleteSearch: { mutateAsync: vi.fn(), isPending: false },
      updateSearchStatus: { mutateAsync: vi.fn(), isPending: false },
    } as never)
    render(<SearchesClient />)
    expect(screen.getByRole('heading', { level: 1, name: 'Searches' })).toBeInTheDocument()
    expect(screen.getByText('3 searches: 1 running, 1 paused, 1 on hold')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New search' })).toHaveAttribute('href', '/searches/new')
    expect(screen.getByLabelText('Latest matches stand-in')).toBeInTheDocument()
  })

  it('welcomes an account with no searches', () => {
    vi.mocked(useSearches).mockReturnValue({
      searches: [],
      isLoading: false,
      deleteSearch: { mutateAsync: vi.fn(), isPending: false },
      updateSearchStatus: { mutateAsync: vi.fn(), isPending: false },
    } as never)
    render(<SearchesClient />)
    expect(screen.queryByText('No searches yet')).toBeNull() // the card says it; the title line does not repeat it
    expect(screen.getByRole('heading', { name: 'Start your first search' })).toBeInTheDocument()
    expect(screen.getByText('Create your first grail search to start monitoring.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Search →' })).toHaveAttribute('href', '/searches/new')
  })

  it('a failed load says so and never shows the welcome for an account with no searches', () => {
    vi.mocked(useSearches).mockReturnValue({
      searches: [],
      isLoading: false,
      error: new Error('down'),
      deleteSearch: { mutateAsync: vi.fn(), isPending: false },
      updateSearchStatus: { mutateAsync: vi.fn(), isPending: false },
    } as never)
    render(<SearchesClient />)
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded')
    expect(screen.queryByText('Create Search →')).toBeNull()
  })

  it('shows the new-match toast when a match is found while the page is open (moved from the Dashboard)', () => {
    vi.mocked(useSearches).mockReturnValue({
      searches: [],
      isLoading: false,
      deleteSearch: { mutateAsync: vi.fn(), isPending: false },
      updateSearchStatus: { mutateAsync: vi.fn(), isPending: false },
    } as never)
    toast.showToast.mockReset()
    render(<SearchesClient />)
    window.dispatchEvent(new CustomEvent('new-alert', { detail: {} }))
    expect(toast.showToast).toHaveBeenCalledWith('New match found', expect.stringContaining('new match'), 'success', 8000)
  })
})


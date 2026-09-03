/**
 * Story 1.35: MyComicShop added as a third platform-status badge on each
 * search card, alongside the existing eBay and Heritage badges.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { GrailSearch } from '@/types/search.types'

vi.mock('@/hooks/useSearches', () => ({
  useSearches: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useSearches } from '@/hooks/useSearches'
import SearchesClient from './SearchesClient'

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

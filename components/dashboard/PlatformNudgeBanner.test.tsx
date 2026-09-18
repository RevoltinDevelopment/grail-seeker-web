/**
 * Story 1.49: the "missing coverage" nudge now checks a search's platforms
 * against the live registry's full slug list, not the hardcoded
 * ACTIVE_PLATFORMS array -- confirmed policy (Mahan): applies uniformly to
 * every registry platform, Core and Independent Shops alike, since every
 * platform is defaultEnabled and coverage is flat-rate.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GrailSearch } from '@/types/search.types'
import { PlatformNudgeBanner } from './PlatformNudgeBanner'

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { usePlatforms } from '@/hooks/usePlatforms'

const WITH_INDIE_GROUPS = [
  {
    label: 'Core',
    platforms: [
      { slug: 'ebay', displayName: 'eBay', defaultEnabled: true },
      { slug: 'heritage', displayName: 'Heritage', defaultEnabled: true },
      { slug: 'mycomicshop', displayName: 'MyComicShop', defaultEnabled: true },
    ],
  },
  {
    label: 'Independent Shops',
    platforms: [{ slug: 'indie:bryscomics', displayName: "Bry's Comics", defaultEnabled: true }],
  },
]

function mockUsePlatforms(groups: typeof WITH_INDIE_GROUPS) {
  vi.mocked(usePlatforms).mockReturnValue({
    groups,
    isLoading: false,
    error: null,
    displayNameFor: (slug: string) => slug,
    // Derived the same way the real hook derives it -- a hardcoded [] here
    // would have hidden the exact regression this fixture exists to catch.
    defaultEnabledSlugs: groups.flatMap((g) => g.platforms.filter((p) => p.defaultEnabled).map((p) => p.slug)),
  })
}

const INDIE_NOT_YET_DEFAULT_ENABLED = [
  WITH_INDIE_GROUPS[0],
  {
    label: 'Independent Shops',
    platforms: [{ slug: 'indie:comicbookaddiction', displayName: 'Comic Book Addiction', defaultEnabled: false }],
  },
]

function makeSearch(platforms: string[], overrides: Partial<GrailSearch> = {}): GrailSearch {
  return {
    id: 'search-1',
    userId: 'user-1',
    series: { id: 'series-1', title: 'Airboy Comics', volume: 3, yearRange: '1945-1953', type: 'series', publisher: 'Hillman' },
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
    lastCheckedAt: null,
    createdAt: '2026-08-29T00:00:00Z',
    updatedAt: '2026-08-29T00:00:00Z',
    ...overrides,
  }
}

describe('PlatformNudgeBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('does not render when every registry platform (Core + Independent Shops) is active', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    render(<PlatformNudgeBanner searches={[makeSearch(['ebay', 'heritage', 'mycomicshop', 'indie:bryscomics'])]} />)
    expect(screen.queryByText(/marketplace turned off/)).not.toBeInTheDocument()
  })

  it('renders when a Core platform is missing (regression)', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    render(<PlatformNudgeBanner searches={[makeSearch(['ebay', 'indie:bryscomics'])]} />)
    expect(screen.getByText(/marketplace turned off/)).toBeInTheDocument()
  })

  it('renders when an Independent Shop is missing, not just a Core platform (Story 1.49 policy)', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    render(<PlatformNudgeBanner searches={[makeSearch(['ebay', 'heritage', 'mycomicshop'])]} />)
    expect(screen.getByText(/marketplace turned off/)).toBeInTheDocument()
  })

  it('does not render when zero non-Core groups exist and every Core platform is active', () => {
    mockUsePlatforms([WITH_INDIE_GROUPS[0]])
    render(<PlatformNudgeBanner searches={[makeSearch(['ebay', 'heritage', 'mycomicshop'])]} />)
    expect(screen.queryByText(/marketplace turned off/)).not.toBeInTheDocument()
  })

  it('ignores an inactive search entirely, regardless of its platforms', () => {
    mockUsePlatforms(WITH_INDIE_GROUPS)
    render(<PlatformNudgeBanner searches={[makeSearch(['ebay'], { isActive: false })]} />)
    expect(screen.queryByText(/marketplace turned off/)).not.toBeInTheDocument()
  })

  it('code review fix: does not nag about an Independent Shop the registry has not marked defaultEnabled yet', () => {
    mockUsePlatforms(INDIE_NOT_YET_DEFAULT_ENABLED)
    render(<PlatformNudgeBanner searches={[makeSearch(['ebay', 'heritage', 'mycomicshop'])]} />)
    expect(screen.queryByText(/marketplace turned off/)).not.toBeInTheDocument()
  })
})

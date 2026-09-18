/**
 * Story 1.49: the edit-search page's "no recorded platforms" fallback now
 * uses the registry's real defaultEnabledSlugs instead of the hardcoded
 * ACTIVE_PLATFORMS constant. Scoped narrowly to that behavior.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EditSearchPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: 'search-1' }),
}))

vi.mock('@/hooks/useSearches', () => ({
  useSearch: vi.fn(),
  useSearches: () => ({ updateSearch: { mutateAsync: vi.fn() } }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useSearch } from '@/hooks/useSearches'

vi.mock('@/components/search/SeriesAutocomplete', () => ({
  SeriesAutocomplete: () => <div data-testid="series-autocomplete" />,
}))
vi.mock('@/components/search/IssueSelector', () => ({
  IssueSelector: () => <div data-testid="issue-selector" />,
}))
vi.mock('@/components/search/GradeRangeSelector', () => ({
  GradeRangeSelector: () => <div data-testid="grade-range" />,
}))
vi.mock('@/components/search/CriteriaHelperText', () => ({
  CriteriaHelperText: () => null,
}))

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { usePlatforms } from '@/hooks/usePlatforms'

vi.mock('@/components/search/PlatformSelector', () => ({
  PlatformSelector: ({ platforms }: { platforms: string[] }) => (
    <div data-testid="platform-selector">{platforms.join(',')}</div>
  ),
}))

function mockUsePlatforms(defaultEnabledSlugs: string[], isLoading = false) {
  vi.mocked(usePlatforms).mockReturnValue({
    groups: [],
    isLoading,
    error: null,
    displayNameFor: (slug: string) => slug,
    defaultEnabledSlugs,
  })
}

function mockSearch(platforms: string[] | undefined) {
  vi.mocked(useSearch).mockReturnValue({
    data: {
      id: 'search-1',
      series: { id: 's1', title: 'Airboy Comics', volume: 3, yearRange: '1945-1953', type: 'series', publisher: 'Hillman' },
      issueNumber: '2',
      issueId: null,
      issueVolumeText: '3',
      issuePublicationYear: 1946,
      aliasGroupId: null,
      gradeMin: null,
      gradeMax: null,
      pageQuality: null,
      gradingAuthority: null,
      maxPrice: null,
      platforms,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useSearch>)
}

describe('EditSearchPage — no-recorded-platforms fallback (Story 1.49)', () => {
  it('uses the search\'s own recorded platforms when present, ignoring the registry default', async () => {
    mockUsePlatforms(['ebay', 'heritage', 'mycomicshop', 'indie:bryscomics'])
    mockSearch(['ebay', 'heritage'])
    render(<EditSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay,heritage'))
  })

  it('falls back to the registry\'s real defaultEnabledSlugs, including an independent shop, when the search has no recorded platforms', async () => {
    mockUsePlatforms(['ebay', 'heritage', 'mycomicshop', 'indie:bryscomics'])
    mockSearch(undefined)
    render(<EditSearchPage />)
    await waitFor(() =>
      expect(screen.getByTestId('platform-selector')).toHaveTextContent(
        'ebay,heritage,mycomicshop,indie:bryscomics'
      )
    )
  })

  it('code review fix: shows the loading state, not an empty Platforms section, while the registry is still loading even after the search has loaded', () => {
    mockUsePlatforms([], true)
    mockSearch(['ebay'])
    render(<EditSearchPage />)
    expect(screen.getByText('Loading search...')).toBeInTheDocument()
    expect(screen.queryByTestId('platform-selector')).not.toBeInTheDocument()
  })
})

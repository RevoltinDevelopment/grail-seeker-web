/**
 * Story 1.49: the new-search page's platform state now initializes from the
 * registry's real defaultEnabledSlugs instead of the hardcoded
 * ACTIVE_PLATFORMS constant. Scoped narrowly to that behavior -- the rest of
 * this page (series/issue selection, submission) is exercised elsewhere and
 * unaffected by this story.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CreateSearchPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/hooks/useSearches', () => ({
  useSearches: () => ({ createSearch: { mutateAsync: vi.fn() } }),
}))

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

describe('CreateSearchPage — default platform selection (Story 1.49)', () => {
  it('starts with no platforms selected while the registry is still loading', () => {
    mockUsePlatforms([], true)
    render(<CreateSearchPage />)
    expect(screen.getByTestId('platform-selector')).toHaveTextContent('')
  })

  it('initializes platforms from the registry\'s real defaultEnabledSlugs once loaded', async () => {
    mockUsePlatforms(['ebay', 'heritage', 'mycomicshop'])
    render(<CreateSearchPage />)
    await waitFor(() =>
      expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay,heritage,mycomicshop')
    )
  })

  it('includes an independent shop when the registry marks it defaultEnabled', async () => {
    mockUsePlatforms(['ebay', 'heritage', 'mycomicshop', 'indie:bryscomics'])
    render(<CreateSearchPage />)
    await waitFor(() =>
      expect(screen.getByTestId('platform-selector')).toHaveTextContent('indie:bryscomics')
    )
  })
})

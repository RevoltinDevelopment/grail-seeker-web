/**
 * Story 1.49: the new-search page's platform state now initializes from the
 * registry's real defaultEnabledSlugs instead of the hardcoded
 * ACTIVE_PLATFORMS constant. Scoped narrowly to that behavior -- the rest of
 * this page (series/issue selection, submission) is exercised elsewhere and
 * unaffected by this story.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
// eslint-disable-next-line import/order -- the page is imported before the vi.mock() stand-ins below, as before
import CreateSearchPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mutateAsync = vi.fn().mockResolvedValue({})
vi.mock('@/hooks/useSearches', () => ({
  useSearches: () => ({ createSearch: { mutateAsync } }),
}))

// Stand-ins that let a test choose a series and an issue, so the form can be complete
vi.mock('@/components/search/SeriesAutocomplete', () => ({
  SeriesAutocomplete: ({ onSelect }: { onSelect: (s: unknown) => void }) => (
    <button
      type="button"
      onClick={() => onSelect({ id: 7, title: 'Example Comics', volume: 1, yearRange: '1970', type: 'series', publisher: 'Example' })}
    >
      Choose series
    </button>
  ),
}))

vi.mock('@/components/search/IssueSelector', () => ({
  IssueSelector: ({ onChange }: { onChange: (v: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ issueNumber: '1', issueId: null, issueVolumeText: null, issuePublicationYear: null, resolvedSeriesId: null })
      }
    >
      Choose issue
    </button>
  ),
}))

vi.mock('@/components/search/GradeRangeSelector', () => ({
  GradeRangeSelector: ({ grades, failed }: { grades: { label: string }[] | null; failed?: boolean }) => (
    <div data-testid="grade-range" data-failed={failed ? 'yes' : 'no'}>
      {(grades ?? []).map((g) => g.label).join('|')}
    </div>
  ),
}))

vi.mock('@/hooks/useGrades', () => ({
  useGrades: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useGrades } from '@/hooks/useGrades'

function mockUseGrades(state: 'loaded' | 'loading' | 'failed') {
  vi.mocked(useGrades).mockReturnValue({
    grades: state === 'loaded' ? [{ value: 9.4, label: '9.4 - Near Mint' }, { value: 9.8, label: '9.8 - NM/M' }] : null,
    isLoading: state === 'loading',
    failed: state === 'failed',
    isRetrying: false,
    failedAt: 0,
    retry: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseGrades('loaded')
})

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

describe('CreateSearchPage — grades from the API (Story 1.84)', () => {
  function completeTheForm() {
    fireEvent.click(screen.getByRole('button', { name: 'Choose series' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose issue' }))
  }

  it('waits for the grades, with the loading form, before drawing the form', () => {
    mockUseGrades('loading')
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading the search form')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('hands the server\'s grades to the grade selector', () => {
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    expect(screen.getByTestId('grade-range')).toHaveTextContent('9.4 - Near Mint|9.8 - NM/M')
  })

  it('sends "Any" as null, leaving the bounds to the server', async () => {
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    completeTheForm()
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ gradeMin: null, gradeMax: null, seriesId: 7, issueNumber: '1' })
  })

  it('when the grades could not load, a complete form still cannot be saved, and says why', async () => {
    mockUseGrades('failed')
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    completeTheForm()
    const save = screen.getByRole('button', { name: 'Save Search' })
    // Code review: focusable, so a screen reader reaches it and hears why
    expect(save).not.toBeDisabled()
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(save).toHaveAccessibleDescription('A search can be saved once the grades have loaded.')
    fireEvent.click(save)
    fireEvent.submit(screen.getByRole('form', { name: 'Create New Search' }))
    await new Promise((r) => setTimeout(r, 0))
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('has the design\'s back link, title and labels, and no old header bar', () => {
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Create New Search' })).toBeInTheDocument()
    expect(screen.getByText('What book are you seeking?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Searches' })).toHaveAttribute('href', '/searches')
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.getByText('Graded by')).toBeInTheDocument()
    expect(screen.getByText('Page Quality')).toBeInTheDocument()
    expect(screen.getByText('Maximum Price')).toBeInTheDocument()
  })
})

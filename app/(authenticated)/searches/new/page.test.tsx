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
  GradeRangeSelector: ({
    grades,
    failed,
    onChange,
    children,
  }: {
    grades: { label: string }[] | null
    failed?: boolean
    onChange: (min: number | null, max: number | null) => void
    children?: React.ReactNode
  }) => (
    <div>
      <div data-testid="grade-range" data-failed={failed ? 'yes' : 'no'}>
        {(grades ?? []).map((g) => g.label).join('|')}
      </div>
      <button type="button" onClick={() => onChange(9.4, 9.8)}>
        Choose 9.4 to 9.8
      </button>
      {children}
    </div>
  ),
}))

// Story 1.85: the account, for the slots; none by default (an account with no plan sees no badge)
vi.mock('@/hooks/useAccountSummary', () => ({
  ACCOUNT_SUMMARY_KEY: ['account-summary'],
  useAccountSummary: vi.fn(),
}))

const invalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useAccountSummary } from '@/hooks/useAccountSummary'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import type { AccountSummary } from '@/lib/api/account'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { APIError } from '@/lib/api/client'

function mockAccount(account: Partial<AccountSummary> | null, slots = { entitled: 10, inUse: 6, free: 4, over: 0 }) {
  vi.mocked(useAccountSummary).mockReturnValue({
    account: account
      ? {
          plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
          addonSlots: 0,
          status: 'active',
          slots,
          searches: [],
          heldSearches: [],
          change: null,
          enforcement: 'enforce',
          ...account,
        }
      : null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAccountSummary>)
}

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
  mockAccount(null)
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

describe('CreateSearchPage — slots (Story 1.85, S-10)', () => {
  function completeTheForm() {
    fireEvent.click(screen.getByRole('button', { name: 'Choose series' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose issue' }))
  }

  it('shows the badge with the free slots, and the cost of every grade under Grade', () => {
    mockAccount({})
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    expect(screen.getByRole('group', { name: 'Search slots: 4 available' })).toHaveTextContent('Search Slots4Available')
    expect(screen.getByText('A search in every grade would use 2 slots')).toBeInTheDocument()
  })

  it('an account with no plan sees no badge', () => {
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    expect(screen.queryByRole('group', { name: /Search slots/ })).not.toBeInTheDocument()
  })

  it('at enforce, Save on an untouched grade that does not fit is not sent, and says why in the agreed words', async () => {
    mockAccount({}, { entitled: 10, inUse: 9, free: 1, over: 0 })
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    completeTheForm()
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }))
    const notice = await screen.findByRole('alert', { name: 'Your search is not saved yet' })
    expect(notice).toHaveTextContent(
      'This search needs 2 slots and you have 1 free. Choose fewer grades, or delete a search you no longer need.'
    )
    expect(notice).toHaveTextContent('Everything you entered is still here.')
    expect(screen.getByRole('link', { name: 'Manage slots' })).toHaveAttribute('href', '/plan')
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save Search' })).toHaveAccessibleDescription(
      'Every grade needs more slots than you have free.'
    )
  })

  it("shows a refusal from the server in its words, reads the account again, and clears it when the grade changes", async () => {
    mockAccount({ enforcement: 'observe' })
    mutateAsync.mockRejectedValueOnce(
      new APIError(409, 'SLOT_LIMIT_EXCEEDED', 'This search needs 2 slots and you have 1 free. Choose fewer grades, or delete a search you no longer need.', undefined, {
        reason: 'no_room',
        needed: 2,
        available: 1,
        inUse: 9,
        entitled: 10,
      })
    )
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    completeTheForm()
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }))
    expect(await screen.findByRole('alert', { name: 'Your search is not saved yet' })).toHaveTextContent(
      'This search needs 2 slots and you have 1 free.'
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['account-summary'] })
    fireEvent.click(screen.getByRole('button', { name: 'Choose 9.4 to 9.8' }))
    expect(screen.queryByRole('alert', { name: 'Your search is not saved yet' })).not.toBeInTheDocument()
  })

  it('over plan at enforce: the notice, and no form', () => {
    mockAccount({ plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true } }, { entitled: 5, inUse: 8, free: 0, over: 3 })
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    expect(screen.getByRole('region', { name: 'Your searches use more slots than your plan' })).toHaveTextContent(
      'To add this search, first narrow or delete a search to make room.'
    )
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    // As drawn: no badge without the form (code review)
    expect(screen.queryByRole('group', { name: /Search slots/ })).not.toBeInTheDocument()
  })

  it('lapsed: Save cannot be pressed, and says why', async () => {
    mockAccount({ status: 'lapsed', enforcement: 'observe' }, { entitled: 0, inUse: 0, free: 0, over: 0 })
    mockUsePlatforms(['ebay'])
    render(<CreateSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    completeTheForm()
    expect(screen.getByRole('button', { name: 'Save Search' })).toHaveAccessibleDescription(
      'Your searches are on hold, so a search cannot be added.'
    )
    fireEvent.submit(screen.getByRole('form', { name: 'Create New Search' }))
    await new Promise((r) => setTimeout(r, 0))
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

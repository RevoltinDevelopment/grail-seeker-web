/**
 * Story 1.49: the edit-search page's "no recorded platforms" fallback now
 * uses the registry's real defaultEnabledSlugs instead of the hardcoded
 * ACTIVE_PLATFORMS constant. Scoped narrowly to that behavior.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
// eslint-disable-next-line import/order -- the page is imported before the vi.mock() stand-ins below, as before
import EditSearchPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: 'search-1' }),
}))

const mutateAsync = vi.fn().mockResolvedValue({})
const deleteAsync = vi.fn().mockResolvedValue({})
vi.mock('@/hooks/useSearches', () => ({
  useSearch: vi.fn(),
  useSearches: () => ({ updateSearch: { mutateAsync }, deleteSearch: { mutateAsync: deleteAsync, isPending: false } }),
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
  GradeRangeSelector: ({
    onChange,
    failed,
    narrowTo,
    children,
  }: {
    onChange: (a: number | null, b: number | null) => void
    failed?: boolean
    narrowTo?: { min: number; max: number } | null
    children?: React.ReactNode
  }) => (
    <div data-testid="grade-range" data-failed={failed ? 'yes' : 'no'} data-narrow={narrowTo ? `${narrowTo.min}-${narrowTo.max}` : ''}>
      <button type="button" onClick={() => onChange(null, null)}>
        Choose Any
      </button>
      {children}
    </div>
  ),
}))

// Story 1.85: the account, for the slots; none by default
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

function mockSearch(
  platforms: string[] | undefined,
  grades: { gradeMin: number | null; gradeMax: number | null } = { gradeMin: null, gradeMax: null },
  extra: Record<string, unknown> = {}
) {
  vi.mocked(useSearch).mockReturnValue({
    data: {
      id: 'search-1',
      series: { id: 's1', title: 'Airboy Comics', volume: 3, yearRange: '1945-1953', type: 'series', publisher: 'Hillman' },
      issueNumber: '2',
      issueId: null,
      issueVolumeText: '3',
      issuePublicationYear: 1946,
      aliasGroupId: null,
      ...grades,
      pageQuality: null,
      gradingAuthority: null,
      maxPrice: null,
      platforms,
      ...extra,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useSearch>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseGrades('loaded')
  mockAccount(null)
})

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
    expect(screen.getByRole('status')).toHaveTextContent('Loading search')
    expect(screen.queryByTestId('platform-selector')).not.toBeInTheDocument()
  })
})

describe('EditSearchPage — grades from the API (Story 1.84)', () => {
  it('waits for the grades, with the loading form', () => {
    mockUseGrades('loading')
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'])
    render(<EditSearchPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading search')
    expect(screen.queryByTestId('grade-range')).not.toBeInTheDocument()
  })

  it('sends "Any" as null, leaving the bounds to the server', async () => {
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'], { gradeMin: 9.0, gradeMax: 9.4 })
    render(<EditSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Any' }))
    fireEvent.click(screen.getByRole('button', { name: 'Update Search' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync.mock.calls[0][0].data).toMatchObject({ gradeMin: null, gradeMax: null })
  })

  it('when the grades could not load, still saves, and leaves the saved grade to the server untouched', async () => {
    mockUseGrades('failed')
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'], { gradeMin: 9.0, gradeMax: 9.4 })
    render(<EditSearchPage />)
    await waitFor(() => expect(screen.getByTestId('grade-range')).toHaveAttribute('data-failed', 'yes'))
    const update = screen.getByRole('button', { name: 'Update Search' })
    expect(update).toBeEnabled()
    fireEvent.click(update)
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    // Code review: the grade is not sent at all, so the server keeps the saved one exactly
    const sent = mutateAsync.mock.calls[0][0].data
    expect(sent).not.toHaveProperty('gradeMin')
    expect(sent).not.toHaveProperty('gradeMax')
    expect(sent).toMatchObject({ platforms: ['ebay'] })
  })

  it('has the design\'s back link and title, and no old header bar', async () => {
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'])
    render(<EditSearchPage />)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Edit Search' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Back to Searches' })).toHaveAttribute('href', '/searches')
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.getByText('Graded by')).toBeInTheDocument()
  })
})

describe('EditSearchPage — slots and holds (Story 1.85, S-10)', () => {
  it('the badge counts the slots the search already uses: "Available to this search"', async () => {
    mockAccount({})
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'], { gradeMin: 9.4, gradeMax: 9.4 }, { slotsUsed: 3 })
    render(<EditSearchPage />)
    const badge = await screen.findByRole('group', { name: 'Search slots: 7 available to this search' })
    expect(badge).toHaveTextContent('Search Slots7AvailableTo This Search')
    expect(screen.getByText('9.4 = 1 slot')).toBeInTheDocument()
  })

  it('over plan at enforce: the grades can only narrow, and the notice says so', async () => {
    mockAccount({}, { entitled: 5, inUse: 8, free: 0, over: 3 })
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'], { gradeMin: 9.4, gradeMax: 9.4 }, { slotsUsed: 1 })
    render(<EditSearchPage />)
    await waitFor(() => expect(screen.getByTestId('grade-range')).toHaveAttribute('data-narrow', '9.4-9.4'))
    expect(screen.getByText('While your searches use more slots than your plan, the grades here can only narrow.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your searches use more slots than your plan' })).toHaveTextContent(
      'You can still change anything on this search, and narrow its grade.'
    )
  })

  it('a held search shows its held page: read-only, with Delete, and no form', async () => {
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'], { gradeMin: 9.4, gradeMax: 9.4 }, { held: true, heldReason: 'downgrade', heldAt: '2026-10-03T13:00:00Z', isActive: true, slotsUsed: 1 })
    render(<EditSearchPage />)
    const notice = await screen.findByRole('region', { name: 'This search is on hold' })
    expect(notice).toHaveTextContent('It does not fit your current plan, so it cannot be changed while it is on hold.')
    expect(notice).toHaveTextContent('Nothing has been deleted, and its alerts are kept.')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Airboy Comics')
    fireEvent.click(screen.getByRole('button', { name: /^Delete / }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteAsync).toHaveBeenCalledWith('search-1'))
  })

  it('Update Search meeting SEARCH_HELD shows "Your changes were not saved" and reads the search again', async () => {
    mutateAsync.mockRejectedValueOnce(new APIError(409, 'SEARCH_HELD', 'This search is on hold.', undefined, { heldReason: 'lapse' }))
    mockUsePlatforms(['ebay'])
    mockSearch(['ebay'], { gradeMin: 9.4, gradeMax: 9.4 })
    render(<EditSearchPage />)
    await waitFor(() => expect(screen.getByTestId('platform-selector')).toHaveTextContent('ebay'))
    fireEvent.click(screen.getByRole('button', { name: 'Update Search' }))
    const notice = await screen.findByRole('alert', { name: 'Your changes were not saved' })
    expect(notice).toHaveTextContent('Every search is on hold while your subscription is not active.')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['searches'] })
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })
})

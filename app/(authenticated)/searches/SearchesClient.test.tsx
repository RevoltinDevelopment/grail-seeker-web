/**
 * The Searches page (Stories 1.82 and 1.83). The card, the slot strip, the banner's choice and
 * Latest matches have their own tests; this is the page around them.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AccountSummary } from '@/lib/api/account'
import type { GrailSearch } from '@/types/search.types'

const state = vi.hoisted(() => ({
  searches: [] as unknown[],
  error: null as unknown,
  account: null as unknown,
  accountLoading: false,
  accountError: null as unknown,
  toggle: vi.fn(),
  invalidate: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@/hooks/useSearches', () => ({
  useSearches: () => ({
    searches: state.searches,
    isLoading: false,
    error: state.error,
    deleteSearch: { mutateAsync: vi.fn(), isPending: false },
    updateSearchStatus: { mutateAsync: state.toggle, isPending: false, variables: undefined },
  }),
}))
vi.mock('@/hooks/useAccountSummary', () => ({
  useAccountSummary: () => ({
    account: state.account,
    isLoading: state.accountLoading,
    error: state.accountError,
  }),
}))
vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({
    groups: [{ label: 'Core', platforms: [] }],
    defaultEnabledSlugs: ['ebay'],
    displayNameFor: (s: string) => s,
  }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: state.invalidate }),
}))
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showToast: state.showToast }) }))
vi.mock('@/components/searches/LatestMatches', () => ({
  LatestMatches: () => <aside aria-label="Latest matches stand-in" />,
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { APIError } from '@/lib/api/client'
import SearchesClient, { refusedPauseWords } from './SearchesClient'

function search(id: string, over: Partial<GrailSearch> = {}): GrailSearch {
  return {
    id,
    userId: 'u',
    series: {
      id: 's',
      title: 'X-Men',
      volume: 1,
      yearRange: '1963-1981',
      type: 'series',
      publisher: 'Marvel',
    },
    issueNumber: '94',
    issueId: null,
    issueVolumeText: null,
    issuePublicationYear: null,
    aliasGroupId: null,
    isActive: true,
    notificationsEnabled: true,
    platforms: ['ebay'],
    maxPrice: 3000,
    gradeMin: 9.2,
    gradeMax: 9.2,
    pageQuality: null,
    gradingAuthority: 'cbcs',
    slotsUsed: 1,
    currentAlertCount: 0,
    archivedAlertCount: 0,
    lastCheckedAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...over,
  }
}

function account(over: Partial<AccountSummary> = {}): AccountSummary {
  return {
    plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots: { entitled: 5, inUse: 1, free: 4, over: 0 },
    searches: [
      {
        searchId: 'a',
        slots: 1,
        firstSlot: 1,
        lastSlot: 1,
        isActive: true,
        fate: 'continues',
        fateAt: null,
      },
    ],
    heldSearches: [],
    change: null,
    enforcement: 'observe',
    ...over,
  }
}

beforeEach(() => {
  state.searches = [search('a')]
  state.error = null
  state.account = account()
  state.accountLoading = false
  state.accountError = null
  state.toggle.mockReset()
  state.invalidate.mockReset()
  state.showToast.mockReset()
  sessionStorage.clear()
})

describe('SearchesClient', () => {
  it('the title line, a filled New search, the slot strip and the cards', () => {
    state.searches = [
      search('a'),
      search('b', { isActive: false }),
      search('c', { held: true, heldReason: 'downgrade' }),
    ]
    render(<SearchesClient />)
    expect(screen.getByRole('heading', { level: 1, name: 'Searches' })).toBeInTheDocument()
    expect(screen.getByText('3 searches: 1 running, 1 paused, 1 on hold')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New search' })).toHaveAttribute(
      'href',
      '/searches/new'
    )
    expect(screen.getByLabelText('Your slots')).toHaveTextContent('Starter plan')
    expect(document.querySelectorAll('article[data-state]')).toHaveLength(3)
    expect(screen.getByLabelText('Latest matches stand-in')).toBeInTheDocument()
  })

  it('over the plan while the limit is enforced: banner 8, and New search is an outline button with its reason', () => {
    state.account = account({
      enforcement: 'enforce',
      slots: { entitled: 5, inUse: 8, free: 0, over: 3 },
      searches: [
        {
          searchId: 'a',
          slots: 8,
          firstSlot: 1,
          lastSlot: 8,
          isActive: true,
          fate: 'continues',
          fateAt: null,
        },
      ],
    })
    render(<SearchesClient />)
    expect(document.querySelector('[data-state="8"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'New search' })).toBeDisabled()
    expect(
      screen.getByText('You can add a search once your searches fit your 5 slots.')
    ).toBeInTheDocument()
  })

  it('over the plan at observe: nothing is refused, so nothing says it is', () => {
    state.account = account({ slots: { entitled: 5, inUse: 8, free: 0, over: 3 } })
    render(<SearchesClient />)
    expect(document.querySelector('[data-state="8"]')).toBeNull()
    expect(screen.getByRole('link', { name: 'New search' })).toBeInTheDocument()
  })

  it('a lapsed account cannot add a search, whatever the switch says', () => {
    state.account = account({
      status: 'lapsed',
      slots: { entitled: 0, inUse: 0, free: 0, over: 0 },
    })
    state.searches = [search('a', { held: true, heldReason: 'lapse' })]
    render(<SearchesClient />)
    expect(screen.getByRole('button', { name: 'New search' })).toBeDisabled()
  })

  it('no banner while the account is still loading, so a lower state never flashes first', () => {
    state.account = null
    state.accountLoading = true
    state.searches = [search('a', { platforms: [] })]
    render(<SearchesClient />)
    expect(screen.queryByText('You may be missing matches')).toBeNull()
  })

  it('a failed account load says so', () => {
    state.account = null
    state.accountError = new Error('down')
    render(<SearchesClient />)
    expect(
      screen.getByText('Your plan and slots could not be loaded. Refresh the page to try again.')
    ).toBeInTheDocument()
  })

  it('the marketplace banner can be dismissed for the session', () => {
    state.searches = [search('a', { platforms: [] })]
    render(<SearchesClient />)
    expect(screen.getByText('You may be missing matches')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('You may be missing matches')).toBeNull()
    expect(sessionStorage.getItem('platform-nudge-dismissed')).toBe('true')
  })

  it('pause meeting a hold shows the refused line on that card, not an error', async () => {
    state.toggle.mockRejectedValue(
      new APIError(409, 'SEARCH_HELD', 'held', undefined, {
        code: 'SEARCH_HELD',
        heldReason: 'lapse',
      })
    )
    render(<SearchesClient />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause X-Men #94' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(refusedPauseWords('lapse'))
    )
    expect(state.showToast).not.toHaveBeenCalled()
    // the list was out of date: it is read again, so the card shows the hold
    expect(state.invalidate).toHaveBeenCalledWith({ queryKey: ['searches'] })
    expect(state.invalidate).toHaveBeenCalledWith({ queryKey: ['account-summary'] })
  })

  it('the refused words follow the reason and the button pressed', () => {
    expect(refusedPauseWords('lapse')).toBe(
      'Not paused. This search went on hold before you pressed Pause, with every other search.'
    )
    expect(refusedPauseWords('downgrade')).toBe(
      'Not paused. This search went on hold before you pressed Pause.'
    )
    expect(refusedPauseWords(undefined)).toBe(
      'Not paused. This search went on hold before you pressed Pause.'
    )
    expect(refusedPauseWords('downgrade', 'Resume')).toBe(
      'Not resumed. This search went on hold before you pressed Resume.'
    )
  })

  it('another refusal is shown in the server\'s words, not "try again"', async () => {
    state.toggle.mockRejectedValue(
      new APIError(409, 'SLOT_LIMIT_EXCEEDED', 'Your plan has no free slot for this search.')
    )
    render(<SearchesClient />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause X-Men #94' }))
    await waitFor(() =>
      expect(state.showToast).toHaveBeenCalledWith(
        'Not saved',
        'Your plan has no free slot for this search.',
        'error',
        6000
      )
    )
  })

  it("welcomes an account with no searches, in Mahan's words", () => {
    state.searches = []
    render(<SearchesClient />)
    expect(screen.getByRole('heading', { name: 'Start your first search' })).toBeInTheDocument()
    expect(
      screen.getByText('Create your first grail search to start monitoring.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Search →' })).toHaveAttribute(
      'href',
      '/searches/new'
    )
  })

  it('a failed load says so and never shows the welcome', () => {
    state.searches = []
    state.error = new Error('down')
    render(<SearchesClient />)
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded')
    expect(screen.queryByText('Create Search →')).toBeNull()
  })

  it('shows the new-match toast when a match is found while the page is open', () => {
    render(<SearchesClient />)
    window.dispatchEvent(new CustomEvent('new-alert', { detail: {} }))
    expect(state.showToast).toHaveBeenCalledWith(
      'New match found',
      expect.stringContaining('new match'),
      'success',
      8000
    )
  })
})

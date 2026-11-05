import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'

import type { AccountSummary, NumberedSearchView } from '@/lib/api/account'
import type { GrailSearch } from '@/types/search.types'

import { PlanPage } from './PlanPage'

vi.mock('@/hooks/useAccountSummary', () => ({ useAccountSummary: vi.fn() }))
const invalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ invalidateQueries }),
}))
vi.mock('@/hooks/useSearches', () => ({ useSearches: vi.fn() }))
vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({
    groups: [],
    defaultEnabledSlugs: ['ebay'],
    isLoading: false,
    error: null,
    displayNameFor: (s: string) => s,
  }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useAccountSummary } from '@/hooks/useAccountSummary'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useSearches } from '@/hooks/useSearches'

// Invented books and account (plan-page.js, "normal")
function search(
  id: string,
  title: string,
  issue: string,
  min: number,
  max: number,
  extra: Partial<GrailSearch> = {}
): GrailSearch {
  return {
    id,
    userId: 'u',
    series: {
      id: `s-${id}`,
      title,
      volume: 1,
      yearRange: '1963',
      type: 'series',
      publisher: 'Marvel',
    },
    issueNumber: issue,
    issueId: null,
    issueVolumeText: null,
    issuePublicationYear: null,
    aliasGroupId: null,
    maxPrice: null,
    gradeMin: min,
    gradeMax: max,
    pageQuality: null,
    gradingAuthority: 'CGC',
    platforms: ['ebay'],
    isActive: true,
    notificationsEnabled: true,
    lastCheckedAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...extra,
  }
}
const view = (searchId: string, firstSlot: number, slots: number): NumberedSearchView => ({
  searchId,
  slots,
  firstSlot,
  lastSlot: firstSlot + slots - 1,
  isActive: true,
  fate: 'continues',
  fateAt: null,
})
const HULK = search('hulk', 'The Incredible Hulk', '181', 9.8, 9.8)
const ASM = search('asm', 'The Amazing Spider-Man', '129', 9, 9.4)
const IF14 = search('if14', 'Iron Fist', '14', 9.4, 9.4, {
  held: true,
  heldReason: 'downgrade',
  heldAt: '2026-10-03T13:00:00Z',
  slotsUsed: 1,
})

function account(over: Partial<AccountSummary> = {}): AccountSummary {
  return {
    plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots: { entitled: 10, inUse: 4, free: 6, over: 0 },
    searches: [view('hulk', 1, 1), view('asm', 2, 3)],
    heldSearches: [],
    change: null,
    enforcement: 'observe',
    ...over,
  }
}

const deleteAsync = vi.fn().mockResolvedValue({})
const refetch = vi.fn()
function mock(
  a: AccountSummary | null,
  opts: { loading?: boolean; error?: boolean; searches?: GrailSearch[] } = {}
) {
  vi.mocked(useAccountSummary).mockReturnValue({
    account: a,
    isLoading: !!opts.loading,
    error: opts.error ? new Error('x') : null,
    refetch,
  } as unknown as ReturnType<typeof useAccountSummary>)
  vi.mocked(useSearches).mockReturnValue({
    searches: opts.searches ?? [HULK, ASM],
    isLoading: false,
    error: null,
    deleteSearch: { mutateAsync: deleteAsync, isPending: false },
  } as unknown as ReturnType<typeof useSearches>)
}

beforeEach(() => vi.clearAllMocks())

describe('PlanPage (Story 1.85, S-10)', () => {
  it('shows the loading page first', () => {
    mock(null, { loading: true })
    render(<PlanPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading your plan')
  })

  it('the plan, its facts, and Change plan with the way to reach us', () => {
    mock(account())
    render(<PlanPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Your plan' })).toBeInTheDocument()
    const plan = screen.getByRole('region', { name: 'Plan' })
    expect(plan).toHaveTextContent('Collector')
    expect(plan).toHaveTextContent('Slots10TextsIncludedIn use4 of 10Free6')
    expect(within(plan).getByRole('button', { name: 'Change plan' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(within(plan).getByRole('link', { name: 'support@grailseeker.io' })).toHaveAttribute(
      'href',
      'mailto:support@grailseeker.io'
    )
  })

  it('leaves "Needs your attention" out when nothing needs attention', () => {
    mock(account())
    render(<PlanPage />)
    expect(screen.queryByRole('heading', { name: 'Needs your attention' })).not.toBeInTheDocument()
  })

  it('lists what needs attention, with the banner words', () => {
    mock(account(), { searches: [{ ...HULK, platforms: [] }, ASM] })
    render(<PlanPage />)
    const att = screen.getByRole('region', { name: 'Needs your attention' })
    expect(att).toHaveTextContent('You may be missing matches')
    expect(within(att).getByRole('link', { name: 'Review searches' })).toHaveAttribute(
      'href',
      '/searches#your-searches'
    )
  })

  it('numbers the slots, each search with Edit and Delete, and the free slots with New search', () => {
    mock(account())
    render(<PlanPage />)
    const list = screen.getByRole('list', { name: 'Your slots, numbered' })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Slot 1The Incredible Hulk #1819.8 · CGC · 1 slot')
    expect(items[1]).toHaveTextContent(
      'Slots 2 to 4The Amazing Spider-Man #1299.0 to 9.4 · CGC · 3 slots'
    )
    expect(
      within(items[1]).getByRole('link', { name: 'Edit The Amazing Spider-Man #129' })
    ).toHaveAttribute('href', '/searches/asm/edit')
    expect(items[2]).toHaveTextContent(
      'Slots 5 to 10Free6 slots for new searches, or for wider grades'
    )
    expect(within(items[2]).getByRole('link', { name: 'New search' })).toHaveAttribute(
      'href',
      '/searches/new'
    )
    expect(
      screen.getByRole('img', { name: '4 slots running, 0 paused, 6 free. Your plan has 10.' })
    ).toBeInTheDocument()
  })

  it('Story 1.86: a waiting downgrade offers Change my choice, to the pick screen', () => {
    mock(
      account({
        slots: { entitled: 5, inUse: 4, free: 1, over: 0 },
        change: {
          kind: 'downgrade_pending',
          plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
          addonSlots: 0,
          slots: 5,
          effectiveAt: '2026-11-01T04:00:00Z',
          keepSearchIds: ['hulk'],
        },
      })
    )
    render(<PlanPage />)
    const att = screen.getByRole('region', { name: 'Needs your attention' })
    expect(within(att).getByRole('link', { name: 'Change my choice' })).toHaveAttribute(
      'href',
      '/plan/choose'
    )
  })

  it('Delete asks, then deletes', async () => {
    mock(account())
    render(<PlanPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete The Incredible Hulk #181' }))
    const ask = screen.getByRole('group', { name: 'Delete The Incredible Hulk #181?' })
    fireEvent.click(within(ask).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteAsync).toHaveBeenCalledWith('hulk'))
  })

  it('held searches as held cards, with how each comes back', () => {
    mock(
      account({
        plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
        slots: { entitled: 5, inUse: 4, free: 1, over: 0 },
        heldSearches: [
          {
            searchId: 'if14',
            slots: 1,
            heldReason: 'downgrade',
            isActive: true,
            fate: 'held',
            fateAt: null,
          },
        ],
      }),
      { searches: [HULK, ASM, IF14] }
    )
    render(<PlanPage />)
    const held = screen.getByRole('region', { name: 'On hold' })
    expect(held).toHaveTextContent('A search on hold is not searched and uses no slots.')
    expect(held).toHaveTextContent(
      'There is room for it now: it needs 1 slot and you have 1 free. To bring it back now, delete it and create it again. Its alert history does not carry over.'
    )
    expect(within(held).getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/searches/if14/edit'
    )
  })

  it('lapsed: no meter or list, only the line about coming back', () => {
    mock(
      account({
        status: 'lapsed',
        slots: { entitled: 0, inUse: 0, free: 0, over: 0 },
        searches: [],
      }),
      { searches: [{ ...HULK, held: true, heldReason: 'lapse', heldAt: '2026-10-14T13:00:00Z' }] }
    )
    render(<PlanPage />)
    expect(screen.queryByRole('list', { name: 'Your slots, numbered' })).not.toBeInTheDocument()
    expect(
      screen.getByText(/While your searches are on hold they use no slots/)
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Plan' })).toHaveTextContent('On hold since Oct 14.')
  })

  it('an account with no plan says so', () => {
    mock(account({ plan: null, status: 'none' }))
    render(<PlanPage />)
    expect(screen.getByText('Your account does not have a plan yet.')).toBeInTheDocument()
  })

  it('could not load: says so, with Try again', () => {
    mock(null, { error: true })
    render(<PlanPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('Your plan could not be loaded.')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalled()
  })
})

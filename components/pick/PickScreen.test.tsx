import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'

// eslint-disable-next-line import/order -- kept above the vi.mock() stand-ins, which are hoisted
import type { AccountSummary, NumberedSearchView } from '@/lib/api/account'
// eslint-disable-next-line import/order -- kept above the vi.mock() stand-ins, which are hoisted
import type { GrailSearch } from '@/types/search.types'

// eslint-disable-next-line import/order -- kept above the vi.mock() stand-ins, which are hoisted
import { PickScreen } from './PickScreen'

vi.mock('@/hooks/useAccountSummary', () => ({
  ACCOUNT_SUMMARY_KEY: ['account-summary'],
  useAccountSummary: vi.fn(),
}))
vi.mock('@/hooks/useSearches', () => ({ useSearches: vi.fn() }))
vi.mock('@/hooks/useGrades', () => ({ useGrades: vi.fn() }))
vi.mock('@/hooks/usePickPreview', () => ({ usePickPreview: vi.fn() }))
const fetchQuery = vi.fn()
const invalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ fetchQuery, invalidateQueries }),
}))
const pick = vi.fn()
vi.mock('@/lib/api/account', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/account')>()),
  accountAPI: { pick: (ids: string[]) => pick(ids) },
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useAccountSummary } from '@/hooks/useAccountSummary'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useGrades } from '@/hooks/useGrades'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { usePickPreview } from '@/hooks/usePickPreview'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { useSearches } from '@/hooks/useSearches'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { APIError } from '@/lib/api/client'

// The design's account (pick-screen.js "reg"): Starter, 5 slots. Invented books.
const VALUES = [
  0.5, 1, 1.5, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.2, 9.4, 9.6, 9.8,
  9.9, 10,
]
const GRADES = VALUES.map((value) => ({ value, label: value.toFixed(1) }))
const DUE = '2026-10-28T04:00:00Z'

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
    maxPrice: 4500,
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
const ASM = search('asm', 'The Amazing Spider-Man', '129', 9, 9.4)
const HULK = search('hulk', 'The Incredible Hulk', '181', 9.8, 9.8)
const WBN = search('wbn', 'Werewolf by Night', '32', 9.6, 9.8)
const IF14 = search('if14', 'Iron Fist', '14', 9.4, 9.4, {
  held: true,
  heldReason: 'downgrade',
  heldAt: '2026-10-03T13:00:00Z',
})

const view = (
  searchId: string,
  firstSlot: number,
  slots: number,
  fate = 'undecided'
): NumberedSearchView => ({
  searchId,
  slots,
  firstSlot,
  lastSlot: firstSlot + slots - 1,
  isActive: true,
  fate,
  fateAt: DUE,
})
function account(over: Partial<AccountSummary> = {}): AccountSummary {
  return {
    plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
    searches: [view('asm', 1, 3), view('hulk', 4, 1), view('wbn', 5, 2)],
    heldSearches: [],
    change: {
      kind: 'pick_needed',
      reason: 'reduce',
      dueAt: DUE,
      overdue: false,
      slotsToFit: 5,
      pickedSearchIds: null,
    },
    enforcement: 'enforce',
    nextRoundAt: '2026-11-05T23:00:00Z',
    ...over,
  }
}

const updateAsync = vi.fn().mockResolvedValue({})
function mock(
  a: AccountSummary | null,
  opts: { searches?: GrailSearch[]; preview?: ReturnType<typeof usePickPreview> } = {}
) {
  vi.mocked(useAccountSummary).mockReturnValue({
    account: a,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAccountSummary>)
  vi.mocked(useSearches).mockReturnValue({
    searches: opts.searches ?? [ASM, HULK, WBN],
    isLoading: false,
    error: null,
    deleteSearch: { mutateAsync: vi.fn(), isPending: false },
    updateSearch: { mutateAsync: updateAsync },
  } as unknown as ReturnType<typeof useSearches>)
  vi.mocked(useGrades).mockReturnValue({
    grades: GRADES,
    isLoading: false,
    failed: false,
    isRetrying: false,
    failedAt: 0,
    retry: vi.fn(),
  })
  vi.mocked(usePickPreview).mockReturnValue(
    opts.preview ?? { preview: null, failed: false, error: null, retry: vi.fn() }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // Every Confirm reads the list again first (code review): by default it is the list on screen
  fetchQuery.mockImplementation(async () => ({
    searches: vi.mocked(useSearches).mock.results.at(-1)?.value.searches ?? [],
  }))
})

const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')
// The spoken name starts with the visible words (code review): "Keep this search, X", "Keeping, X"
const keepButton = (title: string) =>
  screen.getByRole('button', {
    name: new RegExp(`^(Keep this search|Keeping|Bring it back), ${escape(title)}$`),
  })

describe('PickScreen (Story 1.86, S-12)', () => {
  it('a reduction: the heading, the lede, the promises, and each search undecided until something is kept', () => {
    mock(account())
    render(<PickScreen />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Choose the searches to keep' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Your plan now has 5 slots and your searches use 6\. Choose the searches to keep by/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('If you have not chosen by then, every search goes on hold until you do.')
    ).toBeInTheDocument()
    const card = screen.getByRole('article', { name: 'The Amazing Spider-Man #129' })
    expect(card).toHaveTextContent('Grade 9.0 to 9.4 · CGC · up to $4,500')
    expect(card).toHaveTextContent(/Runs until Oct \d+\. Keep it, or it stops then\./)
    const tally = screen.getByRole('complementary', { name: 'Your choice' })
    expect(tally).toHaveTextContent('Nothing chosen yet')
    expect(within(tally).getByRole('button', { name: 'Confirm my choice' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    // The phone bar waits for the first Keep
    expect(tally.className).toMatch(/(^|\s)hidden(\s|$)/)
  })

  it('Keep counts the slots, words the server fates, and Confirm saves the pick', async () => {
    mock(account(), {
      preview: {
        preview: {
          fits: true,
          keptSlots: 4,
          slotsToFit: 5,
          searches: [
            { searchId: 'asm', slots: 3, fate: 'continues', fateAt: null },
            { searchId: 'hulk', slots: 1, fate: 'continues', fateAt: null },
            { searchId: 'wbn', slots: 2, fate: 'stops', fateAt: DUE },
          ],
        },
        failed: false,
        error: null,
        retry: vi.fn(),
      },
    })
    pick.mockResolvedValueOnce(account())
    render(<PickScreen />)
    fireEvent.click(keepButton('The Amazing Spider-Man #129'))
    fireEvent.click(keepButton('The Incredible Hulk #181'))
    expect(keepButton('The Amazing Spider-Man #129')).toHaveAttribute('aria-pressed', 'true')
    const tally = screen.getByRole('complementary', { name: 'Your choice' })
    expect(tally).toHaveTextContent('4 of 5 slots')
    expect(tally).toHaveTextContent('Fits, 1 to spare')
    expect(tally).toHaveTextContent('2 searches continue and 1 stops on Oct 28.')
    expect(screen.getByRole('article', { name: 'Werewolf by Night #32' })).toHaveTextContent(
      'This search will stop on Oct 28.'
    )
    fireEvent.click(within(tally).getByRole('button', { name: 'Confirm my choice' }))
    await waitFor(() => expect(pick).toHaveBeenCalledWith(['asm', 'hulk']))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'What happens on Oct 28' })
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Saved. Nothing changes until Oct 28.')
    expect(screen.getByRole('region', { name: 'Your choice is saved' })).toHaveTextContent(
      '2 searches continue and 1 stops.'
    )
    expect(screen.getByRole('region', { name: 'Keep running' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Stop on Oct 28' })).toBeInTheDocument()
  })

  it('too many: Confirm cannot be pressed, and the tally says how many', () => {
    mock(account())
    render(<PickScreen />)
    fireEvent.click(keepButton('The Amazing Spider-Man #129'))
    fireEvent.click(keepButton('Werewolf by Night #32'))
    fireEvent.click(keepButton('The Incredible Hulk #181'))
    const tally = screen.getByRole('complementary', { name: 'Your choice' })
    expect(tally).toHaveTextContent('1 too many')
    expect(within(tally).getByRole('button', { name: 'Confirm my choice' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('a pick refused because the plan changed says so, with the numbers, and keeps the choice', async () => {
    mock(account())
    pick.mockRejectedValueOnce(
      new APIError(409, 'PICK_DOES_NOT_FIT', 'x', undefined, { keptSlots: 4, slotsToFit: 3 })
    )
    render(<PickScreen />)
    fireEvent.click(keepButton('The Amazing Spider-Man #129'))
    fireEvent.click(keepButton('The Incredible Hulk #181'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm my choice' }))
    const notice = await screen.findByRole('alert', {
      name: 'Your plan changed while you were choosing',
    })
    expect(notice).toHaveTextContent(
      'Your plan now has 3 slots, not 5. Your choice uses 4, so it was not saved.'
    )
    expect(keepButton('The Amazing Spider-Man #129')).toHaveAttribute('aria-pressed', 'true')
  })

  it('coming back: running searches start kept; a search added since the page was read stops the pick', async () => {
    mock(
      account({
        plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
        slots: { entitled: 10, inUse: 4, free: 6, over: 0 },
        searches: [view('asm', 1, 3, 'continues'), view('hulk', 4, 1, 'continues')],
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
        change: {
          kind: 'pick_needed',
          reason: 'return',
          dueAt: null,
          overdue: false,
          slotsToFit: 10,
          pickedSearchIds: null,
        },
      }),
      { searches: [ASM, HULK, IF14] }
    )
    fetchQuery.mockResolvedValueOnce({
      searches: [ASM, HULK, IF14, search('new', 'Batman', '423', 9.8, 9.8)],
    })
    render(<PickScreen />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Choose what comes back' })
    ).toBeInTheDocument()
    expect(keepButton('The Amazing Spider-Man #129')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(keepButton('Iron Fist #14'))
    fireEvent.click(screen.getByRole('button', { name: 'Bring these back' }))
    expect(await screen.findByRole('alert', { name: 'Your list has changed' })).toHaveTextContent(
      'Batman #423 has been added since you opened this page, so your choice was not saved.'
    )
    expect(pick).not.toHaveBeenCalled()
  })

  it('nothing to choose', () => {
    mock(account({ change: null, slots: { entitled: 5, inUse: 4, free: 1, over: 0 } }))
    render(<PickScreen />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nothing to choose' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your searches fit your plan' })).toHaveTextContent(
      'Your plan has 5 slots and your searches use 4, so nothing will stop.'
    )
  })

  it('the first meeting thanks the tester and explains slots from their own searches', () => {
    mock(
      account({
        change: {
          kind: 'pick_needed',
          reason: 'first_plan',
          dueAt: DUE,
          overdue: false,
          slotsToFit: 5,
          pickedSearchIds: null,
        },
      })
    )
    render(<PickScreen />)
    expect(screen.getByText('Thank you for testing Grail Seeker')).toBeInTheDocument()
    expect(
      screen.getByText(
        /A slot is one book in one grade\. Your search for The Amazing Spider-Man #129 in 9\.0 to 9\.4 uses 3 slots/
      )
    ).toBeInTheDocument()
  })

  it('Narrow grades offers only the grades in the search, and saves at once', async () => {
    mock(account())
    render(<PickScreen />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Narrow the grades of The Amazing Spider-Man #129' })
    )
    const box = screen.getByRole('group', {
      name: 'Narrow the grades of The Amazing Spider-Man #129',
    })
    const from = within(box).getByRole('combobox', { name: 'From' }) as HTMLSelectElement
    expect(Array.from(from.options).map((o) => o.value)).toEqual(['9.0', '9.2', '9.4'])
    expect(box).toHaveTextContent('Choose a narrower range to use fewer slots.')
    fireEvent.change(from, { target: { value: '9.2' } })
    expect(box).toHaveTextContent('Uses 2 slots instead of 3.')
    fireEvent.click(within(box).getByRole('button', { name: 'Save grades' }))
    await waitFor(() =>
      expect(updateAsync).toHaveBeenCalledWith({
        id: 'asm',
        data: { gradeMin: 9.2, gradeMax: 9.4 },
      })
    )
    expect(await screen.findByText('Grades narrowed to 9.2 to 9.4. Saved.')).toBeInTheDocument()
  })

  it('a downgrade: back to the plan, and Confirm my choice', () => {
    mock(
      account({
        change: {
          kind: 'downgrade_pending',
          plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
          addonSlots: 0,
          slots: 5,
          effectiveAt: DUE,
          keepSearchIds: ['asm'],
        },
      })
    )
    render(<PickScreen />)
    expect(screen.getByRole('link', { name: 'Back to Plan' })).toHaveAttribute('href', '/plan')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Choose what to keep on Starter' })
    ).toBeInTheDocument()
    expect(keepButton('The Amazing Spider-Man #129')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Confirm my choice' })).toBeInTheDocument()
    expect(screen.queryByText(/Stay on/)).not.toBeInTheDocument()
  })

  it('a preview that failed: "Not checked yet", and Confirm still works', () => {
    mock(account(), { preview: { preview: null, failed: true, error: null, retry: vi.fn() } })
    render(<PickScreen />)
    fireEvent.click(keepButton('The Incredible Hulk #181'))
    expect(screen.getByRole('article', { name: 'The Incredible Hulk #181' })).toHaveTextContent(
      'Not checked yet'
    )
    expect(screen.getByText('We could not check this choice just now.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm my choice' })).not.toHaveAttribute(
      'aria-disabled'
    )
  })

  describe('code review', () => {
    it('a pick the database finds no longer needed shows "Nothing to choose", not "saved"', async () => {
      mock(account())
      pick.mockResolvedValueOnce(account({ change: null }))
      render(<PickScreen />)
      fireEvent.click(keepButton('The Amazing Spider-Man #129'))
      fireEvent.click(screen.getByRole('button', { name: 'Confirm my choice' }))
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Nothing to choose' })
      ).toBeInTheDocument()
    })

    it('after a stored pick, Change my choice goes back to choosing', async () => {
      mock(account())
      pick.mockResolvedValueOnce(account())
      render(<PickScreen />)
      fireEvent.click(keepButton('The Incredible Hulk #181'))
      fireEvent.click(screen.getByRole('button', { name: 'Confirm my choice' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Change my choice' }))
      expect(
        screen.getByRole('heading', { level: 1, name: 'Choose the searches to keep' })
      ).toBeInTheDocument()
      expect(keepButton('The Incredible Hulk #181')).toHaveAttribute('aria-pressed', 'true')
    })

    it('a pick that applied at once offers no Change my choice', async () => {
      mock(
        account({
          plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
          slots: { entitled: 10, inUse: 4, free: 6, over: 0 },
          searches: [view('asm', 1, 3, 'continues'), view('hulk', 4, 1, 'continues')],
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
          change: {
            kind: 'pick_needed',
            reason: 'return',
            dueAt: null,
            overdue: false,
            slotsToFit: 10,
            pickedSearchIds: null,
          },
        }),
        { searches: [ASM, HULK, IF14] }
      )
      pick.mockResolvedValueOnce(account({ change: null }))
      render(<PickScreen />)
      fireEvent.click(keepButton('Iron Fist #14'))
      fireEvent.click(screen.getByRole('button', { name: 'Bring these back' }))
      expect(
        await screen.findByRole('region', { name: 'Your choice is saved' })
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Change my choice' })).not.toBeInTheDocument()
    })

    it('a stored pick naming a search deleted since is trimmed to the searches on screen', () => {
      mock(
        account({
          change: {
            kind: 'pick_needed',
            reason: 'reduce',
            dueAt: DUE,
            overdue: false,
            slotsToFit: 5,
            pickedSearchIds: ['hulk', '00000000-0000-0000-0000-000000000000'],
          },
        })
      )
      render(<PickScreen />)
      const calls = vi.mocked(usePickPreview).mock.calls
      expect(calls.at(-1)?.[0]).toEqual(['hulk'])
    })

    it('a reduction re-reads the list too: a search added since stops the pick', async () => {
      mock(account())
      fetchQuery.mockResolvedValueOnce({
        searches: [ASM, HULK, WBN, search('new', 'Batman', '423', 9.8, 9.8)],
      })
      render(<PickScreen />)
      fireEvent.click(keepButton('The Incredible Hulk #181'))
      fireEvent.click(screen.getByRole('button', { name: 'Confirm my choice' }))
      expect(
        await screen.findByRole('alert', { name: 'Your list has changed' })
      ).toBeInTheDocument()
      expect(pick).not.toHaveBeenCalled()
    })
  })
})

import { describe, expect, it, vi } from 'vitest'

import { chooseBanner, daysLeft, listBanners, type BannerInput } from './attention'

import type { AccountSummary } from './api/account'

// Story 1.83 (U-05): the attention banner's states and words (attention-banner-states.html).
const NOW = new Date('2026-10-20T16:00:00Z')
const OCT27 = '2026-10-27T04:00:00Z' // start of Tuesday Oct 27, Eastern

function account(over: Partial<AccountSummary> = {}): AccountSummary {
  return {
    plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots: { entitled: 5, inUse: 4, free: 1, over: 0 },
    searches: [
      {
        searchId: 'a',
        slots: 3,
        firstSlot: 1,
        lastSlot: 3,
        isActive: true,
        fate: 'continues',
        fateAt: null,
      },
      {
        searchId: 'b',
        slots: 1,
        firstSlot: 4,
        lastSlot: 4,
        isActive: true,
        fate: 'continues',
        fateAt: null,
      },
    ],
    heldSearches: [],
    change: null,
    enforcement: 'enforce',
    ...over,
  }
}

const input = (over: Partial<BannerInput> = {}): BannerInput => ({
  account: account(),
  searches: [{ id: 'a', isActive: true, platforms: ['ebay', 'mycomicshop'], held: false }],
  defaultEnabledSlugs: ['ebay', 'mycomicshop'],
  nudgeDismissed: false,
  now: NOW,
  ...over,
})

const eight = account({
  slots: { entitled: 5, inUse: 8, free: 0, over: 3 },
  searches: [
    {
      searchId: 'a',
      slots: 3,
      firstSlot: 1,
      lastSlot: 3,
      isActive: true,
      fate: 'undecided',
      fateAt: OCT27,
    },
    {
      searchId: 'b',
      slots: 3,
      firstSlot: 4,
      lastSlot: 6,
      isActive: true,
      fate: 'undecided',
      fateAt: OCT27,
    },
    {
      searchId: 'c',
      slots: 2,
      firstSlot: 7,
      lastSlot: 8,
      isActive: true,
      fate: 'undecided',
      fateAt: OCT27,
    },
  ],
})

describe('chooseBanner', () => {
  it('nothing to say: no banner', () => {
    expect(chooseBanner(input())).toBeNull()
  })

  it('3. the date to choose has passed: hold tone, the designed words', () => {
    const b = chooseBanner(
      input({
        account: {
          ...eight,
          slots: { entitled: 5, inUse: 0, free: 5, over: 0 },
          searches: [],
          heldSearches: eight.searches.map((s) => ({
            searchId: s.searchId,
            slots: s.slots,
            heldReason: 'downgrade',
            isActive: true,
            fate: 'held',
            fateAt: null,
          })),
          change: {
            kind: 'pick_needed',
            reason: 'reduce',
            dueAt: OCT27,
            overdue: true,
            slotsToFit: 5,
            pickedSearchIds: null,
          },
        },
      })
    )!
    expect(b).toMatchObject({
      state: 3,
      tone: 'hold',
      heading: 'Your searches are on hold until you choose',
      dismissible: false,
    })
    expect(b.paragraphs).toEqual([
      'Your plan has 5 slots and your searches use 8. The date to choose was Oct 26, so every search is on hold. Choose the searches to keep and they start again.',
      'Nothing has been deleted.',
    ])
  })

  it('5. choose what to keep, with the date and the days left', () => {
    const b = chooseBanner(
      input({
        account: {
          ...eight,
          change: {
            kind: 'pick_needed',
            reason: 'reduce',
            dueAt: OCT27,
            overdue: false,
            slotsToFit: 5,
            pickedSearchIds: null,
          },
        },
      })
    )!
    expect(b).toMatchObject({
      state: 5,
      tone: 'attention',
      heading: 'Choose which searches to keep',
      due: '7 days left',
    })
    expect(b.paragraphs).toEqual([
      // The deadline is the start of Tuesday (Eastern): the last day to choose is Monday.
      'Your plan now has 5 slots and your searches use 8. Choose the searches to keep by Monday, Oct 26. Every search keeps running until then.',
      'If you have not chosen by then, every search goes on hold until you do.',
    ])
  })

  it('5. a first plan reads the same; a return opens with "Welcome back." and names no date', () => {
    const first = chooseBanner(
      input({
        account: {
          ...eight,
          change: {
            kind: 'pick_needed',
            reason: 'first_plan',
            dueAt: OCT27,
            overdue: false,
            slotsToFit: 5,
            pickedSearchIds: null,
          },
        },
      })
    )!
    expect(first.heading).toBe('Choose which searches to keep')
    const back = chooseBanner(
      input({
        account: {
          ...eight,
          change: {
            kind: 'pick_needed',
            reason: 'return',
            dueAt: null,
            overdue: false,
            slotsToFit: 5,
            pickedSearchIds: null,
          },
        },
      })
    )!
    expect(back).toMatchObject({ state: 5, heading: 'Welcome back.', due: null })
    expect(back.paragraphs).toEqual([
      'Your plan now has 5 slots and your searches use 8. Choose the searches to keep.',
    ])
  })

  it('6. chosen, date not reached: counts searches, not slots', () => {
    const picked = {
      ...eight,
      searches: eight.searches.map((s, i) => ({ ...s, fate: i === 0 ? 'continues' : 'stops' })),
      change: {
        kind: 'pick_needed' as const,
        reason: 'reduce' as const,
        dueAt: OCT27,
        overdue: false,
        slotsToFit: 5,
        pickedSearchIds: ['a'],
      },
    }
    const b = chooseBanner(input({ account: picked }))!
    expect(b).toMatchObject({
      state: 6,
      tone: 'info',
      heading: 'You have chosen what to keep',
      due: '7 days left',
    })
    // "On" names the day things change: the deadline's own day.
    expect(b.paragraphs[0]).toBe(
      'On Tuesday, Oct 27, 1 search continues and 2 stop. Every search runs until then, and you can change your choice before that date.'
    )
  })

  it('6 and 7 count a held search coming back on the day among those that continue', () => {
    const withReturn = {
      ...eight,
      searches: eight.searches.map((s, i) => ({ ...s, fate: i < 2 ? 'continues' : 'stops' })),
      heldSearches: [
        {
          searchId: 'h',
          slots: 1,
          heldReason: 'downgrade' as const,
          isActive: true,
          fate: 'returns',
          fateAt: '2026-11-01T04:00:00Z',
        },
      ],
      change: {
        kind: 'downgrade_pending' as const,
        plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
        addonSlots: 0,
        slots: 5,
        effectiveAt: '2026-11-01T04:00:00Z',
        keepSearchIds: ['a', 'b', 'h'],
      },
    }
    expect(chooseBanner(input({ account: withReturn }))!.paragraphs[0]).toMatch(
      /^On that date, 3 searches continue and 1 stops\./
    )
  })

  it('7. a downgrade on its way', () => {
    const b = chooseBanner(
      input({
        account: {
          ...eight,
          searches: eight.searches.map((s, i) => ({ ...s, fate: i < 2 ? 'continues' : 'stops' })),
          change: {
            kind: 'downgrade_pending',
            plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
            addonSlots: 0,
            slots: 5,
            effectiveAt: '2026-11-01T04:00:00Z',
            keepSearchIds: ['a', 'b'],
          },
        },
      })
    )!
    expect(b).toMatchObject({ state: 7, tone: 'info', heading: 'Your move to Starter is on Nov 1' })
    expect(b.paragraphs[0]).toBe(
      'On that date, 2 searches continue and 1 stops. Until then every search runs, but you cannot add or widen a search beyond 5 slots.'
    )
  })

  it('8. over the plan with nothing to choose (the agreed words)', () => {
    const b = chooseBanner(input({ account: eight }))!
    expect(b).toMatchObject({
      state: 8,
      tone: 'info',
      heading: 'Your searches use more slots than your plan',
      dismissible: false,
    })
    expect(b.paragraphs[0]).toBe(
      'Your plan has 5 slots and your searches use 8. Nothing has been stopped, but you cannot add or widen a search until you are back within 5.'
    )
  })

  it('9. a marketplace turned off: dismissible, and gone once dismissed', () => {
    const off = input({
      searches: [
        { id: 'a', isActive: true, platforms: ['ebay'], held: false },
        { id: 'b', isActive: true, platforms: ['ebay'], held: false },
      ],
    })
    expect(chooseBanner(off)).toMatchObject({
      state: 9,
      dismissible: true,
      paragraphs: [
        '2 of your searches have a marketplace turned off. You may be missing matches for your grails.',
      ],
    })
    expect(chooseBanner({ ...off, nudgeDismissed: true })).toBeNull()
  })

  it('at observe the limit is not enforced: no state 8, and state 7 leaves out "cannot add or widen"', () => {
    expect(chooseBanner(input({ account: { ...eight, enforcement: 'observe' } }))).toBeNull()
    const seven = chooseBanner(
      input({
        account: {
          ...eight,
          enforcement: 'observe',
          searches: eight.searches.map((s, i) => ({ ...s, fate: i < 2 ? 'continues' : 'stops' })),
          change: {
            kind: 'downgrade_pending',
            plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
            addonSlots: 0,
            slots: 5,
            effectiveAt: '2026-11-01T04:00:00Z',
            keepSearchIds: ['a', 'b'],
          },
        },
      })
    )!
    expect(seven.paragraphs[0]).toBe(
      'On that date, 2 searches continue and 1 stops. Until then every search runs.'
    )
  })

  it('the lowest-numbered state wins: over plan and a marketplace off shows 8', () => {
    expect(
      chooseBanner(
        input({
          account: eight,
          searches: [{ id: 'a', isActive: true, platforms: ['ebay'], held: false }],
        })
      )!.state
    ).toBe(8)
  })

  it('1, 2 and 4 need billing facts: never chosen without them, and worded as designed with them', () => {
    const lapsed = account({ status: 'lapsed' })
    expect(chooseBanner(input({ account: lapsed }))).toBeNull()
    expect(
      chooseBanner(
        input({
          account: lapsed,
          billing: { lapseCause: 'payment_failed', deleteSearchesAt: '2026-12-18T05:00:00Z' },
        })
      )!.paragraphs[0]
    ).toBe(
      'Your last payment did not go through. Update your payment details by Thursday, Dec 17 and every search starts again, just as you left it. After that, your searches are deleted.'
    )
    expect(
      chooseBanner(
        input({
          account: lapsed,
          billing: {
            lapseCause: 'ended',
            endedAt: '2026-10-12T16:00:00Z',
            deleteSearchesAt: '2026-12-11T05:00:00Z',
          },
        })
      )!.paragraphs[0]
    ).toBe(
      'Your subscription ended on Oct 12. Choose a plan by Thursday, Dec 10 and every search starts again, just as you left it. After that, your searches are deleted.'
    )
    const grace = chooseBanner(
      input({ account: account({ status: 'grace' }), billing: { graceEndsAt: OCT27 } })
    )!
    expect(grace).toMatchObject({
      state: 4,
      tone: 'attention',
      heading: 'Your last payment did not go through',
      due: '7 days left',
    })
  })

  it('every page a banner leads to is built: the pick screen (Story 1.86), the plan page (Story 1.85), and the nudge', () => {
    const pick = {
      ...eight,
      change: {
        kind: 'pick_needed' as const,
        reason: 'reduce' as const,
        dueAt: OCT27,
        overdue: false,
        slotsToFit: 5,
        pickedSearchIds: null,
      },
    }
    expect(chooseBanner(input({ account: pick }))!.action).toEqual({
      label: 'Choose searches',
      href: '/plan/choose',
      filled: true,
    })
    // Story 1.85: the plan page is built
    expect(chooseBanner(input({ account: eight }))!.action).toEqual({
      label: 'View plan',
      href: '/plan',
      filled: false,
    })
    expect(
      chooseBanner(
        input({ searches: [{ id: 'a', isActive: true, platforms: ['ebay'], held: false }] })
      )!.action
    ).toEqual({ label: 'Review searches', href: '#your-searches', filled: false })
  })

  it('buttons appear once their page is built', async () => {
    vi.resetModules()
    vi.doMock('@/lib/built-pages', () => ({
      BUILT_PAGES: { plan: true, pick: true },
      PAGE_HREF: { plan: '/plan', pick: '/plan/choose' },
    }))
    const { chooseBanner: withPages } = await import('./attention')
    expect(withPages(input({ account: eight }))!.action).toEqual({
      label: 'View plan',
      href: '/plan',
      filled: false,
    })
    vi.doUnmock('@/lib/built-pages')
  })
})

describe('listBanners (Story 1.85): every banner that applies, in order', () => {
  it('lists a pick and the marketplace nudge, with chooseBanner the first of them', () => {
    const i = input({
      account: {
        ...eight,
        change: {
          kind: 'pick_needed',
          reason: 'reduce',
          dueAt: OCT27,
          overdue: false,
          slotsToFit: 5,
          pickedSearchIds: null,
        },
      },
      searches: [{ id: 'a', isActive: true, platforms: ['ebay'], held: false }],
    })
    expect(listBanners(i).map((b) => b.state)).toEqual([5, 9])
    expect(chooseBanner(i)?.state).toBe(5)
  })

  it('is empty when nothing applies', () => {
    expect(listBanners(input())).toEqual([])
    expect(chooseBanner(input())).toBeNull()
  })

  it('never lists both forms of state 5', () => {
    const i = input({
      account: {
        ...eight,
        change: {
          kind: 'pick_needed',
          reason: 'return',
          dueAt: null,
          overdue: false,
          slotsToFit: 5,
          pickedSearchIds: null,
        },
      },
    })
    expect(listBanners(i).filter((b) => b.state === 5)).toHaveLength(1)
  })
})

describe('daysLeft', () => {
  it('whole days, never below 0', () => {
    expect(daysLeft(OCT27, NOW)).toBe('7 days left')
    expect(daysLeft('2026-10-21T04:00:00Z', NOW)).toBe('1 day left')
    expect(daysLeft('2026-10-01T04:00:00Z', NOW)).toBe('0 days left')
  })
})

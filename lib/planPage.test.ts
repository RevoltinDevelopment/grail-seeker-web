import { describe, it, expect } from 'vitest'

import type { GrailSearch } from '@/types/search.types'

import { heldBackLine, planFacts, planMeter, slotRows, slotsNote } from './planPage'

import type { AccountSummary, NumberedSearchView } from './api/account'

// The design's account (plan-page.js, "normal"): Collector, 10 slots; Hulk (1), ASM (3), X-Men (1,
// paused), Batman (1). Invented books, no real subscriber's data.
function search(
  id: string,
  title: string,
  issue: string,
  min: number,
  max: number,
  by: string | null,
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
    gradingAuthority: by,
    platforms: ['ebay'],
    isActive: true,
    notificationsEnabled: true,
    lastCheckedAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...extra,
  }
}
const SEARCHES = [
  search('hulk', 'The Incredible Hulk', '181', 9.8, 9.8, null),
  search('asm', 'The Amazing Spider-Man', '129', 9, 9.4, 'CGC'),
  search('xm', 'X-Men', '94', 9.2, 9.2, 'CBCS', {
    isActive: false,
    pausedAt: '2026-10-12T15:00:00Z',
  }),
  search('bat', 'Batman Adventures', '12', 9.8, 9.8, 'CGC'),
]
const view = (
  searchId: string,
  firstSlot: number,
  slots: number,
  isActive = true,
  fate = 'continues',
  fateAt: string | null = null
): NumberedSearchView => ({
  searchId,
  slots,
  firstSlot,
  lastSlot: firstSlot + slots - 1,
  isActive,
  fate,
  fateAt,
})
function account(over: Partial<AccountSummary> = {}): AccountSummary {
  return {
    plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots: { entitled: 10, inUse: 6, free: 4, over: 0 },
    searches: [view('hulk', 1, 1), view('asm', 2, 3), view('xm', 5, 1, false), view('bat', 6, 1)],
    heldSearches: [],
    change: null,
    enforcement: 'enforce',
    ...over,
  }
}
const OCT27 = '2026-10-27T04:00:00Z'
const NOV1 = '2026-11-01T04:00:00Z'

describe('planFacts (Story 1.85)', () => {
  it('the plan, its slots, texts, in use and free', () => {
    expect(planFacts(account(), SEARCHES)).toEqual({
      name: 'Collector',
      slots: '10',
      texts: 'Included',
      inUse: '6 of 10',
      free: '4',
      next: null,
    })
  })

  it('add-on slots are shown with the plan slots', () => {
    expect(planFacts(account({ addonSlots: 2 }), SEARCHES)?.slots).toBe('12 (10 + 2 add-on)')
  })

  it('a downgrade on its way: the count alone, and the move', () => {
    const f = planFacts(
      account({
        slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
        change: {
          kind: 'downgrade_pending',
          plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
          addonSlots: 0,
          slots: 5,
          effectiveAt: NOV1,
          keepSearchIds: ['hulk', 'asm'],
        },
      }),
      SEARCHES
    )
    expect(f?.inUse).toBe('6')
    expect(f?.next).toBe('Moving to Starter on Sunday, Nov 1, with 5 slots.')
  })

  it('lapsed: none in use, the plan slots free, and since when, without a cause billing has not given', () => {
    const held = SEARCHES.map((s) => ({
      ...s,
      held: true,
      heldReason: 'lapse' as const,
      heldAt: '2026-10-14T13:00:00Z',
    }))
    const f = planFacts(
      account({
        status: 'lapsed',
        slots: { entitled: 0, inUse: 0, free: 0, over: 0 },
        searches: [],
      }),
      held
    )
    expect(f).toMatchObject({
      inUse: 'None while on hold',
      free: '10',
      next: 'On hold since Oct 14.',
    })
  })

  it('no plan, no facts', () => {
    expect(planFacts(account({ plan: null }), SEARCHES)).toBeNull()
  })
})

describe('slotRows', () => {
  it('numbers each search in order, with its grade, grader and slots, then the free slots', () => {
    const rows = slotRows(account(), SEARCHES)
    expect(rows).toEqual([
      {
        kind: 'search',
        id: 'hulk',
        number: '1',
        numberLabel: 'Slot 1',
        title: 'The Incredible Hulk #181',
        meta: '9.8 · any grader · 1 slot',
        paused: null,
        fate: null,
        over: false,
      },
      {
        kind: 'search',
        id: 'asm',
        number: '2–4',
        numberLabel: 'Slots 2 to 4',
        title: 'The Amazing Spider-Man #129',
        meta: '9.0 to 9.4 · CGC · 3 slots',
        paused: null,
        fate: null,
        over: false,
      },
      {
        kind: 'search',
        id: 'xm',
        number: '5',
        numberLabel: 'Slot 5',
        title: 'X-Men #94',
        meta: '9.2 · CBCS · 1 slot',
        paused: 'Paused by you on Oct 12. It keeps its slot while paused.',
        fate: null,
        over: false,
      },
      {
        kind: 'search',
        id: 'bat',
        number: '6',
        numberLabel: 'Slot 6',
        title: 'Batman Adventures #12',
        meta: '9.8 · CGC · 1 slot',
        paused: null,
        fate: null,
        over: false,
      },
      {
        kind: 'free',
        number: '7–10',
        numberLabel: 'Slots 7 to 10',
        meta: '4 slots for new searches, or for wider grades',
      },
    ])
  })

  it('over with nothing to choose: a line where the plan ends, and the searches past it marked', () => {
    const a = account({
      plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
      slots: { entitled: 5, inUse: 7, free: 0, over: 2 },
      searches: [view('hulk', 1, 1), view('asm', 2, 3), view('xm', 5, 1, false), view('bat', 6, 2)],
    })
    const rows = slotRows(a, SEARCHES)
    expect(rows.map((r) => r.kind)).toEqual(['search', 'search', 'search', 'line', 'search'])
    expect(rows[3]).toEqual({ kind: 'line', text: 'Your plan has 5 slots' })
    expect(rows[4]).toMatchObject({ id: 'bat', over: true })
  })

  it('code review: the line comes before a search that crosses the plan limit', () => {
    const a = account({
      plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
      searches: [view('hulk', 1, 1), view('asm', 2, 3), view('bat', 5, 2)],
    })
    const rows = slotRows(a, SEARCHES)
    expect(rows.map((r) => r.kind)).toEqual(['search', 'search', 'line', 'search'])
    expect(rows[3]).toMatchObject({ id: 'bat', number: '5–6', over: true })
  })

  it('code review: the line is drawn even when the search past it is missing from the list', () => {
    const a = account({
      plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
      searches: [view('hulk', 1, 1), view('asm', 2, 3), view('gone', 5, 2)],
    })
    expect(slotRows(a, SEARCHES).map((r) => r.kind)).toEqual(['search', 'search', 'line'])
  })

  it('a pick with a choice: each search says what happens to it', () => {
    const a = account({
      plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
      searches: [
        view('hulk', 1, 1),
        view('asm', 2, 3, true, 'stops', OCT27),
        view('xm', 5, 1, false),
        view('bat', 6, 1),
      ],
      change: {
        kind: 'pick_needed',
        reason: 'reduce',
        dueAt: OCT27,
        overdue: false,
        slotsToFit: 5,
        pickedSearchIds: ['hulk', 'xm', 'bat'],
      },
    })
    const rows = slotRows(a, SEARCHES)
    expect(rows[0]).toMatchObject({ fate: { kind: 'continues', text: 'Continues.' } })
    expect(rows[1]).toMatchObject({
      fate: { kind: 'stops', text: 'Stops on Oct 27. It goes on hold, not deleted.' },
    })
  })

  it('a pick not yet made: each search runs until the date', () => {
    const a = account({
      searches: [view('hulk', 1, 1, true, 'undecided', OCT27)],
      change: {
        kind: 'pick_needed',
        reason: 'reduce',
        dueAt: OCT27,
        overdue: false,
        slotsToFit: 5,
        pickedSearchIds: null,
      },
    })
    expect(slotRows(a, SEARCHES)[0]).toMatchObject({
      fate: { kind: 'undecided', text: 'Runs until Oct 27. Keep it, or it stops then.' },
    })
  })

  it('a downgrade: the search that continues names the plan', () => {
    const a = account({
      searches: [view('hulk', 1, 1)],
      change: {
        kind: 'downgrade_pending',
        plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
        addonSlots: 0,
        slots: 5,
        effectiveAt: NOV1,
        keepSearchIds: ['hulk'],
      },
    })
    expect(slotRows(a, SEARCHES)[0]).toMatchObject({ fate: { text: 'Continues on Starter.' } })
  })
})

describe('planMeter', () => {
  it('one block per slot in order, the free ones after, and the legend', () => {
    const m = planMeter(account())
    expect(m.inside).toEqual([
      'in',
      'in',
      'in',
      'in',
      'paused',
      'in',
      'free',
      'free',
      'free',
      'free',
    ])
    expect(m.beyond).toBe(0)
    expect(m.legend.map((l) => l.text)).toEqual([
      'Running · 5',
      'Paused, keeps its slot · 1',
      'Free · 4',
    ])
    expect(m.label).toBe('5 slots running, 1 paused, 4 free. Your plan has 10.')
  })

  it('while a choice is made, what continues first, then what stops past the line', () => {
    const a = account({
      plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
      change: {
        kind: 'downgrade_pending',
        plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
        addonSlots: 0,
        slots: 5,
        effectiveAt: NOV1,
        keepSearchIds: ['hulk', 'bat'],
      },
    })
    const m = planMeter(a)
    expect(m.inside).toEqual(['in', 'in', 'free', 'free', 'free'])
    expect(m.beyond).toBe(4)
    expect(m.legend.map((l) => l.text)).toEqual([
      'Continues · 2',
      'Paused, keeps its slot · 1',
      'Free · 3',
      'Stop on Nov 1 · 4',
    ])
  })

  it('Story 1.86: a held search picked to return counts with what continues', () => {
    const a = account({
      plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
      heldSearches: [
        {
          searchId: 'h',
          slots: 1,
          heldReason: 'downgrade',
          isActive: true,
          fate: 'returns',
          fateAt: NOV1,
        },
      ],
      change: {
        kind: 'downgrade_pending',
        plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
        addonSlots: 0,
        slots: 5,
        effectiveAt: NOV1,
        keepSearchIds: ['hulk', 'bat', 'h'],
      },
    })
    const m = planMeter(a)
    expect(m.inside).toEqual(['in', 'in', 'in', 'free', 'free'])
    expect(m.legend[0].text).toBe('Continues · 3')
  })

  it('over with nothing to choose: past the plan is over', () => {
    const a = account({ slots: { entitled: 5, inUse: 6, free: 0, over: 1 } })
    const m = planMeter(a)
    expect(m.beyond).toBe(1)
    expect(m.legend.at(-1)?.text).toBe('Over your plan · 1')
  })
})

describe('slotsNote', () => {
  it('says how the slots are numbered', () => {
    expect(slotsNote(account())).toBe(
      'Numbered in the order you added your searches. A paused search keeps its slots.'
    )
    expect(slotsNote(account({ slots: { entitled: 5, inUse: 6, free: 0, over: 1 } }))).toBe(
      'Numbered in the order you added your searches. The numbers do not decide what stops: nothing stops unless you choose.'
    )
  })

  it('a downgrade describes the lower limit only while it is enforced', () => {
    const change = {
      kind: 'downgrade_pending' as const,
      plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
      addonSlots: 0,
      slots: 5,
      effectiveAt: NOV1,
      keepSearchIds: [],
    }
    expect(slotsNote(account({ change }))).toBe(
      'From the moment you confirmed, you can use 5 slots for adding or widening a search. What happens on Nov 1 is shown on each search.'
    )
    expect(slotsNote(account({ change, enforcement: 'observe' }))).toBe(
      'What happens on Nov 1 is shown on each search.'
    )
  })
})

describe('heldBackLine', () => {
  const held = (over: Partial<AccountSummary['heldSearches'][number]>) => ({
    searchId: 'h',
    slots: 1,
    heldReason: 'downgrade' as const,
    isActive: true,
    fate: 'held',
    fateAt: null,
    ...over,
  })

  it('a lapse comes back when the subscription is active again; a paused one, paused', () => {
    expect(heldBackLine(account(), held({ heldReason: 'lapse' }))).toBe(
      'Comes back, just as you left it, when your subscription is active again.'
    )
    expect(heldBackLine(account(), held({ heldReason: 'lapse', isActive: false }))).toBe(
      'Comes back paused, as you left it, when your subscription is active again.'
    )
  })

  it('a downgrade hold with room says how to bring it back now (ROADMAP 000ad)', () => {
    expect(heldBackLine(account(), held({}))).toBe(
      'There is room for it now: it needs 1 slot and you have 4 free. To bring it back now, delete it and create it again. Its alert history does not carry over.'
    )
  })

  it('a downgrade hold without room comes back with more slots', () => {
    expect(
      heldBackLine(
        account({ slots: { entitled: 5, inUse: 5, free: 0, over: 0 } }),
        held({ slots: 2 })
      )
    ).toBe(
      'It needs 2 slots and you have 0 free. It comes back if you move to a plan with more slots.'
    )
  })

  it('picked to return: comes back on the date', () => {
    expect(heldBackLine(account(), held({ fate: 'returns', fateAt: OCT27 }))).toBe(
      'Comes back on Oct 27.'
    )
  })
})

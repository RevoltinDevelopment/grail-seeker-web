import { describe, it, expect } from 'vitest'

import { formSlots, type FormSlotsInput } from './formSlots'

import type { AccountSummary } from './api/account'

// The 25 standard grades, as GET /api/grades gives them
const VALUES = [
  0.5, 1, 1.5, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.2, 9.4, 9.6, 9.8,
  9.9, 10,
]
const GRADES = VALUES.map((value) => ({ value, label: value.toFixed(1) }))

// The design's accounts (search-form.js): Collector, 10 slots, 6 in use; full; Starter over plan
function account(
  over: Partial<AccountSummary> = {},
  slots = { entitled: 10, inUse: 6, free: 4, over: 0 }
): AccountSummary {
  return {
    plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots,
    searches: [],
    heldSearches: [],
    change: null,
    enforcement: 'enforce',
    ...over,
  }
}
const FULL = { entitled: 10, inUse: 9, free: 1, over: 0 }
const OVER = { entitled: 5, inUse: 8, free: 0, over: 3 }

const input = (over: Partial<FormSlotsInput> = {}): FormSlotsInput => ({
  mode: 'new',
  grades: GRADES,
  account: account(),
  accountFailed: false,
  savedSlots: 0,
  savedRange: null,
  gradeMin: null,
  gradeMax: null,
  attempted: false,
  refusal: null,
  ...over,
})

describe('formSlots (Story 1.85): the badge and the hint, always facts', () => {
  it('mockup 1: untouched, the badge shows the free slots and the hint the cost of every grade', () => {
    const r = formSlots(input())
    expect(r.badge).toBe(4)
    expect(r.hint).toBe('A search in every grade would use 25 slots')
    expect(r.alert).toBeNull()
    expect(r.why).toBeUndefined()
  })

  it('mockup 2: a chosen range says only its cost, and the badge does not move', () => {
    const r = formSlots(input({ gradeMin: 9.6, gradeMax: 9.8 }))
    expect(r.hint).toBe('9.6 to 9.8 = 2 slots')
    expect(r.badge).toBe(4)
    expect(formSlots(input({ gradeMin: 9.8, gradeMax: 9.8 })).hint).toBe('9.8 = 1 slot')
    expect(formSlots(input({ gradeMin: 9.8 })).hint).toBe('9.8 to 10.0 = 3 slots')
    // The design's Vault account: 30 slots, 4 in use, so every grade fits
    expect(
      formSlots(
        input({
          account: account({}, { entitled: 30, inUse: 4, free: 26, over: 0 }),
          gradeMin: 0.5,
          gradeMax: 10,
        })
      ).hint
    ).toBe('Every grade = 25 slots')
  })

  it('mockup 3: on an edit, the badge counts the slots the search already uses', () => {
    const r = formSlots(
      input({
        mode: 'edit',
        savedSlots: 3,
        savedRange: { min: 9, max: 9.4 },
        gradeMin: 8.5,
        gradeMax: 9.4,
      })
    )
    expect(r.badge).toBe(7)
    expect(r.hint).toBe('8.5 to 9.4 = 4 slots')
  })

  it('shows facts at observe too, and nothing that describes the limit', () => {
    const r = formSlots(
      input({ account: account({ enforcement: 'observe' }), gradeMin: 9, gradeMax: 9.8 })
    )
    expect(r.badge).toBe(4)
    expect(r.hint).toBe('9.0 to 9.8 = 5 slots')
    expect(r.alert).toBeNull()
    expect(r.why).toBeUndefined()
    expect(r.shortNow).toBe(false)
  })

  it('an account with no plan sees the cost only', () => {
    const r = formSlots(
      input({
        account: account(
          { plan: null, status: 'none' },
          { entitled: 0, inUse: 0, free: 0, over: 0 }
        ),
        gradeMin: 9.6,
        gradeMax: 9.8,
      })
    )
    expect(r.badge).toBeNull()
    expect(r.hint).toBe('9.6 to 9.8 = 2 slots')
    expect(r.alert).toBeNull()
  })

  it('when the account could not be read, there is no badge and the hint says when free slots are checked', () => {
    const r = formSlots(input({ account: null, accountFailed: true, gradeMin: 9.6, gradeMax: 9.8 }))
    expect(r.badge).toBeNull()
    expect(r.hint).toBe('9.6 to 9.8 = 2 slots • your free slots are checked when you save')
  })

  it('without the grades, there is no hint', () => {
    expect(formSlots(input({ grades: null })).hint).toBeNull()
  })
})

describe('formSlots: the slots alert, at enforce', () => {
  it('mockup 4: both grades chosen and too many, the alert replaces the hint and Save waits', () => {
    const r = formSlots(input({ gradeMin: 9, gradeMax: 9.8 }))
    expect(r.hint).toBeNull()
    expect(r.alert).toEqual({
      equation: '9.0 to 9.8 = 5 slots',
      sentence:
        'You have 4 of your 10 slots free. Choose fewer grades, or delete a search you no longer need.',
      meter: {
        others: 6,
        thisIn: 4,
        free: 0,
        over: 1,
        label:
          '6 slots used by your other searches, 4 by this search, 1 more than your plan has. Your plan has 10.',
      },
      thisSlots: 5,
    })
    expect(r.why).toBe('Not enough free slots for this grade.')
    expect(r.notice).toBeNull()
  })

  it('waits while only the Minimum is chosen: a choice in progress', () => {
    const r = formSlots(input({ gradeMin: 1 }))
    expect(r.alert).toBeNull()
    expect(r.shortNow).toBe(true)
    expect(r.hint).toBe('1.0 to 10.0 = 24 slots')
  })

  it('mockup 6: Save on an untouched grade that does not fit shows the refusal and the alert', () => {
    const r = formSlots(input({ attempted: true }))
    expect(r.notice).toEqual({
      tone: 'info',
      role: 'alert',
      heading: 'Your search is not saved yet',
      paragraphs: [
        'This search needs 25 slots and you have 4 free. Choose fewer grades, or delete a search you no longer need.',
        'Everything you entered is still here.',
      ],
      actions: [{ label: 'Manage slots', href: '/plan', filled: false }],
    })
    expect(r.alert?.sentence).toBe(
      'You have 4 of your 10 slots free. Choose a Minimum and Maximum grade to save this search.'
    )
    expect(r.why).toBe('Every grade needs more slots than you have free.')
  })

  it('an edit that widens too far says what more it needs', () => {
    const r = formSlots(
      input({
        mode: 'edit',
        account: account({}, FULL),
        savedSlots: 3,
        savedRange: { min: 9, max: 9.4 },
        gradeMin: 8.5,
        gradeMax: 9.6,
      })
    )
    expect(r.alert?.sentence).toBe(
      'This change needs 2 more slots and you have 1 free. Choose fewer grades, or delete a search you no longer need.'
    )
    expect(r.alert?.meter).toMatchObject({ others: 6, thisIn: 4, free: 0, over: 1 })
  })

  it('a range that fits shows no alert', () => {
    expect(formSlots(input({ gradeMin: 9.6, gradeMax: 9.8 })).alert).toBeNull()
  })
})

describe('formSlots: the final cost (Mahan, 2026-11-05)', () => {
  it('is final only once both Minimum and Maximum are chosen', () => {
    expect(formSlots(input()).hintFinal).toBe(false)
    expect(formSlots(input({ gradeMin: 9.8 })).hintFinal).toBe(false)
    expect(formSlots(input({ gradeMax: 9.8 })).hintFinal).toBe(false)
    expect(formSlots(input({ gradeMin: 9.8, gradeMax: 9.9 })).hintFinal).toBe(true)
  })
})

describe('formSlots: code review', () => {
  it('every grade chosen on purpose is not told to choose a Minimum and Maximum', () => {
    const r = formSlots(input({ gradeMin: 0.5, gradeMax: 10 }))
    expect(r.alert?.sentence).toBe(
      'You have 4 of your 10 slots free. Choose fewer grades, or delete a search you no longer need.'
    )
    expect(r.why).toBe('Every grade needs more slots than you have free.')
  })

  it('a refusal keeps the form, even when the account read again is over plan', () => {
    const r = formSlots(
      input({
        account: account({}, { entitled: 5, inUse: 8, free: 0, over: 3 }),
        refusal: {
          kind: 'slot_limit',
          reason: 'over_plan',
          needed: 2,
          available: 0,
          inUse: 8,
          entitled: 5,
          message: 'Over.',
        },
      })
    )
    expect(r.blocked).toBe(false)
    expect(r.notice?.heading).toBe('Your search is not saved yet')
  })

  it('the meter never counts below zero when the account is staler than the search', () => {
    const r = formSlots(
      input({
        mode: 'edit',
        account: account({}, { entitled: 10, inUse: 2, free: 0, over: 0 }),
        savedSlots: 3,
        savedRange: { min: 9, max: 9.4 },
        gradeMin: 8.5,
        gradeMax: 9.4,
      })
    )
    expect(r.alert?.meter.others).toBe(0)
  })
})

describe('formSlots: refusals from the server', () => {
  it("shows the server's words for no_room, with Manage slots", () => {
    const message =
      'This change needs 2 more slots and you have 1 free. Choose fewer grades, or delete a search you no longer need.'
    const r = formSlots(
      input({
        mode: 'edit',
        refusal: {
          kind: 'slot_limit',
          reason: 'no_room',
          needed: 2,
          available: 1,
          inUse: 9,
          entitled: 10,
          message,
        },
      })
    )
    expect(r.notice?.heading).toBe('Your changes are not saved yet')
    expect(r.notice?.paragraphs[0]).toEqual(message)
    expect(r.notice?.actions).toEqual([{ label: 'Manage slots', href: '/plan', filled: false }])
  })

  it('on_hold is a hold notice with View plan', () => {
    const message =
      'Your searches are on hold because your subscription is not active. You can add or change searches when it is active again.'
    const r = formSlots(
      input({
        refusal: {
          kind: 'slot_limit',
          reason: 'on_hold',
          needed: 1,
          available: 0,
          inUse: 0,
          entitled: 0,
          message,
        },
      })
    )
    expect(r.notice).toMatchObject({
      tone: 'hold',
      heading: 'Your searches are on hold',
      actions: [{ label: 'View plan' }],
    })
  })

  it('no_plan offers no Manage slots', () => {
    const r = formSlots(
      input({
        refusal: {
          kind: 'slot_limit',
          reason: 'no_plan',
          needed: 1,
          available: 0,
          inUse: 0,
          entitled: 0,
          message: 'You need a plan before you can add a search.',
        },
      })
    )
    expect(r.notice?.actions).toEqual([])
  })
})

describe('formSlots: over plan and on hold', () => {
  it('mockup 5, edit: the badge is the search own slots, the grades can only narrow', () => {
    const r = formSlots(
      input({
        mode: 'edit',
        account: account({}, OVER),
        savedSlots: 3,
        savedRange: { min: 9, max: 9.4 },
        gradeMin: 9,
        gradeMax: 9.4,
      })
    )
    expect(r.badge).toBe(3)
    expect(r.narrowTo).toEqual({ min: 9, max: 9.4 })
    expect(r.notice?.heading).toBe('Your searches use more slots than your plan')
    expect(r.notice?.paragraphs).toEqual([
      'Your plan has 5 slots and your searches use 8. Nothing has been stopped, but you cannot add or widen a search until you are back within 5.',
      'You can still change anything on this search, and narrow its grade.',
    ])
    expect(r.alert).toBeNull()
  })

  it('mockup 5, new: no form, the notice with Back to Searches and Manage slots, and a badge of 0', () => {
    const r = formSlots(input({ account: account({}, OVER) }))
    expect(r.blocked).toBe(true)
    expect(r.badge).toBe(0)
    expect(r.notice?.actions.map((a) => a.label)).toEqual(['Back to Searches', 'Manage slots'])
  })

  it('over plan at observe is neither blocked nor narrowed', () => {
    const r = formSlots(
      input({
        mode: 'edit',
        account: account({ enforcement: 'observe' }, OVER),
        savedSlots: 3,
        savedRange: { min: 9, max: 9.4 },
      })
    )
    expect(r.narrowTo).toBeNull()
    expect(r.notice).toBeNull()
    expect(formSlots(input({ account: account({ enforcement: 'observe' }, OVER) })).blocked).toBe(
      false
    )
  })

  it('lapsed: no badge, no hint, and a new search cannot be saved, whatever the switch says', () => {
    const r = formSlots(
      input({
        account: account(
          { status: 'lapsed', enforcement: 'observe' },
          { entitled: 0, inUse: 0, free: 0, over: 0 }
        ),
      })
    )
    expect(r.badge).toBeNull()
    expect(r.hint).toBeNull()
    expect(r.why).toBe('Your searches are on hold, so a search cannot be added.')
  })
})

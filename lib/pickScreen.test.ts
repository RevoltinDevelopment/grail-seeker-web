import { describe, it, expect } from 'vitest'

import {
  fateWords,
  nextCheckText,
  pickDates,
  pickHead,
  pickKindOf,
  pickTally,
  splitSentence,
  type FateInput,
  type PickDates,
} from './pickScreen'

import type { AccountSummary } from './api/account'

// Today is Tuesday, Oct 20; the deadline is the start of Wednesday, Oct 28, Eastern (so the last day
// to choose is Tuesday, Oct 27), as the design's dates read.
const NOW = new Date('2026-10-20T16:00:00Z')
const DUE = '2026-10-28T04:00:00Z'

function account(over: Partial<AccountSummary> = {}): AccountSummary {
  return {
    plan: { code: 'starter', name: 'Starter', includedSlots: 5, textsIncluded: true },
    addonSlots: 0,
    status: 'active',
    slots: { entitled: 5, inUse: 8, free: 0, over: 3 },
    searches: [],
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
    nextRoundAt: '2026-10-20T23:00:00Z',
    ...over,
  }
}
const D: PickDates = pickDates(account(), NOW)

describe('pickKindOf (Story 1.86)', () => {
  it('names the four kinds of choice, and the first meeting', () => {
    expect(pickKindOf(account())).toEqual({ kind: 'reduce', first: false })
    expect(
      pickKindOf(
        account({
          change: {
            kind: 'pick_needed',
            reason: 'first_plan',
            dueAt: DUE,
            overdue: false,
            slotsToFit: 10,
            pickedSearchIds: null,
          },
        })
      )
    ).toEqual({
      kind: 'reduce',
      first: true,
    })
    expect(
      pickKindOf(
        account({
          change: {
            kind: 'pick_needed',
            reason: 'reduce',
            dueAt: DUE,
            overdue: true,
            slotsToFit: 5,
            pickedSearchIds: null,
          },
        })
      )?.kind
    ).toBe('overdue')
    expect(
      pickKindOf(
        account({
          change: {
            kind: 'pick_needed',
            reason: 'return',
            dueAt: null,
            overdue: false,
            slotsToFit: 10,
            pickedSearchIds: null,
          },
        })
      )?.kind
    ).toBe('return')
    expect(
      pickKindOf(
        account({
          change: {
            kind: 'downgrade_pending',
            plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
            addonSlots: 0,
            slots: 5,
            effectiveAt: DUE,
            keepSearchIds: [],
          },
        })
      )?.kind
    ).toBe('downgrade')
    expect(pickKindOf(account({ change: null }))).toBeNull()
  })
})

describe('pickDates and nextCheckText', () => {
  it('"by" names the last day to choose; "on" the day searches stop', () => {
    expect(D).toMatchObject({
      byLong: 'Tuesday, Oct 27',
      byShort: 'Oct 27',
      onShort: 'Oct 28',
      left: '8 days left',
    })
  })

  it('names the next check on Eastern time', () => {
    expect(nextCheckText('2026-10-20T23:00:00Z', NOW)).toBe('today at 7 PM Eastern')
    expect(nextCheckText('2026-10-21T13:00:00Z', NOW)).toBe('tomorrow at 9 AM Eastern')
    expect(nextCheckText('2026-10-23T13:00:00Z', NOW)).toBe('Friday at 9 AM Eastern')
  })
})

const fate = (over: Partial<FateInput>): FateInput => ({
  kind: 'reduce',
  held: false,
  paused: false,
  slots: 3,
  kept: false,
  started: true,
  confirmed: false,
  previewFailed: false,
  serverFate: null,
  ...over,
})

describe('fateWords: the design words, from the server fate', () => {
  it('a stored pick before anything is kept runs undecided', () => {
    expect(fateWords(fate({ started: false }), D)).toEqual({
      kind: 'undecided',
      text: 'Runs until Oct 28. Keep it, or it stops then.',
    })
  })

  it('continues or stops as the server says, paused as left', () => {
    expect(fateWords(fate({ serverFate: 'continues', paused: true }), D).text).toBe(
      'This search will continue, paused as you left it.'
    )
    expect(fateWords(fate({ serverFate: 'stops' }), D)).toEqual({
      kind: 'stops',
      text: 'This search will stop on Oct 28.',
    })
  })

  it('a held search stays held or comes back on the day', () => {
    expect(fateWords(fate({ held: true, serverFate: 'held', slots: 1 }), D).text).toBe(
      'Stays on hold. Bring it back to start it again on Oct 28. It needs 1 slot.'
    )
    expect(fateWords(fate({ held: true, serverFate: 'returns' }), D).text).toBe(
      'This search will come back on Oct 28.'
    )
  })

  it('overdue: starts again at the next check', () => {
    expect(fateWords(fate({ kind: 'overdue', held: true, serverFate: 'returns' }), D).text).toBe(
      'This search will start again at the next check, today at 7 PM Eastern.'
    )
  })

  it('coming back: a running search left out stops when you confirm', () => {
    expect(fateWords(fate({ kind: 'return', serverFate: 'held' }), D)).toEqual({
      kind: 'stops',
      text: 'This search will stop when you confirm.',
    })
  })

  it('a failed preview says so', () => {
    expect(fateWords(fate({ previewFailed: true }), D)).toEqual({
      kind: 'unknown',
      text: 'Not checked yet',
    })
  })
})

describe('splitSentence: counts searches, never slots', () => {
  it('opens with the count and names the date once', () => {
    expect(
      splitSentence('reduce', ['continues', 'continues', 'continues', 'stops', 'stops'], D)
    ).toBe('3 searches continue and 2 stop on Oct 28')
    expect(splitSentence('reduce', ['continues', 'stops'], D, false)).toBe(
      '1 search continues and 1 stops'
    )
  })

  it('coming back lists what comes back first and leaves held out of other kinds', () => {
    expect(splitSentence('return', ['continues', 'returns', 'held'], D)).toBe(
      '1 search comes back, 1 stays on hold and 1 continues'
    )
    expect(splitSentence('reduce', ['continues', 'held'], D)).toBe('1 search continues')
  })
})

describe('pickHead', () => {
  const base = {
    planName: 'Starter',
    cap: 5,
    inUse: 8,
    heldSlots: 1,
    free: 0,
    enforced: true,
    dates: D,
    running: [],
    currentPlan: 'Collector',
  }

  it('reduce: the lede and the four promises, the last a warning', () => {
    const h = pickHead({ ...base, kind: 'reduce', first: false })
    expect(h.lede).toEqual([
      'Your plan now has 5 slots and your searches use 8. Choose the searches to keep by Tuesday, Oct 27.',
    ])
    expect(h.promises.at(-1)).toEqual({
      text: 'If you have not chosen by then, every search goes on hold until you do.',
      warn: true,
    })
  })

  it('the first meeting is filled from the account', () => {
    const h = pickHead({
      ...base,
      kind: 'reduce',
      first: true,
      cap: 10,
      inUse: 32,
      running: [
        { title: 'Giant-Size X-Men #1', grades: 'every grade', slots: 25 },
        { title: 'The Amazing Spider-Man #300', grades: '9.6 to 9.8', slots: 2 },
      ],
    })
    expect(h.eyebrow).toBe('Thank you for testing Grail Seeker')
    expect(h.intro).toEqual([
      'Grail Seeker now has plans, and your account is on Starter, with 10 slots.',
      'A slot is one book in one grade. Your search for The Amazing Spider-Man #300 in 9.6 to 9.8 uses 2 slots, and your search for Giant-Size X-Men #1 in every grade uses 25.',
      'Your searches use 32 slots, so choose the ones to keep within 10, by Tuesday, Oct 27.',
    ])
  })

  it('downgrade: no "stay on", and the limit only at enforce (Decision #109)', () => {
    const at = pickHead({ ...base, kind: 'downgrade', first: false })
    expect(at.promises.map((p) => p.text)).toContain(
      'From the moment you confirm, you cannot add or widen a search beyond 5 slots.'
    )
    expect(at.promises.map((p) => p.text).join(' ')).not.toContain('stay on')
    const observe = pickHead({ ...base, kind: 'downgrade', first: false, enforced: false })
    expect(observe.promises.map((p) => p.text).join(' ')).not.toContain('cannot add or widen')
  })
})

describe('pickTally', () => {
  it('nothing chosen, too many, fits', () => {
    expect(
      pickTally({ kind: 'reduce', cap: 5, keptSlots: 0, anyKept: false, dates: D })
    ).toMatchObject({
      label: 'Choose by Oct 27 · 8 days left',
      status: 'Nothing chosen yet',
      canConfirm: false,
      note: 'Choose Keep on the searches you want to keep.',
    })
    expect(
      pickTally({ kind: 'reduce', cap: 5, keptSlots: 7, anyKept: true, dates: D })
    ).toMatchObject({ status: '2 too many', canConfirm: false, over: 2 })
    expect(
      pickTally({ kind: 'reduce', cap: 5, keptSlots: 4, anyKept: true, dates: D })
    ).toMatchObject({ status: 'Fits, 1 to spare', canConfirm: true })
    expect(
      pickTally({ kind: 'reduce', cap: 5, keptSlots: 5, anyKept: true, dates: D }).status
    ).toBe('Fits exactly')
  })

  it('the button for each kind', () => {
    expect(
      pickTally({ kind: 'overdue', cap: 5, keptSlots: 1, anyKept: true, dates: D }).button
    ).toBe('Start these searches')
    expect(
      pickTally({ kind: 'return', cap: 5, keptSlots: 1, anyKept: true, dates: D }).button
    ).toBe('Bring these back')
    expect(
      pickTally({ kind: 'downgrade', cap: 5, keptSlots: 1, anyKept: true, dates: D }).button
    ).toBe('Confirm my choice')
  })

  it('code review: the downgrade note names the plan', () => {
    expect(
      pickTally({
        kind: 'downgrade',
        cap: 5,
        keptSlots: 1,
        anyKept: true,
        dates: D,
        planName: 'Starter',
      }).note
    ).toBe('Your move to Starter happens on Oct 28. Every search runs until then.')
  })
})

describe('code review', () => {
  it('a downgrade can be changed until the day before a midnight move', () => {
    const d = pickDates(
      account({
        change: {
          kind: 'downgrade_pending',
          plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
          addonSlots: 0,
          slots: 5,
          effectiveAt: DUE,
          keepSearchIds: [],
        },
      }),
      NOW
    )
    expect(d).toMatchObject({ byShort: 'Oct 27', onShort: 'Oct 28', onLong: 'Wednesday, Oct 28' })
  })

  it('overdue: a search made after the hold is worded as running', () => {
    expect(fateWords(fate({ kind: 'overdue', held: false, serverFate: 'continues' }), D).text).toBe(
      'This search will continue.'
    )
    expect(fateWords(fate({ kind: 'overdue', held: false, serverFate: 'held' }), D).text).toBe(
      'This search will stop when you confirm.'
    )
  })
})

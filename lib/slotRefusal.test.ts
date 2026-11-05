import { describe, it, expect } from 'vitest'

import { APIError } from './api/client'
import { readRefusal } from './slotRefusal'

describe('readRefusal (Story 1.85, need 21)', () => {
  it("keeps a slot refusal's reason and numbers, with the server's words", () => {
    const e = new APIError(
      409,
      'SLOT_LIMIT_EXCEEDED',
      'This search needs 2 slots and you have 1 free.',
      undefined,
      {
        code: 'SLOT_LIMIT_EXCEEDED',
        reason: 'no_room',
        needed: 2,
        available: 1,
        inUse: 9,
        entitled: 10,
      }
    )
    expect(readRefusal(e)).toEqual({
      kind: 'slot_limit',
      reason: 'no_room',
      needed: 2,
      available: 1,
      inUse: 9,
      entitled: 10,
      message: 'This search needs 2 slots and you have 1 free.',
    })
  })

  it('is still a slot refusal when the server could not give the numbers', () => {
    const e = new APIError(
      409,
      'SLOT_LIMIT_EXCEEDED',
      'This search needs more slots than your plan has free.',
      undefined,
      {}
    )
    expect(readRefusal(e)).toMatchObject({ kind: 'slot_limit', reason: null, needed: null })
  })

  it('reads a held refusal and its reason', () => {
    const e = new APIError(409, 'SEARCH_HELD', 'This search is on hold.', undefined, {
      heldReason: 'downgrade',
    })
    expect(readRefusal(e)).toEqual({
      kind: 'held',
      heldReason: 'downgrade',
      message: 'This search is on hold.',
    })
  })

  it('is null for anything else', () => {
    expect(readRefusal(new APIError(400, 'VALIDATION_ERROR', 'Bad'))).toBeNull()
    expect(readRefusal(new Error('x'))).toBeNull()
  })
})

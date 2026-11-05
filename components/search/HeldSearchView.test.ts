import { describe, it, expect } from 'vitest'

import { heldNotice } from './HeldSearchView'

describe('heldNotice (Story 1.85)', () => {
  it('after SEARCH_HELD only the heading changes', () => {
    const before = heldNotice('lapse', false)
    const after = heldNotice('lapse', true)
    expect(after.heading).toBe('Your changes were not saved')
    expect(after.role).toBe('alert')
    expect(after.paragraphs).toEqual(before.paragraphs)
    expect(heldNotice('downgrade', true).paragraphs).toEqual(
      heldNotice('downgrade', false).paragraphs
    )
  })

  it('a hold with no reason given says only what is known', () => {
    expect(heldNotice(null, false).paragraphs).toEqual([
      'It cannot be changed while it is on hold. It can be viewed or deleted.',
    ])
  })
})

import { describe, expect, it } from 'vitest'

import { GRADING_AUTHORITY_OPTIONS } from './SearchFormLayout'

describe('Graded by choices (Story 1.101)', () => {
  it('offers PSA, and not EGS (Mahan, 2026-11-17)', () => {
    expect(GRADING_AUTHORITY_OPTIONS).toEqual(['Any', 'CGC', 'CBCS', 'PSA', 'PGX'])
    expect(GRADING_AUTHORITY_OPTIONS).not.toContain('EGS')
  })
})

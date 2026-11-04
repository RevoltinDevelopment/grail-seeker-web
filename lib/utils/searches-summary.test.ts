import { describe, expect, it } from 'vitest'

import { searchesSummary } from './searches-summary'

// Story 1.82: the line under the Searches title (UX plan section 10)
describe('searchesSummary', () => {
  const s = (isActive: boolean, held = false) => ({ isActive, held })
  it('counts running, paused and on hold, leaving out parts with none', () => {
    expect(searchesSummary([s(true), s(true), s(true), s(true), s(false), s(false, true)])).toBe('6 searches: 4 running, 1 paused, 1 on hold')
    expect(searchesSummary([s(true), s(true)])).toBe('2 searches: 2 running')
    expect(searchesSummary([s(true)])).toBe('1 search: 1 running')
  })
  it('a held search is on hold whatever its own pause says', () => {
    expect(searchesSummary([s(false, true), s(true, true)])).toBe('2 searches: 2 on hold')
  })
  it('says so when there are none', () => {
    expect(searchesSummary([])).toBe('No searches yet')
  })
})

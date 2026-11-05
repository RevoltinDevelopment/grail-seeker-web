import { describe, it, expect } from 'vitest'

import { rangeLabel, slotsForRange, slotsWord } from './slots'

// The 25 standard grades, as GET /api/grades gives them (labels are not used here)
const VALUES = [
  0.5, 1, 1.5, 1.8, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.2, 9.4, 9.6, 9.8,
  9.9, 10,
]
const GRADES = VALUES.map((value) => ({ value, label: `${value.toFixed(1)} - x` }))

describe('slotsForRange (Story 1.85): the server rule, from the server list', () => {
  it('counts the examples the backend documents', () => {
    expect(slotsForRange(GRADES, 9.8, 9.8)).toBe(1)
    expect(slotsForRange(GRADES, 9, 9.4)).toBe(3)
    expect(slotsForRange(GRADES, 9.4, null)).toBe(5)
    expect(slotsForRange(GRADES, null, null)).toBe(25)
  })

  it('fills a side left at Any with the lowest or highest grade', () => {
    expect(slotsForRange(GRADES, 9.8, null)).toBe(3)
    expect(slotsForRange(GRADES, null, 1)).toBe(2)
  })

  it('never answers fewer than one, even for a range that holds no standard grade', () => {
    expect(slotsForRange(GRADES, 8.6, 8.9)).toBe(1)
  })

  it('counts whatever list the server sends', () => {
    expect(slotsForRange(GRADES.slice(0, 3), null, null)).toBe(3)
  })
})

describe('rangeLabel', () => {
  it('says the range in numbers', () => {
    expect(rangeLabel(GRADES, 9.6, 9.8)).toBe('9.6 to 9.8')
    expect(rangeLabel(GRADES, 9.8, 9.8)).toBe('9.8')
    expect(rangeLabel(GRADES, 9.8, null)).toBe('9.8 to 10.0')
    expect(rangeLabel(GRADES, null, 9)).toBe('0.5 to 9.0')
    expect(rangeLabel(GRADES, null, null)).toBe('Every grade')
    expect(rangeLabel(GRADES, 0.5, 10)).toBe('Every grade')
  })
})

describe('slotsWord', () => {
  it('says slot or slots', () => {
    expect(slotsWord(1)).toBe('1 slot')
    expect(slotsWord(0)).toBe('0 slots')
    expect(slotsWord(3)).toBe('3 slots')
  })
})

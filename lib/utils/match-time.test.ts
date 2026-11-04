import { describe, expect, it } from 'vitest'

import { matchTime } from './match-time'

// Story 1.82: Latest matches' time words
describe('matchTime', () => {
  const now = new Date(2026, 10, 4, 15, 0) // Nov 4, 2026, 3 PM local
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000)
  it('just now, minutes, hours today', () => {
    expect(matchTime(ago(0), now)).toBe('just now')
    expect(matchTime(ago(1), now)).toBe('1 minute ago')
    expect(matchTime(ago(45), now)).toBe('45 minutes ago')
    expect(matchTime(ago(120), now)).toBe('2 hours ago')
  })
  it('yesterday is the calendar day before, also on the day the clocks change', () => {
    // US clocks fell back on Sunday Nov 1, 2026 (in the zone the tests run in, if it has DST).
    const monday = new Date(2026, 10, 2, 9, 0)
    expect(matchTime(new Date(2026, 10, 1, 0, 30), monday)).toBe('yesterday')
  })

  it('yesterday, then the date, with the year only when not this year', () => {
    expect(matchTime(new Date(2026, 10, 3, 22, 0), now)).toBe('yesterday')
    expect(matchTime(new Date(2026, 9, 12, 9, 0), now)).toBe('Oct 12')
    expect(matchTime(new Date(2025, 11, 30, 9, 0), now)).toBe('Dec 30, 2025')
  })
})

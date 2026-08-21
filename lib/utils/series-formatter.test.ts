import { describe, it, expect } from 'vitest'
import type { ComicSeries } from '@/types/search.types'
import { volumeToOrdinal, formatYearRange, formatSeriesDisplay, formatSeriesShort, formatIssueNumber } from './series-formatter'

function makeSeries(overrides: Partial<ComicSeries> = {}): ComicSeries {
  return {
    id: 's1',
    title: 'X-Men',
    volume: 2,
    yearRange: '1991-2012',
    type: 'series',
    publisher: 'Marvel',
    ...overrides,
  }
}

describe('volumeToOrdinal', () => {
  it('returns empty string for null/undefined/zero', () => {
    expect(volumeToOrdinal(null)).toBe('')
    expect(volumeToOrdinal(undefined)).toBe('')
    expect(volumeToOrdinal(0)).toBe('')
  })

  it('formats standard ordinals', () => {
    expect(volumeToOrdinal(1)).toBe('1st Series')
    expect(volumeToOrdinal(2)).toBe('2nd Series')
    expect(volumeToOrdinal(3)).toBe('3rd Series')
    expect(volumeToOrdinal(4)).toBe('4th Series')
  })

  it('handles the 11th/12th/13th special case', () => {
    expect(volumeToOrdinal(11)).toBe('11th Series')
    expect(volumeToOrdinal(12)).toBe('12th Series')
    expect(volumeToOrdinal(13)).toBe('13th Series')
    expect(volumeToOrdinal(21)).toBe('21st Series')
  })
})

describe('formatYearRange', () => {
  it('passes the string through unchanged', () => {
    expect(formatYearRange('1963-1998')).toBe('1963-1998')
    expect(formatYearRange('1990')).toBe('1990')
  })
})

describe('formatSeriesDisplay', () => {
  it('includes volume ordinal and publisher by default', () => {
    expect(formatSeriesDisplay(makeSeries())).toBe('X-Men (2nd Series, 1991-2012) - Marvel')
  })

  it('omits publisher when includePublisher is false', () => {
    expect(formatSeriesDisplay(makeSeries(), { includePublisher: false })).toBe('X-Men (2nd Series, 1991-2012)')
  })

  it('omits the volume ordinal when volume is falsy', () => {
    expect(formatSeriesDisplay(makeSeries({ volume: 0, yearRange: '1990' }), { includePublisher: false })).toBe(
      'X-Men (1990)'
    )
  })

  // Story 1.18 (code review / hardening finding): `type` used to carry a
  // genuine sub-format label ("Annual", "Giant-Size") that this function
  // could append to the title. The backend never actually sent those --
  // it now sends 'series' | 'aliasGroup' through the same field (Story
  // 1.17). Confirms the removed `includeType` option can never leak either
  // discriminator value into the displayed title, for both possible values.
  it('never appends the type discriminator to the title, for either "series" or "aliasGroup"', () => {
    expect(formatSeriesDisplay(makeSeries({ type: 'series' }), { includePublisher: false })).toBe(
      'X-Men (2nd Series, 1991-2012)'
    )
    expect(formatSeriesDisplay(makeSeries({ type: 'aliasGroup' }), { includePublisher: false })).toBe(
      'X-Men (2nd Series, 1991-2012)'
    )
  })
})

describe('formatSeriesShort', () => {
  it('formats with a volume ordinal', () => {
    expect(formatSeriesShort({ volume: 1, yearRange: '1963-1998' })).toBe('1st Series (1963-1998)')
  })

  it('formats without a volume ordinal when volume is falsy', () => {
    expect(formatSeriesShort({ volume: 0, yearRange: '1990' })).toBe('(1990)')
  })
})

describe('formatIssueNumber', () => {
  // Bug found live (2026-08-21, Blue Bolt Vol. 8 #7): search cards showed
  // "Blue Bolt #7" -- the same class of omission as IssueSelector's own
  // resolved-chip bug, just one hop further downstream. issueVolumeText is
  // the per-issue GCD volume label (only ever set when
  // displayVolumeWithNumber was true at pick time), never series.volume.
  it('prefixes the volume label when present', () => {
    expect(formatIssueNumber('7', '8')).toBe('Vol. 8 #7')
  })

  it('omits the prefix when issueVolumeText is null', () => {
    expect(formatIssueNumber('7', null)).toBe('#7')
  })
})

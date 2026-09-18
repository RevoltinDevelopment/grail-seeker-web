import { describe, it, expect } from 'vitest'
import {
  sortMarketplaceEntries,
  totalSearchesRun,
  hasAnyMarketplaceActivity,
  resolveMarketplaceNames,
  KNOWN_MARKETPLACE_DISPLAY_ORDER,
} from './marketplaceDisplayOrder'

describe('sortMarketplaceEntries', () => {
  it('orders known marketplaces in canonical order regardless of input order', () => {
    const result = sortMarketplaceEntries({ MyComicShop: 5, eBay: 12, Heritage: 3 })
    expect(result).toEqual([
      ['eBay', 12],
      ['Heritage', 3],
      ['MyComicShop', 5],
    ])
  })

  it('renders an unrecognized marketplace after all known ones, alphabetically, never dropped', () => {
    const result = sortMarketplaceEntries({ ComicLink: 7, eBay: 12, Heritage: 3, MyComicShop: 5 })
    expect(result).toEqual([
      ['eBay', 12],
      ['Heritage', 3],
      ['MyComicShop', 5],
      ['ComicLink', 7],
    ])
  })

  it('sorts multiple unrecognized marketplaces alphabetically among themselves', () => {
    const result = sortMarketplaceEntries({ Zzyzx: 1, ComicLink: 7, eBay: 12 })
    expect(result).toEqual([
      ['eBay', 12],
      ['ComicLink', 7],
      ['Zzyzx', 1],
    ])
  })

  it('handles an empty record', () => {
    expect(sortMarketplaceEntries({})).toEqual([])
  })

  it('handles only unrecognized marketplaces (no known ones present)', () => {
    const result = sortMarketplaceEntries({ ComicLink: 2, Bazaar: 1 })
    expect(result).toEqual([
      ['Bazaar', 1],
      ['ComicLink', 2],
    ])
  })
})

describe('totalSearchesRun', () => {
  it('sums every marketplace present', () => {
    expect(totalSearchesRun({ eBay: 12, Heritage: 3, MyComicShop: 5 })).toBe(20)
  })

  it('returns 0 for an empty record', () => {
    expect(totalSearchesRun({})).toBe(0)
  })

  it('includes unrecognized marketplace names in the sum', () => {
    expect(totalSearchesRun({ eBay: 12, ComicLink: 7 })).toBe(19)
  })
})

describe('hasAnyMarketplaceActivity', () => {
  it('is true when at least one marketplace has a nonzero count', () => {
    expect(hasAnyMarketplaceActivity({ eBay: 0, Heritage: 3 })).toBe(true)
  })

  it('is false when every marketplace is zero', () => {
    expect(hasAnyMarketplaceActivity({ eBay: 0, Heritage: 0 })).toBe(false)
  })

  it('is false for an empty record', () => {
    expect(hasAnyMarketplaceActivity({})).toBe(false)
  })
})

describe('defensive undefined/null handling (code review LOW-4)', () => {
  it('sortMarketplaceEntries treats undefined/null as an empty record rather than throwing', () => {
    expect(sortMarketplaceEntries(undefined)).toEqual([])
    expect(sortMarketplaceEntries(null)).toEqual([])
  })

  it('totalSearchesRun treats undefined/null as 0 rather than throwing', () => {
    expect(totalSearchesRun(undefined)).toBe(0)
    expect(totalSearchesRun(null)).toBe(0)
  })

  it('hasAnyMarketplaceActivity treats undefined/null as false rather than throwing', () => {
    expect(hasAnyMarketplaceActivity(undefined)).toBe(false)
    expect(hasAnyMarketplaceActivity(null)).toBe(false)
  })
})

describe('KNOWN_MARKETPLACE_DISPLAY_ORDER', () => {
  it('is exactly eBay, Heritage, MyComicShop, in that order', () => {
    expect(KNOWN_MARKETPLACE_DISPLAY_ORDER).toEqual(['eBay', 'Heritage', 'MyComicShop'])
  })
})

// Story 1.49 (code review fix): extracted from ReportsClient.tsx and
// WeekReportClient.tsx, which each defined an identical copy -- now has one
// real, shared, dedicated unit test suite instead of two.
describe('resolveMarketplaceNames', () => {
  it('leaves the three known capitalized names untouched, never calling displayNameFor for them', () => {
    const displayNameFor = () => 'SHOULD NOT BE CALLED'
    const result = resolveMarketplaceNames({ eBay: 12, Heritage: 3, MyComicShop: 5 }, displayNameFor)
    expect(result).toEqual({ eBay: 12, Heritage: 3, MyComicShop: 5 })
  })

  it('resolves a raw registry slug to its real display name', () => {
    const displayNameFor = (slug: string) => (slug === 'indie:bryscomics' ? "Bry's Comics" : slug)
    const result = resolveMarketplaceNames({ eBay: 12, 'indie:bryscomics': 4 }, displayNameFor)
    expect(result).toEqual({ eBay: 12, "Bry's Comics": 4 })
  })

  it('falls back to the raw slug when displayNameFor has no match, never dropping the count', () => {
    const displayNameFor = (slug: string) => slug
    const result = resolveMarketplaceNames({ 'indie:somefutureshop': 2 }, displayNameFor)
    expect(result).toEqual({ 'indie:somefutureshop': 2 })
  })

  it('merges counts when two source keys resolve to the same display name, never silently drops one', () => {
    const displayNameFor = () => 'Same Name'
    const result = resolveMarketplaceNames({ 'indie:a': 3, 'indie:b': 4 }, displayNameFor)
    expect(result).toEqual({ 'Same Name': 7 })
  })

  it('defaults to an empty object for undefined/null input, matching this module\'s other functions', () => {
    expect(resolveMarketplaceNames(undefined, (s) => s)).toEqual({})
    expect(resolveMarketplaceNames(null, (s) => s)).toEqual({})
  })
})

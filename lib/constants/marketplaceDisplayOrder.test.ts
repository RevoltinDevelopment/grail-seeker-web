import { describe, it, expect } from 'vitest'
import { sortMarketplaceEntries, totalSearchesRun, KNOWN_MARKETPLACE_DISPLAY_ORDER } from './marketplaceDisplayOrder'

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

describe('KNOWN_MARKETPLACE_DISPLAY_ORDER', () => {
  it('is exactly eBay, Heritage, MyComicShop, in that order', () => {
    expect(KNOWN_MARKETPLACE_DISPLAY_ORDER).toEqual(['eBay', 'Heritage', 'MyComicShop'])
  })
})

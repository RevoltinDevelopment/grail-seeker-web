import { describe, it, expect } from 'vitest'
import { CORE_MARKETPLACES, marketplaceLabel } from './marketplaceNames'

describe('marketplace names (Story 1.84)', () => {
  it('names Heritage as Heritage Auctions', () => {
    expect(marketplaceLabel('heritage', 'Heritage')).toBe('Heritage Auctions')
  })

  it('keeps the registry\'s name for anything that is not a core marketplace', () => {
    expect(marketplaceLabel('indie:example', 'Example Comics')).toBe('Example Comics')
  })

  it('lists the core marketplaces in display order', () => {
    expect(CORE_MARKETPLACES.map((m) => m.label)).toEqual(['eBay', 'Heritage Auctions', 'MyComicShop'])
  })
})

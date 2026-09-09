/**
 * Canonical display order for searchesRunByMarketplace entries (Story 1.43's
 * backend field) -- known marketplaces first in this order, any unrecognized
 * name after, alphabetically, never dropped. Keyed by the backend's exact
 * provider.name values (capitalized) -- NOT the same key-space as
 * lib/constants/platforms.ts's lowercase search-config platform keys (Story
 * 1.44 Verified #4): that module drives PlatformSelector/alert-filter UI,
 * this one drives Weekly Reports display order. Deliberately separate.
 */
export const KNOWN_MARKETPLACE_DISPLAY_ORDER = ['eBay', 'Heritage', 'MyComicShop'] as const
export type MarketplaceName = (typeof KNOWN_MARKETPLACE_DISPLAY_ORDER)[number]

/** Sorts a searchesRunByMarketplace record into [name, count] pairs for stable, sensible rendering. */
export function sortMarketplaceEntries(counts: Record<string, number>): [string, number][] {
  return Object.entries(counts).sort(([a], [b]) => {
    const ai = KNOWN_MARKETPLACE_DISPLAY_ORDER.indexOf(a as MarketplaceName)
    const bi = KNOWN_MARKETPLACE_DISPLAY_ORDER.indexOf(b as MarketplaceName)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })
}

/**
 * Sums every marketplace's count. For currentWeek/allTime WeekReport objects,
 * which carry no precomputed total of their own -- unlike pastWeeks rows,
 * which already have totalSearchesRun from the backend (Story 1.44 Verified #2).
 */
export function totalSearchesRun(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0)
}

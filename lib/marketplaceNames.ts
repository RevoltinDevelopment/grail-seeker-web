/**
 * Story 1.84: the names the subscriber reads for the core marketplaces, in their display order.
 *
 * The registry's own display name for Heritage is "Heritage" (used by the alert filters, the reports
 * and the backend); the designs, the sign-up flow and the search card say "Heritage Auctions". The
 * search card (Story 1.83) and the search form's Search Platforms read this list, so the two agree.
 */
export const CORE_MARKETPLACES: readonly { slug: string; label: string }[] = [
  { slug: 'ebay', label: 'eBay' },
  { slug: 'heritage', label: 'Heritage Auctions' },
  { slug: 'mycomicshop', label: 'MyComicShop' },
]

/**
 * Below this many independent shops, each one is named on its own: on the search card ("Comic Book
 * Addiction", Story 1.83) and in the search form's Search Platforms (Story 1.84). From this many, one
 * chip counts them on the card and one "Independent Shops" group gathers them on the form. Mahan,
 * 2026-11-04 and 2026-11-05: a name tells a subscriber more than a count, and launch will likely have
 * fewer than five.
 */
export const NAME_SHOPS_BELOW = 5

/** The subscriber-facing name for a marketplace: ours for a core one, otherwise the registry's. */
export function marketplaceLabel(slug: string, registryName: string): string {
  return CORE_MARKETPLACES.find((m) => m.slug === slug)?.label ?? registryName
}

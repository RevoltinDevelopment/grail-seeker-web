/**
 * Single source of truth for which marketplace platforms are live vs.
 * "coming soon" in the UI. PlatformSelector.tsx and PlatformNudgeBanner.tsx
 * previously each held their own separate copy of this list (Story 1.35
 * Verified #2) -- keeping them here in lockstep prevents the nudge banner's
 * logic from silently drifting from what the selector actually offers.
 */
export const PLATFORM_LABELS: Record<string, string> = {
  ebay: 'eBay',
  heritage: 'Heritage',
  mycomicshop: 'MyComicShop',
}

export const ACTIVE_PLATFORMS = ['ebay', 'heritage', 'mycomicshop']

/**
 * The alerts-list platform filter's own type -- kept separate from
 * ACTIVE_PLATFORMS above because it needs 'all' (a filter-only
 * pseudo-value) that ACTIVE_PLATFORMS itself has no use for.
 * Previously hand-copied into 4 separate files (AlertFilters.tsx,
 * AlertsClient.tsx, ArchiveClient.tsx, lib/api/alerts.ts) -- exactly the
 * drift risk this module exists to prevent, found on adversarial review.
 * ('comiclink', a dead literal for a platform that was never actually
 * built or selectable anywhere in the app, removed per Mahan -- 2026-08-29.)
 */
export type AlertPlatformFilter = 'all' | 'ebay' | 'heritage' | 'mycomicshop'

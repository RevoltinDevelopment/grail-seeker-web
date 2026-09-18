/**
 * Story 1.49: PLATFORM_LABELS/ACTIVE_PLATFORMS (previously the single
 * source of truth for PlatformSelector.tsx/PlatformNudgeBanner.tsx) removed
 * -- both, plus AlertCard.tsx and the search create/edit pages, now read
 * from the live marketplace_platform_registry via usePlatforms() instead.
 * This file exists solely for AlertPlatformFilter below, a closed-union
 * type real independent of the registry (AlertFilters.tsx, AlertsClient.tsx,
 * ArchiveClient.tsx, lib/api/alerts.ts import only this type, never the
 * removed runtime constants -- confirmed via repo-wide grep before removal).
 * Extending the alerts-filter dropdown to Independent Shops is real,
 * deliberately out-of-scope future work (see Story 1.49's own Out of Scope).
 */
export type AlertPlatformFilter = 'all' | 'ebay' | 'heritage' | 'mycomicshop'

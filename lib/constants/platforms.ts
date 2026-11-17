/**
 * Story 1.49 removed PLATFORM_LABELS/ACTIVE_PLATFORMS; every platform-aware surface reads the live
 * marketplace_platform_registry through usePlatforms(). This file holds only the alerts filter's type.
 *
 * Story 1.96 (U-11, need 67): the server's `platform` filter takes any marketplace in the platforms
 * list (Story 1.95), a shop included, so the filter is 'all' or a registry slug ('ebay', 'heritage',
 * 'mycomicshop', 'indie:comicbookaddiction'), no longer a closed list of three.
 */
export type AlertPlatformFilter = 'all' | (string & {})

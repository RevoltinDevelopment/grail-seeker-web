import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { platformsAPI } from '@/lib/api/platforms'

/**
 * Story 1.49: the single shared source every platform-aware surface in this
 * app reads from -- PlatformSelector, SearchesClient's Monitoring row,
 * AlertCard, PlatformNudgeBanner, the search create/edit pages, and Reports.
 * Registry is low-cardinality, low-change-frequency (architecture.md, API &
 * Communication Patterns) -- same staleTime rationale as useReports().
 */
export function usePlatforms() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformsAPI.list(),
    staleTime: 5 * 60 * 1000,
  })

  const groups = data?.groups ?? []

  const displayNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const g of groups) {
      for (const p of g.platforms) {
        map[p.slug] = p.displayName
      }
    }
    return map
  }, [groups])

  const defaultEnabledSlugs = useMemo(
    () => groups.flatMap((g) => g.platforms.filter((p) => p.defaultEnabled).map((p) => p.slug)),
    [groups]
  )

  // slug -> displayName, or the raw slug itself if unknown -- never crash, never drop a row.
  // Code review fix: useCallback, not a plain closure -- ReportsClient.tsx
  // and WeekReportClient.tsx both put this function directly into a
  // useMemo dependency array, and a new identity every render was silently
  // defeating that memoization on every render regardless of whether the
  // underlying data actually changed.
  const displayNameFor = useCallback((slug: string): string => displayNames[slug] ?? slug, [displayNames])

  return { groups, isLoading, error, displayNameFor, defaultEnabledSlugs }
}

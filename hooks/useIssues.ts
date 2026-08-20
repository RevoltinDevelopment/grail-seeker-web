import { useQuery } from '@tanstack/react-query'
import { issuesAPI, type IssueSource } from '@/lib/api/issues'
import { APIError } from '@/lib/api/client'

// Story 1.16: mirrors useSearch(id)'s single-item pattern (hooks/useSearches.ts)
// rather than useSearches()'s list+realtime pattern -- this fetches one
// series's issues once, no subscription needed. IssueSelector calls this
// itself as soon as seriesId is known and derives eligibility (no GCD data /
// one-shot / full picker) from the response/404 directly, rather than a
// parent-resolved flag -- see the story's Component Contract for why.
//
// Story 1.18: source-parameterized (series vs Alias Group) -- queryKey
// includes source.kind so React Query never conflates a comic_series.id
// and an alias_groups.id that happen to collide in cache.
export function useIssues(source: IssueSource | null) {
  return useQuery({
    queryKey: source ? ['issues', source.kind, source.id] : ['issues', null],
    queryFn: () => issuesAPI.list(source!),
    enabled: !!source,
    // A 404 (no GCD data for this series) is an expected, meaningful
    // response -- never retry it. Genuine transient failures (network,
    // 500) still get React Query's normal retry behavior.
    retry: (failureCount, error) =>
      !(error instanceof APIError && error.status === 404) && failureCount < 3,
  })
}

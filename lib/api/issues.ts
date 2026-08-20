import type { SeriesIssuesResponse, IssueSearchResponse } from '@/types/issue.types'
import { apiClient } from './client'

// Story 1.18: an IssueSelector can resolve issues for either a real
// comic_series or an Alias Group (a collector-facing identity spanning
// multiple real series -- see docs/bmad-output/implementation-artifacts/
// 1-17-alias-groups.md). Response shape is identical either way; only the
// base path differs.
export type IssueSource = { kind: 'series'; id: string } | { kind: 'aliasGroup'; id: string }

function basePath(source: IssueSource): string {
  return source.kind === 'series' ? `/api/series/${source.id}` : `/api/alias-groups/${source.id}`
}

export const issuesAPI = {
  // Pre-bucketed browse for a series/Alias Group's IssuePickerModal
  list: (source: IssueSource) => apiClient.get<SeriesIssuesResponse>(`${basePath(source)}/issues`),

  // Title search + exact-number on-blur direct-entry validation, same
  // per-issue shape as list() (Story 1.15 AC #3)
  search: (source: IssueSource, query: string) =>
    apiClient.get<IssueSearchResponse>(
      `${basePath(source)}/issues/search?q=${encodeURIComponent(query)}`
    ),
}

import type { SeriesIssuesResponse, IssueSearchResponse } from '@/types/issue.types'
import { apiClient } from './client'

export const issuesAPI = {
  // Pre-bucketed browse for a series's IssuePickerModal
  list: (seriesId: string) => apiClient.get<SeriesIssuesResponse>(`/api/series/${seriesId}/issues`),

  // Title search + exact-number on-blur direct-entry validation, same
  // per-issue shape as list() (Story 1.15 AC #3)
  search: (seriesId: string, query: string) =>
    apiClient.get<IssueSearchResponse>(
      `/api/series/${seriesId}/issues/search?q=${encodeURIComponent(query)}`
    ),
}

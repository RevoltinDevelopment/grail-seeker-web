import type { AliasGroupResponse } from '@/types/search.types'
import { apiClient } from './client'

// Story 1.18: bare Alias Group metadata lookup by id -- needed for
// edit-mode prefill, where GrailSearch.aliasGroupId is a bare id with no
// display-name text alongside it to search for via seriesAPI.search.
export const aliasGroupsAPI = {
  get: (aliasGroupId: string) =>
    apiClient.get<AliasGroupResponse>(`/api/alias-groups/${aliasGroupId}`),
}

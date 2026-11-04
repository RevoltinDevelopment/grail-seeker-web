import type { AlertPlatformFilter } from '@/lib/constants/platforms'
import type { AlertListResponse, ArchiveGroupsResponse } from '@/types/alert.types'
import { apiClient } from './client'

export interface AlertFilters {
  limit?: number
  offset?: number
  platform?: AlertPlatformFilter
  matchType?: 'direct_match' | 'near_miss' | 'all'
  searchId?: string
  status?: 'active' | 'archived' | 'all' // Archive system: filter by status
}

export interface AlertStats {
  active: number
  total: number
  archivedThisWeek: number
}

export const alertsAPI = {
  // Get all alerts for current user
  list: (params?: AlertFilters) => {
    const queryParams = new URLSearchParams()
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString())
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', params.offset.toString())
    }
    if (params?.platform && params.platform !== 'all') {
      queryParams.append('platform', params.platform)
    }
    if (params?.matchType && params.matchType !== 'all') {
      queryParams.append('matchType', params.matchType)
    }
    if (params?.searchId) {
      queryParams.append('searchId', params.searchId)
    }
    // Archive system: add status filter
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status)
    }
    const queryString = queryParams.toString()
    const url = queryString ? `/api/alerts?${queryString}` : '/api/alerts'
    return apiClient.get<AlertListResponse>(url)
  },

  // Archive system: Get alert statistics
  getStats: () => {
    return apiClient.get<AlertStats>('/api/alerts/stats')
  },

  // Story 1.82 (Decision #103): the header's count of new alerts
  getUnseenCount: () => {
    return apiClient.get<{ unseen: number }>('/api/alerts/unseen-count')
  },

  // Story 1.82 (Decision #103): the alerts a page showed; the server marks the caller's own, once
  markSeen: (alertIds: string[]) => {
    return apiClient.post<{ marked: number }>('/api/alerts/seen', { alertIds })
  },

  // Archive system: Archive (dismiss) an alert
  archive: (alertId: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/api/alerts/${alertId}/archive`)
  },

  // Archive By Book mode: group list (searchId/title/count), including
  // soft-deleted searches — see GET /api/alerts/archive-groups
  getArchiveGroups: (
    params?: Pick<AlertFilters, 'platform' | 'matchType'>
  ) => {
    const queryParams = new URLSearchParams()
    if (params?.platform && params.platform !== 'all') {
      queryParams.append('platform', params.platform)
    }
    if (params?.matchType && params.matchType !== 'all') {
      queryParams.append('matchType', params.matchType)
    }
    const queryString = queryParams.toString()
    const url = queryString
      ? `/api/alerts/archive-groups?${queryString}`
      : '/api/alerts/archive-groups'
    return apiClient.get<ArchiveGroupsResponse>(url)
  },
}

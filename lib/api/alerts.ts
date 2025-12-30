import type { AlertListResponse } from '@/types/alert.types'
import { apiClient } from './client'

export interface AlertFilters {
  limit?: number
  offset?: number
  platform?: 'ebay' | 'heritage' | 'comiclink' | 'all'
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

  // Archive system: Archive (dismiss) an alert
  archive: (alertId: string) => {
    return apiClient.post<{ success: boolean; message: string }>(`/api/alerts/${alertId}/archive`)
  },
}

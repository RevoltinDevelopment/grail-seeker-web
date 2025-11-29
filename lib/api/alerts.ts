import type { AlertListResponse } from '@/types/alert.types'
import { apiClient } from './client'

export interface AlertFilters {
  limit?: number
  offset?: number
  platform?: 'ebay' | 'heritage' | 'comiclink' | 'all'
  matchType?: 'direct_match' | 'near_miss' | 'all'
  searchId?: string
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
    const queryString = queryParams.toString()
    const url = queryString ? `/api/alerts?${queryString}` : '/api/alerts'
    return apiClient.get<AlertListResponse>(url)
  },
}

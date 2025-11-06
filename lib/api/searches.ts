import type {
  GrailSearch,
  CreateSearchRequest,
  UpdateSearchRequest,
  SearchListResponse,
} from '@/types/search.types'
import { apiClient } from './client'

export const searchesAPI = {
  // Get all searches for current user
  list: () => apiClient.get<SearchListResponse>('/api/searches'),

  // Get single search by ID
  get: (id: string) => apiClient.get<GrailSearch>(`/api/searches/${id}`),

  // Create new search
  create: (data: CreateSearchRequest) => apiClient.post<GrailSearch>('/api/searches', data),

  // Update existing search
  update: (id: string, data: UpdateSearchRequest) =>
    apiClient.patch<GrailSearch>(`/api/searches/${id}`, data),

  // Delete search
  delete: (id: string) => apiClient.delete<void>(`/api/searches/${id}`),

  // Pause/Resume search
  updateStatus: (id: string, isActive: boolean) =>
    apiClient.patch<GrailSearch>(`/api/searches/${id}/status`, { isActive }),
}

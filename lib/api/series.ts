import type { ComicSeries } from '@/types/search.types'
import { apiClient } from './client'

interface SeriesSearchResponse {
  series: ComicSeries[]
}

export const seriesAPI = {
  // Search series for autocomplete
  search: (query: string) =>
    apiClient.get<SeriesSearchResponse>(`/api/series/search?q=${encodeURIComponent(query)}`),
}

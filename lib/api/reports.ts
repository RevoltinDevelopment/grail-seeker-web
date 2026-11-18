import type { BooksFoundResponse, ReportsResponse, WeekReport } from '@/types/report.types'
import { apiClient } from './client'

export const reportsAPI = {
  get: () => apiClient.get<ReportsResponse>('/api/reports'),

  getWeek: (weekStart: string) =>
    apiClient.get<WeekReport>(`/api/reports/week/${encodeURIComponent(weekStart)}`),

  /** Story 1.100 (U-14): every copy found since the account was made, grouped by book */
  getBooksFound: () => apiClient.get<BooksFoundResponse>('/api/reports/books-found'),
}

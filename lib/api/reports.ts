import type { ReportsResponse, WeekReport } from '@/types/report.types'
import { apiClient } from './client'

export const reportsAPI = {
  get: () => apiClient.get<ReportsResponse>('/api/reports'),

  getWeek: (weekStart: string) =>
    apiClient.get<WeekReport>(`/api/reports/week/${weekStart}`),
}

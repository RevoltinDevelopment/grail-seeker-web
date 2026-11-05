import { apiClient } from './client'

/** One standard grade, as GET /api/grades sends it (Story 1.81): { value: 9.4, label: '9.4 - Near Mint' }. */
export interface GradeOption {
  value: number
  label: string
}

export interface GradesResponse {
  grades: GradeOption[]
}

/**
 * Story 1.84 (S-04): the grades a search can use come from the server, the same list the slot
 * count uses (standard_grades). The web app keeps no grade list of its own.
 */
export const gradesAPI = {
  list: () => apiClient.get<GradesResponse>('/api/grades'),
}

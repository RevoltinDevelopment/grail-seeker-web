import { apiClient } from './client'

// Test SMS Response Types
export interface TestSmsResponse {
  success: boolean
  message: string
  messageSid: string
  phoneNumber: string
}

export type AlertsSortMode = 'date' | 'book'

export interface AlertsUiPreferences {
  alertsSort?: AlertsSortMode
  alertsCollapsedGroups?: string[]
  archiveSort?: AlertsSortMode
}

// User Preferences Types
export interface UserPreferences {
  smsNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
  nearMissEnabled: boolean
  /** Story 1.95 (need 61): the server's near-miss margin, 0.15 */
  nearMissMargin?: number
  smsConsentGiven?: boolean
  smsConsentTimestamp?: string
  uiPreferences?: AlertsUiPreferences
}

export interface UpdatePreferencesResponse {
  success: boolean
  preferences: UserPreferences
}

/**
 * Send a test SMS to the authenticated user's phone number
 * @throws APIError if the request fails
 */
export async function sendTestSms(): Promise<TestSmsResponse> {
  return apiClient.post<TestSmsResponse>('/api/user/test-sms')
}

/**
 * Get the authenticated user's notification preferences
 * @throws APIError if the request fails
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  return apiClient.get<UserPreferences>('/api/user/preferences')
}

/**
 * Update the authenticated user's notification preferences
 * @throws APIError if the request fails
 */
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UpdatePreferencesResponse> {
  return apiClient.patch<UpdatePreferencesResponse>('/api/user/preferences', preferences)
}

/**
 * Story 1.104: delete the signed-in account (today's behaviour: the provider's delete, which
 * cascades; Decision #104 waits for S-20).
 * @throws APIError if the request fails
 */
export async function deleteAccount(): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>('/api/user')
}

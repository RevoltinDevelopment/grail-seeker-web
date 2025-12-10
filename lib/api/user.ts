import { apiClient } from './client'

// Test SMS Response Types
export interface TestSmsResponse {
  success: boolean
  message: string
  messageSid: string
  phoneNumber: string
}

// User Preferences Types
export interface UserPreferences {
  smsNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  nearMissEnabled: boolean
  smsConsentGiven?: boolean
  smsConsentTimestamp?: string
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

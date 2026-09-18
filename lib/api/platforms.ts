import { apiClient } from './client'

export interface PlatformEntry {
  slug: string
  displayName: string
  defaultEnabled: boolean
}

export interface PlatformGroup {
  label: string
  platforms: PlatformEntry[]
}

export interface PlatformsResponse {
  groups: PlatformGroup[]
}

export const platformsAPI = {
  list: () => apiClient.get<PlatformsResponse>('/api/platforms'),
}

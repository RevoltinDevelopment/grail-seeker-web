/**
 * The time zones Settings offers for quiet hours (moved from SettingsClient by Story 1.104; the
 * design draws four US zones, but the redesign keeps every choice today's page offered). A curated
 * common-zone list, mirroring the backend's phone-country inference map.
 */
export const TIMEZONE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Anchorage', label: 'Alaska Time (US)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (US)' },
  { value: 'America/Toronto', label: 'Canada (Eastern)' },
  { value: 'Europe/London', label: 'United Kingdom' },
  { value: 'Europe/Paris', label: 'France' },
  { value: 'Europe/Berlin', label: 'Germany' },
  { value: 'Australia/Sydney', label: 'Australia (Sydney)' },
  { value: 'Pacific/Auckland', label: 'New Zealand' },
]

/**
 * The list for an account: an account whose zone isn't on it (set before the list, or worked out
 * from its phone) gets that zone first, named as the server names it, so saving never changes it
 * silently.
 */
export function timezoneOptionsFor(zone: string | null | undefined, zoneName?: string | null) {
  if (!zone || TIMEZONE_OPTIONS.some((o) => o.value === zone)) return TIMEZONE_OPTIONS
  return [
    // Named as the server names it ("Central European Time"); the zone's own id only when it has no name
    { value: zone, label: zoneName || zone },
    ...TIMEZONE_OPTIONS,
  ]
}

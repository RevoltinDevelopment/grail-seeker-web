/**
 * Story 1.106 (U-18, need 37): how long an emailed sign-in link works, in one place.
 *
 * Supabase's "Email OTP Expiration" (Authentication → Providers → Email) sets the life of every
 * emailed link: invitations, password resets and email changes alike. It was raised to 24 hours on
 * 2026-11-09 for invitations (Decision #99). When it comes back down after launch, change this
 * number in the same hour: every page that mentions the link's life reads it from here.
 */
export const EMAIL_LINK_HOURS = 24

/** "24 hours", "one hour". */
export function linkLifeWords(hours: number = EMAIL_LINK_HOURS): string {
  return hours === 1 ? 'one hour' : `${hours} hours`
}

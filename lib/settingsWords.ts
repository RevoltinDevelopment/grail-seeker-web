/**
 * Story 1.104 (U-15): every sentence Settings says, worked out from what the server answers. The page
 * only renders what these return. Designs: docs/ux/mockups/subscriber-experience/settings-page.html
 * and settings-delete-account.html (in the backend repo); words not drawn there are marked in the
 * story file and were listed for Mahan.
 *
 * Times of day come from the server's own labels ("6:00 AM"), never formatted here, so the page and
 * the worker cannot disagree (Decision #108).
 */
import type { AccountSummary, CheckTimes } from '@/lib/api/account'

const EASTERN = 'America/New_York'

/** A US number (+1 and ten digits) as "(555) 014-2290"; any other as stored. */
export function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, '')
  const us = /^\+?1(\d{3})(\d{3})(\d{4})$/.exec(digits)
  if (us) return `(${us[1]}) ${us[2]}-${us[3]}`
  return phone.startsWith('+') ? phone : `+${phone}`
}

/** "August 12, 2026", read in Eastern like every account date (Decision #108). */
export function memberSince(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null
  const at = new Date(createdAt)
  if (Number.isNaN(at.getTime())) return null
  return at.toLocaleDateString('en-US', {
    timeZone: EASTERN,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** "Collector · 6 of 10 slots in use"; null for an account with no plan (the section is hidden). */
export function planLine(account: AccountSummary | null): string | null {
  if (!account?.plan) return null
  return `${account.plan.name} · ${account.slots.inUse} of ${account.slots.entitled} slots in use`
}

/** Before billing (S-19 to S-22) the plan page holds only the plan and slots (Decision #109). */
export const PLAN_NOTE = 'Your plan and slots are on their own page.'

/** App Only (a plan whose texts aren't included) shows no text settings. No plan read yet: texts shown. */
export function hasTexts(account: AccountSummary | null): boolean {
  return account?.plan?.textsIncluded !== false
}

export function textsNote(textsOn: boolean, phone: string | null | undefined): string {
  const shown = formatPhone(phone)
  if (!shown) return 'Add a phone number above to get texts.'
  return textsOn
    ? `Texts go to ${shown}. Every match also shows in Alerts.`
    : 'Texts are off. Matches still show in Alerts.'
}

export function testTextNote(phone: string | null | undefined, sent: boolean): string {
  const shown = formatPhone(phone)
  if (!shown) return 'Add a phone number above first.'
  return sent
    ? `Sent to ${shown}. It should arrive within a minute.`
    : `Check that texts reach ${shown}.`
}

/** A failed test text, in plain words: never the server's own text. */
export function testTextError(code: string | null | undefined): string {
  switch (code) {
    case 'RATE_LIMITED':
      return 'You’ve sent 3 test texts today. Try again tomorrow.'
    case 'SERVICE_DISABLED':
      return 'Texts are paused for a moment. Try again later.'
    case 'NO_PHONE_NUMBER':
      return 'Add a phone number above first.'
    default:
      return 'Couldn’t send the test text. Try again.'
  }
}

/** "You agreed to receive texts from Grail Seeker on August 12, 2026 at 3:14 PM. …", on the subscriber's clock. */
export function consentLine(timestamp: string | null | undefined, timezone: string): string | null {
  if (!timestamp) return null
  const at = new Date(timestamp)
  if (Number.isNaN(at.getTime())) return null
  const zone = safeZone(timezone)
  const day = at.toLocaleDateString('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const time = at.toLocaleTimeString('en-US', {
    timeZone: zone,
    hour: 'numeric',
    minute: '2-digit',
  })
  return `You agreed to receive texts from Grail Seeker on ${day} at ${time}. Reply STOP to any text to end them.`
}

function safeZone(timezone: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return timezone
  } catch {
    return EASTERN
  }
}

/** "Also alert me to books up to 15% over my maximum price. …" with the server's margin (need 61). */
export function nearMissNote(margin: number | null | undefined): string {
  const pct = typeof margin === 'number' && margin > 0 ? Math.round(margin * 100) : null
  const over = pct === null ? 'a little over' : `up to ${pct}% over`
  return `Also alert me to books ${over} my maximum price. They are marked "Near miss" in Alerts.`
}

function joinTimes(labels: readonly string[]): string {
  if (labels.length <= 1) return labels.join('')
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/** "Your searches are checked at 6:00 AM and 4:00 PM Pacific Time." and, when no check is covered, why every match is texted. */
export function checkTimesLine(ct: CheckTimes): string {
  const times = ct.times
  if (times.length === 0) return ''
  const base = `Your searches are checked at ${joinTimes(times.map((t) => t.label))} ${ct.timezoneName}.`
  if (times.some((t) => t.withinQuietHours)) return base
  if (times.length === 1)
    return `${base} The check falls outside these hours, so every match is texted.`
  if (times.length === 2)
    return `${base} Both checks fall outside these hours, so every match is texted.`
  return `${base} Every check falls outside these hours, so every match is texted.`
}

/** "morning" before 12:00 on the subscriber's clock, "evening" from 12:00. */
function partOfDay(local: string): 'morning' | 'evening' {
  return Number(local.slice(0, 2)) < 12 ? 'morning' : 'evening'
}

/** The amber warning when quiet hours cover a check; null when none is covered. */
export function quietWarning(ct: CheckTimes): { heading: string; body: string } | null {
  const hit = ct.times.filter((t) => t.withinQuietHours)
  if (hit.length === 0) return null
  if (hit.length === ct.times.length && ct.times.length > 1) {
    return {
      heading:
        ct.times.length === 2 ? 'These hours cover both checks' : 'These hours cover every check',
      body: 'No match will be texted. Every match still shows in Alerts.',
    }
  }
  if (hit.length === 1) {
    return {
      heading: `These hours cover your ${partOfDay(hit[0].local)} check, at ${hit[0].label}`,
      body: 'Matches it finds won’t be texted. They still show in Alerts.',
    }
  }
  return {
    heading: `These hours cover ${hit.length} of your ${ct.times.length} checks`,
    body: 'Matches they find won’t be texted. They still show in Alerts.',
  }
}

/** A failed password change, by the sign-in provider's code; never its message. */
export type PasswordAnswer = { field: 'current' | 'new' | 'form'; text: string }

export function passwordError(code: string | null | undefined): PasswordAnswer {
  switch (code) {
    // Hosted Supabase answers current_password_invalid (seen 2026-11-18); the open-source server's
    // names are kept in case the two are brought in line
    case 'current_password_invalid':
    case 'current_password_mismatch':
    case 'current_password_required':
      return { field: 'current', text: 'That isn’t your current password.' }
    case 'same_password':
      return { field: 'new', text: 'That’s the password you have now. Choose a new one.' }
    case 'reauthentication_needed':
    case 'reauthentication_not_valid':
      return {
        field: 'form',
        text: 'For your security, sign out and sign in again, then change your password.',
      }
    case 'weak_password':
      return { field: 'new', text: 'Choose a longer password, at least 8 characters.' }
    default:
      return { field: 'form', text: 'Couldn’t change your password. Try again.' }
  }
}

export const PASSWORD_MISMATCH = 'The new passwords don’t match.'
export const PASSWORD_SHORT = 'Choose a longer password, at least 8 characters.'
export const MIN_PASSWORD = 8

/** A failed email change, by the provider's code. */
export function emailError(code: string | null | undefined): string {
  return code === 'email_exists'
    ? 'That email is already used by another account.'
    : 'Couldn’t send the link. Try again.'
}

/** The pending-change panel (Secure email change is on: a link to each address, Mahan 2026-11-18). */
export function emailPending(newEmail: string, current: string): { heading: string; body: string } {
  return {
    heading: 'Check both inboxes',
    body: `We sent a link to ${newEmail} and one to ${current}. Open both to finish the change. Until then, your email stays ${current}.`,
  }
}

export const EMAIL_FORM_NOTE =
  'We send a link to the new address and one to your current address. Your email stays the same until you open both.'
export const EMAIL_IGNORE_NOTE = 'Didn’t mean to? Ignore the link. It stops working after 24 hours.'

/** The delete confirm's first line; null with no searches (left out). */
export function deleteSearchesLine(count: number): string | null {
  if (count <= 0) return null
  return count === 1
    ? 'Your 1 search stops and is deleted.'
    : `Your ${count} searches stop and are deleted.`
}

/** "Type DELETE to confirm": any case, spaces trimmed (as drawn). */
export function deleteTyped(typed: string): boolean {
  return typed.trim().toUpperCase() === 'DELETE'
}

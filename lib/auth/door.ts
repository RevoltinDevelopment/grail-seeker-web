/**
 * Story 1.106 (U-18, need 39): the guards. On every sign-in and every full page load of the app,
 * an account that still owes a step goes to that step, and nowhere else:
 *
 *   1. welcome:  invited, and never finished /welcome (the password and the Terms)
 *   2. no plan:  no entitlement at all (GET /api/account/entitlement answers plan: null)
 *   3. phone:    a plan with texts, and no verified number on the sign-in account
 *
 * The guard is a door, not a lock: it stops nothing on the server. A phone-guarded account's
 * searches run and its matches wait in the app; an account with no plan has no slots, so its
 * searches are held by the slot limit already (Decision #95).
 *
 * `plan` is undefined when the backend couldn't be read: then nobody is locked out by our own
 * outage. Only the welcome step, which needs no backend, is still enforced.
 */
export type DoorStep = 'welcome' | 'choose-plan' | 'verify-phone'

export const DOOR_PATH: Record<DoorStep, string> = {
  welcome: '/welcome',
  'choose-plan': '/choose-plan',
  'verify-phone': '/verify-phone',
}

export interface DoorUser {
  invited_at?: string | null
  phone_confirmed_at?: string | null
  user_metadata?: Record<string, unknown> | null
}

/** null: no plan. undefined: the plan couldn't be read. */
export type DoorPlan = { textsIncluded: boolean } | null | undefined

export function needsWelcome(user: DoorUser): boolean {
  return !!user.invited_at && !user.user_metadata?.welcomed_at
}

export function doorStep(user: DoorUser, plan: DoorPlan): DoorStep | null {
  if (needsWelcome(user)) return 'welcome'
  if (plan === undefined) return null
  if (plan === null) return 'choose-plan'
  if (plan.textsIncluded && !user.phone_confirmed_at) return 'verify-phone'
  return null
}

import * as Sentry from '@sentry/nextjs'

import type { AccountSummary } from '@/lib/api/account'
import { getAPIBaseURL } from '@/lib/api/client'
import type { DoorPlan } from '@/lib/auth/door'

import type { SupabaseClient } from '@supabase/supabase-js'

/** Long enough for a normal answer; short enough that a slow backend doesn't hold every page. */
const READ_TIMEOUT_MS = 3000

/**
 * Story 1.106 (U-18): the account's plan, read by the web server for the guards, with the
 * session's own access token (the same call the browser makes, GET /api/account/entitlement).
 *
 * Answers undefined when it can't be read (no token, a timeout, an error, an answer it doesn't
 * recognise): the guard then lets the person in, and Sentry hears about it.
 *
 * Call only after supabase.auth.getUser() has confirmed the user in the same request, so the
 * session read here is one the provider has just accepted.
 */
export interface DoorAccount {
  plan: DoorPlan
  /** The account's searches, for the no-plan step's words; null when not read. */
  searchCount: number | null
  /** The plan's name, for the phone step's words; null when there is none or it wasn't read. */
  planName: string | null
}

export async function readDoorPlan(supabase: SupabaseClient): Promise<DoorPlan> {
  return (await readDoorAccount(supabase)).plan
}

export async function readDoorAccount(supabase: SupabaseClient): Promise<DoorAccount> {
  const unread: DoorAccount = { plan: undefined, searchCount: null, planName: null }
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) return unread
    const response = await fetch(`${getAPIBaseURL()}/api/account/entitlement`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`entitlement read answered ${response.status}`)
    const body = (await response.json()) as Partial<AccountSummary>
    // Running and held searches alike: with no plan, every search is held (no slots)
    const searchCount =
      Array.isArray(body.searches) && Array.isArray(body.heldSearches)
        ? body.searches.length + body.heldSearches.length
        : null
    if (body.plan === null) return { plan: null, searchCount, planName: null }
    if (body.plan && typeof body.plan.textsIncluded === 'boolean') {
      return {
        plan: { textsIncluded: body.plan.textsIncluded },
        searchCount,
        planName: typeof body.plan.name === 'string' ? body.plan.name : null,
      }
    }
    throw new Error('entitlement read gave an unexpected answer')
  } catch (error) {
    Sentry.captureException(error, { tags: { area: 'door-guard' } })
    return unread
  }
}

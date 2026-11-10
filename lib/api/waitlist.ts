import { APIError, getAPIBaseURL } from './client'

/** What POST /api/waitlist answers (Story 1.88): a new place in line, or the place already held. */
export type WaitlistJoinResult = 'joined' | 'already_on_list'

/**
 * Story 1.89 (U-09): join the waitlist. The one call this app makes with no session, so it does not
 * go through apiClient, which reads the session first and sends a visitor without one to sign-in.
 * The route is public and never says whether the address has an account.
 *
 * Throws APIError with the server's code (INVALID_EMAIL, RATE_LIMITED, DATABASE_ERROR, ...), or
 * the fetch's own TypeError when the browser is offline.
 */
export async function joinWaitlist(email: string): Promise<WaitlistJoinResult> {
  const response = await fetch(`${getAPIBaseURL()}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  let body: { status?: string; error?: { code?: string; message?: string } } = {}
  try {
    body = await response.json()
  } catch {
    // no JSON: handled below by status
  }

  if (!response.ok) {
    throw new APIError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? `HTTP ${response.status}`
    )
  }
  if (body.status === 'joined' || body.status === 'already_on_list') return body.status
  throw new APIError(response.status, 'API_ERROR', 'The server gave an unexpected answer')
}

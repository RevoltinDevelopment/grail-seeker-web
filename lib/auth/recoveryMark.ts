import type { NextResponse } from 'next/server'

/**
 * Story 1.106 (U-18, code review): the mark that a password-reset link was just opened in this
 * browser, so reset password shows its form (a new password without the old one).
 *
 * Set by our own server only, after the provider has accepted a recovery link (/auth/confirm with
 * type=recovery; /auth/callback for a link sent the old way), and tied to the account it signed in.
 * HttpOnly, for this site only, for the RECOVERY_MARK_SECONDS after the link was opened.
 *
 * It replaced reading the session's `amr` claim, which can't tell a reset link from an invitation or
 * an email change (all record `otp`), and which failed closed when the claim couldn't be read. The
 * mark is a door for the page, not the lock: Supabase's "Require current password" refuses a save
 * from a session that didn't come from a recovery link, whatever the page shows.
 */
export const RECOVERY_MARK = 'gs-recovery'
export const RECOVERY_MARK_SECONDS = 60 * 60

export function setRecoveryMark(response: NextResponse, userId: string): void {
  response.cookies.set(RECOVERY_MARK, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: RECOVERY_MARK_SECONDS,
  })
}

export function hasRecoveryMark(markValue: string | undefined, userId: string): boolean {
  return !!markValue && markValue === userId
}

/**
 * A response that signs someone in must never be kept by a cache in front of the app (Story 1.104
 * did this for the middleware; these route handlers set the session cookies themselves).
 */
export function noStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0')
  return response
}

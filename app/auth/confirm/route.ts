import { NextResponse } from 'next/server'

import { noStore, setRecoveryMark } from '@/lib/auth/recoveryMark'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/utils/safe-redirect'

import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Story 1.89 (U-09): completes a link the sign-in provider sent by email as a token hash, the
 * documented pattern for a server-rendered app. The "Invite user" template links here:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/welcome
 * verifyOtp confirms the account and sets the session cookies through the server client (as
 * /auth/callback's exchangeCodeForSession does for the PKCE flows). An invitation always lands on
 * /welcome, whatever `next` says, so nobody skips setting a password (code review); any other type
 * follows `next`, only ever a path inside this app (Story 1.77). U-18 may point the other templates
 * here.
 *
 * The token never reaches a page: a failure redirects with no detail. An invitation that failed
 * (expired, already used, or not an invitation) lands on /welcome's expired page; a password-reset
 * link that failed lands on reset password's expired page (Story 1.106, U-18: the Reset Password
 * template links here with type=recovery&next=/reset-password); any other type lands on sign-in as
 * /auth/callback does.
 *
 * The token is used once, so a link checker or a browser prefetch must not spend it (code review):
 * a HEAD request and a request marked as a prefetch are answered without verifying.
 */
const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  'invite',
  'recovery',
  'email',
  'email_change',
  'magiclink',
  'signup',
]

// Not exported: a Next.js route file may export only its handlers.
const INVITE_LANDING = '/welcome'
const RECOVERY_LANDING = '/reset-password'
const RECOVERY_EXPIRED = '/reset-password?error=link'

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (EMAIL_OTP_TYPES as readonly string[]).includes(value)
}

function isPrefetch(request: Request): boolean {
  const purpose = request.headers.get('sec-purpose') ?? request.headers.get('purpose') ?? ''
  return /prefetch|prerender/i.test(purpose)
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}

export async function GET(request: Request) {
  if (isPrefetch(request)) return new Response(null, { status: 204 })

  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const invite = type === 'invite'
  const failedLanding = invite
    ? `${INVITE_LANDING}?error=link`
    : type === 'recovery'
      ? RECOVERY_EXPIRED
      : '/login?error=verification_failed'
  const failed = () => noStore(NextResponse.redirect(new URL(failedLanding, request.url)))

  if (!tokenHash || !isEmailOtpType(type)) return failed()

  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
      console.error('Auth confirm error:', error.message)
      return failed()
    }
    userId = data?.user?.id ?? null
  } catch (error) {
    console.error('Auth confirm failed:', error instanceof Error ? error.message : error)
    return failed()
  }

  // An invitation always lands on /welcome and a reset link on reset password, whatever `next`
  // says (Story 1.106, code review: a reset that landed elsewhere would leave the old password).
  const next = invite
    ? INVITE_LANDING
    : type === 'recovery'
      ? RECOVERY_LANDING
      : safeRedirectPath(searchParams.get('next'))
  const response = noStore(NextResponse.redirect(new URL(next, request.url)))
  if (type === 'recovery' && userId) setRecoveryMark(response, userId)
  return response
}

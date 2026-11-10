import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/utils/safe-redirect'

import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Story 1.89 (U-09): completes a link the sign-in provider sent by email as a token hash, the
 * documented pattern for a server-rendered app. The "Invite user" template links here:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/welcome
 * verifyOtp confirms the account and sets the session cookies through the server client (as
 * /auth/callback's exchangeCodeForSession does for the PKCE flows); the person is then sent to
 * `next`, only ever a path inside this app (Story 1.77). U-18 may point the other templates here.
 *
 * The token never reaches a page: a failure redirects with no detail. An invitation that failed
 * (expired, already used, or not an invitation) lands on /welcome's expired page; any other type
 * lands on sign-in as /auth/callback does.
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

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (EMAIL_OTP_TYPES as readonly string[]).includes(value)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const invite = type === 'invite'
  const failed = () =>
    NextResponse.redirect(
      new URL(invite ? `${INVITE_LANDING}?error=link` : '/login?error=verification_failed', request.url)
    )

  if (!tokenHash || !isEmailOtpType(type)) return failed()

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    console.error('Auth confirm error:', error.message)
    return failed()
  }

  const next = safeRedirectPath(searchParams.get('next'), invite ? INVITE_LANDING : undefined)
  return NextResponse.redirect(new URL(next, request.url))
}

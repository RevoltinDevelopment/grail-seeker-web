import { NextResponse } from 'next/server'

import { noStore, setRecoveryMark } from '@/lib/auth/recoveryMark'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/utils/safe-redirect'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // Story 1.77: only a path inside the app; an absolute `next` would replace our origin
  const next = safeRedirectPath(searchParams.get('next'))
  // Story 1.106: a password-reset link sent the old (PKCE) way, through reset password's shim
  const recovery = next.startsWith('/reset-password')

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // To Searches, or the page the link named (Story 1.77)
        const response = noStore(NextResponse.redirect(new URL(next, request.url)))
        if (recovery && data?.user?.id) setRecoveryMark(response, data.user.id)
        return response
      }
      console.error('Auth callback error:', error)
    } catch (error) {
      // Code review: a thrown exchange lands like a failed one, not on a bare error page
      console.error('Auth callback failed:', error instanceof Error ? error.message : error)
    }
  }

  // Story 1.106: a failed reset link shows reset password's expired page, with a way to send a new
  // link; anything else goes to sign-in as before.
  const failedLanding = recovery ? '/reset-password?error=link' : '/login?error=verification_failed'
  return noStore(NextResponse.redirect(new URL(failedLanding, request.url)))
}

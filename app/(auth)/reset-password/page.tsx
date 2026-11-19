import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Door } from '@/components/auth/Door'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { SendLinkForm } from '@/components/auth/SendLinkForm'
import { needsWelcome } from '@/lib/auth/door'
import { hasRecoveryMark, RECOVERY_MARK } from '@/lib/auth/recoveryMark'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Set a new password | Grail Seeker' }

/**
 * Story 1.106 (U-18): where a password-reset link lands (front-door-password.html: "reset",
 * "reset: expired").
 *
 * - `?error=link` (from /auth/confirm or /auth/callback), or no session: the expired page.
 * - `?code=`: a link sent before the Reset Password template moved to /auth/confirm (PKCE).
 *   /auth/callback exchanges it and comes back. Remove after 2026-11-27, once every old link has
 *   expired.
 * - An invited account that never finished /welcome: there, to set the password and agree to the
 *   Terms in one go.
 * - A reset link opened in this browser in the last hour, for this account (lib/auth/recoveryMark.ts):
 *   the form.
 * - Anyone else signed in: Settings, which asks for the current password.
 *
 * The middleware covers this page, so a refreshed session's cookies are saved before it reads one
 * (lib/supabase/currentUser.ts).
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; code?: string | string[] }>
}) {
  const params = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  const code = first(params.code)
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/reset-password`)
  }

  const expired = (
    <Door>
      <SendLinkForm variant="expired" />
    </Door>
  )
  if (first(params.error) === 'link') return expired

  const supabase = await createClient()
  let user = null
  try {
    user = (await supabase.auth.getUser()).data.user
  } catch {
    user = null
  }
  if (!user) return expired
  if (needsWelcome(user)) redirect('/welcome')
  const mark = (await cookies()).get(RECOVERY_MARK)?.value
  if (!hasRecoveryMark(mark, user.id)) redirect('/settings#password')

  return (
    <Door>
      <ResetPasswordForm email={user.email ?? null} />
    </Door>
  )
}

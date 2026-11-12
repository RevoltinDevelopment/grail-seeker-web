import { redirect } from 'next/navigation'

import { LogoLockup } from '@/components/auth/LogoLockup'
import { WelcomeFlow } from '@/components/auth/WelcomeFlow'
import { createClient } from '@/lib/supabase/server'

/**
 * Story 1.89 (U-09): where an invitation link lands, after /auth/confirm has signed the person in.
 * - No session (and no expired-link error): to sign-in.
 * - An account that was not invited, or has already been through this page: to Searches (code
 *   review: this page sets a password without asking for the old one, so it is only for its first
 *   visit after an invitation).
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const { error } = await searchParams
  const expired = (Array.isArray(error) ? error[0] : error) === 'link'

  let email: string | null = null
  if (!expired) {
    let user = null
    try {
      const supabase = await createClient()
      user = (await supabase.auth.getUser()).data.user
    } catch {
      user = null
    }
    if (!user) redirect('/login')
    if (!user.invited_at || user.user_metadata?.welcomed_at) redirect('/searches')
    email = user.email ?? null
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <LogoLockup />
        <WelcomeFlow email={email} expired={expired} />
      </div>
    </main>
  )
}

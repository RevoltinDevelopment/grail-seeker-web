import { redirect } from 'next/navigation'

import { LogoLockup } from '@/components/auth/LogoLockup'
import { WelcomeFlow } from '@/components/auth/WelcomeFlow'
import { createClient } from '@/lib/supabase/server'

/**
 * Story 1.89 (U-09): where an invitation link lands, after /auth/confirm has signed the person in.
 * With no session (and no expired-link error) there is nothing to do here: to sign-in.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const expired = error === 'link'

  let email: string | null = null
  if (!expired) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')
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

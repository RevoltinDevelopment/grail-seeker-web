import { GuardHeader } from '@/components/auth/GuardHeader'
import { VerifyPhoneStep } from '@/components/auth/VerifyPhoneStep'
import { DOOR_PATH } from '@/lib/auth/door'
import { requireDoorStep } from '@/lib/auth/guardPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add your phone number | Grail Seeker' }

/**
 * Story 1.106 (U-18, need 39): the phone guard. An account on a plan with texts and no verified
 * number comes here on every sign-in, and nowhere else, until a number is verified
 * (front-door-no-plan.html, "phone guard"; the phone step as /welcome uses it). Its searches run
 * meanwhile, and their matches wait in the app.
 */
export default async function VerifyPhonePage() {
  const { user, planName } = await requireDoorStep('verify-phone')
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GuardHeader email={user.email ?? ''} home={DOOR_PATH['verify-phone']} />
      <main className="flex flex-1 flex-col items-center px-4 py-10 tablet:py-16">
        <div className="flex w-full max-w-[440px] flex-col gap-5">
          <VerifyPhoneStep planName={planName} />
        </div>
      </main>
    </div>
  )
}

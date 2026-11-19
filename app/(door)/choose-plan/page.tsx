import { ChoosePlanStep } from '@/components/auth/ChoosePlanStep'
import { GuardHeader } from '@/components/auth/GuardHeader'
import { DOOR_PATH } from '@/lib/auth/door'
import { requireDoorStep } from '@/lib/auth/guardPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Choose a plan | Grail Seeker' }

/**
 * Story 1.106 (U-18, need 39): the no-plan guard. An account with no plan comes here on every
 * sign-in, and nowhere else (front-door-no-plan.html). With no slots, its searches are already held
 * by the slot limit (Decision #95); the guard changes nothing on the server.
 */
export default async function ChoosePlanPage() {
  const { user, searchCount } = await requireDoorStep('choose-plan')
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GuardHeader email={user.email ?? ''} home={DOOR_PATH['choose-plan']} />
      <main className="flex flex-1 flex-col items-center px-4 py-10 tablet:py-16">
        <div className="flex w-full max-w-[560px] flex-col gap-5">
          <ChoosePlanStep email={user.email ?? ''} searchCount={searchCount} />
        </div>
      </main>
    </div>
  )
}

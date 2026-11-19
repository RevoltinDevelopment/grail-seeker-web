'use client'

import { useRouter } from 'next/navigation'

import { PhoneStep } from '@/components/auth/PhoneStep'

/**
 * Story 1.106 (U-18): the phone guard's step: the phone step exactly as sign-up and /welcome show
 * it (the design draws the guard as that step, with the plan already in place). Verified → Searches.
 */
export function VerifyPhoneStep({ planName }: { planName: string | null }) {
  const router = useRouter()
  return (
    <PhoneStep
      planName={planName}
      onDone={() => {
        router.push('/searches')
        router.refresh()
      }}
    />
  )
}

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { AuthPanel } from '@/components/auth/AuthPanel'
import { AuthTabs } from '@/components/auth/AuthTabs'
import { HeroPanel } from '@/components/auth/HeroPanel'
import { LogoLockup } from '@/components/auth/LogoLockup'
import { SignInForm } from '@/components/auth/SignInForm'
import { WaitlistJoin } from '@/components/auth/WaitlistJoin'

function LoginContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin'

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Hero Panel - Left side on desktop */}
      <HeroPanel className="hidden lg:flex lg:w-3/5" />

      {/* Mobile hero banner */}
      <div className="flex h-28 items-center justify-center bg-gradient-to-r from-collector-navy to-collector-blue lg:hidden">
        <h2 className="text-center text-xl font-bold text-white">
          Stop searching.{' '}
          <span className="relative inline-block">
            Start finding.
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-warning-amber" />
          </span>
        </h2>
      </div>

      {/* Auth Panel - Right side on desktop */}
      <AuthPanel>
        <LogoLockup className="mb-6" />
        <AuthTabs activeTab={activeTab} className="mb-6" />

        {/* Story 1.89 (U-09): until launch, the sign-up tab is the waitlist (Decision #99) */}
        {activeTab === 'signin' ? <SignInForm /> : <WaitlistJoin />}
      </AuthPanel>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}

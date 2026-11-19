'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { AuthPanel } from '@/components/auth/AuthPanel'
import { AuthTabs } from '@/components/auth/AuthTabs'
import { HeroPanel } from '@/components/auth/HeroPanel'
import { LogoLockup } from '@/components/auth/LogoLockup'
import { SignInForm } from '@/components/auth/SignInForm'
import { WaitlistJoin } from '@/components/auth/WaitlistJoin'

/** Story 1.104: the drawn notice once an account is deleted (an information panel on the tokens). */
function AccountDeleted() {
  return (
    <section
      role="status"
      aria-labelledby="gone-h"
      className="mb-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-card border border-line-strong bg-surface p-4 text-ink"
    >
      <div className="pt-0.5 text-info-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <h2 id="gone-h" className="text-base font-bold">
          Your account has been deleted
        </h2>
        <p className="text-[15px]">Thank you for searching with Grail Seeker.</p>
      </div>
    </section>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  // Story 1.104: after Delete account (settings-delete-account.html, "deleted"); today's delete also sent "true"
  const deleted = searchParams.get('deleted') === '1' || searchParams.get('deleted') === 'true'

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
        {deleted && <AccountDeleted />}
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

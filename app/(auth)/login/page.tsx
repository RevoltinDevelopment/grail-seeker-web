'use client'

import { Suspense } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { DOOR_LINK, Door, LANDING_URL } from '@/components/auth/Door'
import { GalleryPanel } from '@/components/auth/GalleryPanel'
import { SignInForm } from '@/components/auth/SignInForm'
import { WaitlistJoin } from '@/components/auth/WaitlistJoin'

/** Story 1.104: the drawn notice once an account is deleted (an information panel on the tokens). */
function AccountDeleted() {
  return (
    <section
      role="status"
      aria-labelledby="gone-h"
      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-card border border-line-strong bg-surface p-4 text-ink"
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

/**
 * Story 1.106 (U-18): sign-in is the quiet column beside the Grail Seeker Gallery
 * (front-door-sign-in.html). The March hero, the "How it works" modal and the tabs are gone.
 * Until launch the way in for someone new is the waitlist (Decision #99): `/login?tab=signup` and
 * `/register` show it in the same column (Story 1.89, AC 1), and sign-in's last line points to it
 * (Mahan, 2026-11-19: "…or join the waitlist" until U-21's sign-up exists).
 */
const SIGN_IN_FOOT = {
  lead: 'New to Grail Seeker?',
  howItWorks: 'See how it works',
  join: 'join the waitlist',
  haveAccount: 'Already have an account?',
} as const

function LoginContent() {
  const searchParams = useSearchParams()
  const waitlist = searchParams.get('tab') === 'signup'
  // Story 1.104: after Delete account (settings-delete-account.html, "deleted"); today's delete also sent "true"
  const deleted = searchParams.get('deleted') === '1' || searchParams.get('deleted') === 'true'

  // Keep redirectTo when moving between sign-in and the waitlist
  const withTab = (tab: 'signup' | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab) params.set('tab', tab)
    else params.delete('tab')
    const query = params.toString()
    return `/login${query ? `?${query}` : ''}`
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <GalleryPanel />
      <Door>
        {deleted && <AccountDeleted />}
        {waitlist ? (
          <>
            <WaitlistJoin />
            <p className="text-center text-[15px] text-muted-foreground">
              {SIGN_IN_FOOT.haveAccount}{' '}
              <Link href={withTab(null)} className={DOOR_LINK}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <SignInForm />
            <p className="text-center text-[15px] text-muted-foreground">
              {SIGN_IN_FOOT.lead}{' '}
              <a href={LANDING_URL} className={DOOR_LINK}>
                {SIGN_IN_FOOT.howItWorks}
              </a>{' '}
              or{' '}
              <Link href={withTab('signup')} className={DOOR_LINK}>
                {SIGN_IN_FOOT.join}
              </Link>
              .
            </p>
          </>
        )}
      </Door>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  )
}

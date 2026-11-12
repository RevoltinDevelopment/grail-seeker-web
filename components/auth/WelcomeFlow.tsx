'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { LegalModal } from '@/components/auth/LegalModal'
import { PhoneStep } from '@/components/auth/PhoneStep'
import { PrivacyContent } from '@/components/auth/PrivacyContent'
import { TermsContent } from '@/components/auth/TermsContent'
import { accountAPI } from '@/lib/api/account'
import { APIError } from '@/lib/api/client'
import { createClient } from '@/lib/supabase/client'

/**
 * Story 1.89 (U-09): an invited person's first visit, after /auth/confirm signed them in. Drawn
 * from front-door-password.html's "payer: reset" (one password field with Show) and "reset:
 * expired", worded for an invitation (Mahan, 2026-11-10); then today's phone step for a plan with
 * texts; then Searches with the welcome toast. On the tokens. The page's main heading is the logo
 * (LogoLockup's h1), so the steps' headings are h2.
 *
 * Code review: the Terms and Privacy Policy are agreed here, as today's sign-up asked (an invited
 * person otherwise agrees to nothing); the agreement and the first visit are recorded in the
 * account's metadata with the password, so /welcome does not open again.
 */
export const WELCOME_FLOW_WORDS = {
  expiredHeading: 'This invitation link has expired or was already used',
  expiredLede: 'Invitation links work for 24 hours, and only once.',
  expiredSignedUp: "If you've already set a password, sign in.",
  expiredNew:
    "Otherwise, reply to your invitation email or write to support@grailseeker.io and we'll send a new one.",
  passwordHeading: 'Set your password',
  short: 'Choose a longer password, at least 8 characters.',
  weak: 'Choose a stronger password. That one is too easy to guess.',
  same: 'That is already your password. Choose a different one.',
  notSaved: 'Your password could not be saved. Try again.',
  terms: 'Agree to the Terms of Service and Privacy Policy to continue.',
  planUnread: "Your password is saved. We couldn't load your plan just now.",
} as const

export const AFTER_WELCOME = '/searches?welcome=invited'

const FIELD =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 pr-16 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm'
const PRIMARY =
  'inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline disabled:cursor-not-allowed disabled:opacity-50'
const HEADING = 'text-[22px] font-bold leading-tight text-ink'

type ProviderError = { code?: string; message?: string; name?: string; status?: number } | null

/** The provider's refusal of a password, in plain words. */
export function passwordRefusalWords(error: ProviderError): string {
  if (error?.code === 'same_password') return WELCOME_FLOW_WORDS.same
  if (error?.code === 'weak_password' || /password should|weak/i.test(error?.message ?? '')) {
    return /at least \d+ characters/i.test(error?.message ?? '')
      ? WELCOME_FLOW_WORDS.short
      : WELCOME_FLOW_WORDS.weak
  }
  return WELCOME_FLOW_WORDS.notSaved
}

function sessionEnded(error: ProviderError): boolean {
  return error?.name === 'AuthSessionMissingError' || error?.status === 401
}

function ExpiredInvitation() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>{WELCOME_FLOW_WORDS.expiredHeading}</h2>
        <p className="text-[15px] text-ink">{WELCOME_FLOW_WORDS.expiredLede}</p>
      </div>
      <div className="flex flex-col gap-3 rounded-card border border-line-strong bg-surface p-4">
        <p className="text-[15px] text-ink">{WELCOME_FLOW_WORDS.expiredSignedUp}</p>
        <Link href="/login" className={PRIMARY}>
          Sign in
        </Link>
        <p className="text-[15px] text-ink">{WELCOME_FLOW_WORDS.expiredNew}</p>
      </div>
    </div>
  )
}

export function WelcomeFlow({ email, expired }: { email: string | null; expired: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<'password' | 'plan-unread' | 'phone'>('password')
  const [planName, setPlanName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null)

  if (expired) return <ExpiredInvitation />

  const toSearches = () => {
    router.push(AFTER_WELCOME)
    router.refresh()
  }

  /** The phone step for a plan with texts; Searches otherwise. Busy stays on while navigating. */
  const next = async () => {
    setBusy(true)
    setError(null)
    try {
      const account = await accountAPI.getEntitlement()
      if (account.plan && account.plan.textsIncluded) {
        setPlanName(account.plan.name)
        setStep('phone')
        setBusy(false)
        return
      }
      toSearches()
    } catch (e) {
      // A lost session: the API client is already on its way to sign-in.
      if (e instanceof APIError && e.status === 401) return
      setStep('plan-unread')
      setBusy(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    if (password.length < 8) return setError(WELCOME_FLOW_WORDS.short)
    if (!agreed) return setError(WELCOME_FLOW_WORDS.terms)
    setBusy(true)
    const now = new Date().toISOString()
    const supabase = createClient()
    const { error: saveError } = await supabase.auth.updateUser({
      password,
      data: { welcomed_at: now, terms_accepted_at: now },
    })
    if (saveError) {
      if (sessionEnded(saveError)) {
        router.push('/login')
        return
      }
      setError(passwordRefusalWords(saveError))
      setBusy(false)
      return
    }
    await next()
  }

  if (step === 'phone') return <PhoneStep planName={planName} onDone={toSearches} />

  if (step === 'plan-unread') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className={HEADING}>{WELCOME_FLOW_WORDS.passwordHeading}</h2>
        <p role="alert" className="text-[15px] text-ink">
          {WELCOME_FLOW_WORDS.planUnread}
        </p>
        <button type="button" onClick={next} disabled={busy} className={PRIMARY}>
          {busy ? 'Trying…' : 'Try again'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>{WELCOME_FLOW_WORDS.passwordHeading}</h2>
        {email && <p className="text-[15px] text-muted-foreground">For {email}</p>}
      </div>
      {error && (
        <div role="alert" className="rounded-md border border-danger bg-surface p-3 text-sm text-danger">
          {error}
        </div>
      )}
      <form onSubmit={handleSave} aria-label="Set your password" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="welcome-password" className="text-sm font-medium text-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="welcome-password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className={FIELD}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-medium text-link hover:underline"
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 flex-shrink-0 rounded border-line-strong text-primary focus:ring-2 focus:ring-ring"
          />
          <span>
            I agree to the{' '}
            <button type="button" onClick={() => setLegal('terms')} className="text-link hover:underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" onClick={() => setLegal('privacy')} className="text-link hover:underline">
              Privacy Policy
            </button>
            .
          </span>
        </label>
        <button type="submit" disabled={busy || password.length < 8 || !agreed} className={PRIMARY}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
      <LegalModal isOpen={legal === 'terms'} onClose={() => setLegal(null)} title="Terms of Service">
        <TermsContent />
      </LegalModal>
      <LegalModal isOpen={legal === 'privacy'} onClose={() => setLegal(null)} title="Privacy Policy">
        <PrivacyContent />
      </LegalModal>
    </div>
  )
}

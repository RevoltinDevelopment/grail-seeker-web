'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PhoneStep } from '@/components/auth/PhoneStep'
import { accountAPI } from '@/lib/api/account'
import { createClient } from '@/lib/supabase/client'

/**
 * Story 1.89 (U-09): an invited person's first visit, after /auth/confirm signed them in. Drawn
 * from front-door-password.html's "payer: reset" (one password field with Show) and "reset:
 * expired", worded for an invitation (Mahan, 2026-11-10); then today's phone step for a plan with
 * texts; then Searches with the welcome toast. On the tokens.
 */
export const WELCOME_FLOW_WORDS = {
  expiredHeading: 'This invitation link has expired or was already used',
  expiredLede: 'Invitation links work for 24 hours, and only once.',
  expiredSignedUp: "If you've already set a password, sign in.",
  expiredNew:
    "Otherwise, reply to your invitation email or write to support@grailseeker.io and we'll send a new one.",
  passwordHeading: 'Set your password',
  weak: 'Choose a longer password, at least 8 characters.',
  notSaved: 'Your password could not be saved. Try again.',
} as const

export const AFTER_WELCOME = '/searches?welcome=invited'

const FIELD =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 pr-16 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm'
const PRIMARY =
  'inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline disabled:cursor-not-allowed disabled:opacity-50'

/** The provider's refusal of a password, in plain words. */
export function passwordRefusalWords(error: { code?: string; message?: string } | null): string {
  if (error?.code === 'weak_password' || /password should/i.test(error?.message ?? '')) {
    return WELCOME_FLOW_WORDS.weak
  }
  return WELCOME_FLOW_WORDS.notSaved
}

function ExpiredInvitation() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold leading-tight text-ink">
          {WELCOME_FLOW_WORDS.expiredHeading}
        </h1>
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
  const [step, setStep] = useState<'password' | 'phone'>('password')
  const [planName, setPlanName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (expired) return <ExpiredInvitation />

  const toSearches = () => {
    router.push(AFTER_WELCOME)
    router.refresh()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError(WELCOME_FLOW_WORDS.weak)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error: saveError } = await supabase.auth.updateUser({ password })
    if (saveError) {
      setError(passwordRefusalWords(saveError))
      setSaving(false)
      return
    }
    // The phone step, for a plan with texts. A read that fails still offers it (a texts plan must
    // not lose its number to a slow read); no plan at all goes to Searches.
    let textsPlan: { name: string } | null | 'unknown' = 'unknown'
    try {
      const account = await accountAPI.getEntitlement()
      textsPlan = account.plan && account.plan.textsIncluded ? { name: account.plan.name } : null
    } catch {
      textsPlan = 'unknown'
    }
    setSaving(false)
    if (textsPlan === null) {
      toSearches()
      return
    }
    setPlanName(textsPlan === 'unknown' ? null : textsPlan.name)
    setStep('phone')
  }

  if (step === 'phone') return <PhoneStep planName={planName} onDone={toSearches} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-bold leading-tight text-ink">
          {WELCOME_FLOW_WORDS.passwordHeading}
        </h1>
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
        <button type="submit" disabled={saving || password.length < 8} className={PRIMARY}>
          {saving ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  )
}

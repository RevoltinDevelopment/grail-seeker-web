'use client'

import { useEffect, useRef, useState } from 'react'

import { PhoneInput } from '@/components/ui/PhoneInput'
import { updateUserPreferences } from '@/lib/api/user'
import { createClient } from '@/lib/supabase/client'

/**
 * Story 1.89 (U-09): today's phone step, moved out of the sign-up flow so an invited person (and,
 * later, U-21's sign-up) can take it after setting a password. The words and the behaviour are
 * the sign-up's (Session 4 keeps them: "The consent words are today's"): the number, the texting
 * consent, then the six-digit code with a 60-second resend countdown. The number is added with
 * updateUser({ phone }), which sends the code; the code is checked with verifyOtp
 * ('phone_change'); the consent is recorded afterwards, non-blocking. On the tokens, as every new
 * file is.
 */
export const RESEND_SECONDS = 60

const FIELD =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm'
const PRIMARY =
  'inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50'

export function PhoneStep({
  planName,
  onDone,
  className = '',
}: {
  /** The plan that texts, named in the first line. */
  planName?: string | null
  /** The number is verified (and the consent recorded, or its failure logged). */
  onDone: () => void
  className?: string
}) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    []
  )

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timer.current) clearInterval(timer.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Phone number is required')
      return
    }
    if (!agreed) {
      setError('You must agree to receive SMS notifications')
      return
    }
    setLoading(true)
    const supabase = createClient()
    // Adding the number sends the code
    const { error: updateError } = await supabase.auth.updateUser({ phone: phoneNumber })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setStep('verify')
    setLoading(false)
    startCountdown()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: code,
      type: 'phone_change',
    })
    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }
    // Record SMS consent timestamp and IP address (TCPA compliance)
    try {
      await updateUserPreferences({ smsConsentGiven: true })
    } catch (consentError) {
      console.error('Failed to record SMS consent (non-blocking):', consentError)
    }
    setLoading(false)
    onDone()
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      phone: phoneNumber,
      type: 'phone_change',
    })
    setLoading(false)
    if (resendError) {
      setError(resendError.message)
      return
    }
    startCountdown()
  }

  const errorLine = error && (
    <div role="alert" className="rounded-md border border-danger bg-surface p-3 text-sm text-danger">
      {error}
    </div>
  )

  if (step === 'phone') {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div className="flex flex-col gap-2">
          <h2 className="text-[22px] font-bold leading-tight text-ink">Where should we text your matches?</h2>
          <p className="text-[15px] text-ink">
            {planName ? `Your ${planName} plan texts` : 'Your plan texts'} you the moment we find a
            match, so we need a mobile number that can receive texts. We'll send a code to check
            it.
          </p>
        </div>
        {errorLine}
        <form onSubmit={handlePhoneSubmit} aria-label="Your phone" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="signup-phone" className="text-sm font-medium text-ink">
              Phone Number
            </label>
            <PhoneInput value={phoneNumber} onChange={setPhoneNumber} required />
          </div>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 flex-shrink-0 rounded border-line-strong text-primary focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs text-ink">
              <strong className="font-semibold">TCPA Consent Required:</strong> I understand that
              Grail Seeker is an <strong className="font-semibold">SMS delivery service</strong>.
              This service delivers search results{' '}
              <strong className="font-semibold">exclusively via SMS text messages</strong> to the
              phone number provided. By checking this box, I provide{' '}
              <strong className="font-semibold">express written consent</strong> to receive
              automated text message deliveries from Grail Seeker IO, LLC.
              <br />
              <br />I acknowledge that:
              <ul className="ml-4 mt-1 list-disc space-y-1">
                <li>Message frequency varies based on my search criteria</li>
                <li>Standard message and data rates may apply</li>
                <li>I can opt-out by texting STOP at any time</li>
                <li>I can text HELP for assistance</li>
              </ul>
            </span>
          </label>

          <button type="submit" disabled={loading || !phoneNumber || !agreed} className={PRIMARY}>
            {loading ? 'Sending code…' : 'Send code'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-[22px] font-bold leading-tight text-ink">Verify Your Phone</h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-ink">{phoneNumber}</span>
        </p>
      </div>
      {errorLine}
      <form onSubmit={handleVerify} aria-label="Enter the code" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="verification-code" className="text-sm font-medium text-ink">
            Verification Code
          </label>
          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            className={`${FIELD} text-center text-2xl tracking-widest`}
            autoFocus
          />
          <p className="text-center text-xs text-muted-foreground">
            Enter the 6-digit code from your SMS
          </p>
        </div>
        <button type="submit" disabled={loading || code.length !== 6} className={PRIMARY}>
          {loading ? 'Verifying…' : 'Verify Phone Number'}
        </button>
      </form>
      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || loading}
          className="text-sm text-link hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code? Resend"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setStep('phone')
          setCode('')
          setError(null)
        }}
        className="w-full text-sm text-muted-foreground hover:text-ink"
      >
        &larr; Change phone number
      </button>
    </div>
  )
}

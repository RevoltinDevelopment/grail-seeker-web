'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import {
  DOOR_CARD,
  DOOR_FIELD,
  DOOR_H1,
  DOOR_LABEL,
  DOOR_LEDE,
  DOOR_LINK,
  DOOR_OUTLINE,
  DOOR_PRIMARY,
  DoorNotice,
} from '@/components/auth/Door'
import { AUTH_WORDS, FORGOT_WORDS, forgotOutcome } from '@/lib/auth/authErrorWords'
import { PAY_FIRST_SIGNUP } from '@/lib/front-door'
import { createClient } from '@/lib/supabase/client'

/**
 * Story 1.106 (U-18): asking for a link to set a password (front-door-password.html: "forgot",
 * "forgot: sent", "reset: expired"). It never says whether the email has an account (AC 3): every
 * answer but a lost connection is "Check your email" (lib/auth/authErrorWords.ts, forgotOutcome).
 *
 * The email's link goes through /auth/confirm once Mahan has changed the Reset Password template
 * (the story's steps); `redirectTo` is what the old template uses until then.
 */
export const RESEND_SECONDS = 60

function mmss(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

async function requestLink(email: string): Promise<unknown> {
  try {
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return error
  } catch (thrown) {
    return thrown
  }
}

export function SendLinkForm({ variant }: { variant: 'forgot' | 'expired' }) {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [notice, setNotice] = useState<'offline' | null>(null)
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(0)
  const [resent, setResent] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  // Code review: set at once, so a fast double press can't send two emails
  const inFlight = useRef(false)

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    []
  )

  const startCountdown = () => {
    setLeft(RESEND_SECONDS)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          if (timer.current) clearInterval(timer.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const send = async (address: string, again: boolean) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setNotice(null)
    const outcome = forgotOutcome(await requestLink(address))
    inFlight.current = false
    setBusy(false)
    if (outcome !== 'sent') {
      setNotice(outcome)
      return
    }
    setSentTo(address)
    setResent(again)
    startCountdown()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void send(email.trim(), false)
  }

  const noticeBox = notice && <DoorNotice tone="attention" words={AUTH_WORDS.offline} />
  const backToSignIn = (
    <p className="text-center text-[15px]">
      <Link href="/login" className={DOOR_LINK}>
        Back to sign in
      </Link>
    </p>
  )

  if (sentTo) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-info-icon">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </span>
          <h1 className={DOOR_H1}>{FORGOT_WORDS.sentHeading}</h1>
          <p role="status" className={DOOR_LEDE}>
            {FORGOT_WORDS.sent(sentTo)}
          </p>
        </div>
        {noticeBox}
        <div className={DOOR_CARD}>
          <p className="text-[15px] text-ink">{FORGOT_WORDS.nothing}</p>
          <button
            type="button"
            onClick={() => void send(sentTo, true)}
            disabled={busy || left > 0}
            className={DOOR_OUTLINE}
          >
            {busy ? 'Sending…' : 'Send it again'}
          </button>
          {left > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              You can ask again in {mmss(left)}.
            </p>
          )}
          {resent && (
            <p role="status" className="text-center text-sm text-muted-foreground">
              {FORGOT_WORDS.resent}
            </p>
          )}
        </div>
        {backToSignIn}
      </div>
    )
  }

  const forgot = variant === 'forgot'
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className={DOOR_H1}>{forgot ? FORGOT_WORDS.heading : FORGOT_WORDS.expiredHeading}</h1>
        <p className={DOOR_LEDE}>{forgot ? FORGOT_WORDS.lede : FORGOT_WORDS.expiredLede}</p>
      </div>
      {noticeBox}
      <form
        onSubmit={handleSubmit}
        aria-label={forgot ? 'Reset your password' : 'Send a new link'}
        className={DOOR_CARD}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="link-email" className={DOOR_LABEL}>
            Email
          </label>
          <input
            id="link-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className={DOOR_FIELD}
          />
        </div>
        <button type="submit" disabled={busy} className={DOOR_PRIMARY}>
          {busy ? 'Sending…' : forgot ? 'Send link' : 'Send a new link'}
        </button>
        {forgot && PAY_FIRST_SIGNUP && (
          <p className="text-sm text-muted-foreground">{FORGOT_WORDS.payerFine}</p>
        )}
      </form>
      {backToSignIn}
    </div>
  )
}

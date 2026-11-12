'use client'

import { useState } from 'react'

import { APIError } from '@/lib/api/client'
import { joinWaitlist, type WaitlistJoinResult } from '@/lib/api/waitlist'

/**
 * Story 1.89 (U-09): until launch, the sign-in page's second tab is the waitlist (Decision #99),
 * as drawn in front-door-waitlist.html ("waitlist", "waitlist: joined", "waitlist: already on
 * it"), in the words Mahan approved on 2026-11-10 for a tab with no search or plan to keep. An
 * email only; it never says whether the address has an account, because the route does not.
 */
export const WAITLIST_WORDS = {
  heading: 'Our subscriber list is full right now',
  paragraph: "We open new spots in small batches. Leave your email and we'll keep your place in line.",
  fine: 'The same list as the one on grailseeker.io. One place per email.',
  joined: (email: string) =>
    `You're on the list. When a spot opens, we'll email ${email} a link that picks up right here.`,
  already: "You were already on the list, and your place hasn't changed.",
  offline: "You're offline. Check your connection and try again.",
  failed: 'We could not save your place just now. Please try again.',
} as const

/**
 * What a refused join says: the server's own words for what it explains; offline only when the
 * browser says it is offline (a down server is a TypeError too, and is not the visitor's fault).
 */
export function joinRefusalWords(error: unknown, online = typeof navigator === 'undefined' || navigator.onLine): string {
  if (error instanceof APIError) {
    if (error.code === 'INVALID_EMAIL' || error.code === 'RATE_LIMITED') return error.message
    return WAITLIST_WORDS.failed
  }
  if (error instanceof TypeError && !online) return WAITLIST_WORDS.offline
  return WAITLIST_WORDS.failed
}

export function WaitlistJoin({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [badAddress, setBadAddress] = useState(false)
  const [done, setDone] = useState<{ result: WaitlistJoinResult; email: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBadAddress(false)
    setSending(true)
    try {
      const result = await joinWaitlist(email.trim())
      setDone({ result, email: email.trim() })
    } catch (err) {
      setError(joinRefusalWords(err))
      setBadAddress(err instanceof APIError && err.code === 'INVALID_EMAIL')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        {/* h2: the page's main heading is the logo (LogoLockup's h1) */}
        <h2 className="text-[22px] font-bold leading-tight text-ink">{WAITLIST_WORDS.heading}</h2>
        <p className="text-[15px] text-ink">{WAITLIST_WORDS.paragraph}</p>
      </div>

      {done ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-card border border-line-strong bg-surface p-4 text-[15px] text-ink"
        >
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
            className="mt-0.5 flex-none text-ok"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>
            {done.result === 'joined' ? WAITLIST_WORDS.joined(done.email) : WAITLIST_WORDS.already}
          </span>
        </p>
      ) : (
        <form onSubmit={handleSubmit} aria-label="Join the waitlist" className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="waitlist-email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="waitlist-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={badAddress ? true : undefined}
              aria-describedby={error ? 'waitlist-error' : undefined}
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
            />
          </div>
          {error && (
            <p id="waitlist-error" role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending || email.trim() === ''}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Joining…' : 'Join the waitlist'}
          </button>
        </form>
      )}

      <p className="text-[13px] text-muted-foreground">{WAITLIST_WORDS.fine}</p>
    </div>
  )
}

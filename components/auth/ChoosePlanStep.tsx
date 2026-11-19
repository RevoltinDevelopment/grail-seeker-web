'use client'

import { useState } from 'react'

import { DOOR_H1, DOOR_LEDE, DOOR_PRIMARY } from '@/components/auth/Door'
import { joinRefusalWords } from '@/components/auth/WaitlistJoin'
import { joinWaitlist } from '@/lib/api/waitlist'

/**
 * Story 1.106 (U-18, need 39): the no-plan guard, while sales are closed (front-door-no-plan.html,
 * "no plan: sales closed", "no plan: waitlist joined"). An account with no plan comes here on every
 * sign-in, and nowhere else. Its one way on is the waitlist, with the email already known.
 *
 * No plan cards yet: there is no GET /api/plans to draw them from, and with sales closed they would
 * show prices nobody can pay. They, "Continue to payment" and Check and pay come with U-21 and S-19
 * (lib/front-door.ts, SALES_OPEN). The joined words leave out the drawn "with your choice of {plan}"
 * because the waitlist keeps only the email (Mahan, 2026-11-19, question D).
 */
export const CHOOSE_PLAN_WORDS = {
  heading: 'Choose a plan to start searching',
  lede: "Your account doesn't have a plan yet.",
  searches: (n: number) =>
    n === 1
      ? 'Your search is kept just as it is.'
      : `Your ${n} searches are kept just as they are.`,
  fullHeading: 'Our subscriber list is full right now',
  full: 'We open new spots in small batches, so every search is checked on time.',
  joined: (email: string) => `You're on the list. When a spot opens, we'll email ${email}.`,
  already: (email: string) =>
    `You were already on the list, and your place hasn't changed. When a spot opens, we'll email ${email}.`,
} as const

export function ChoosePlanStep({
  email,
  searchCount,
}: {
  email: string
  searchCount: number | null
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'joined' | 'already_on_list' | null>(null)

  const join = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      setDone(await joinWaitlist(email))
    } catch (err) {
      setError(joinRefusalWords(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className={DOOR_H1}>{CHOOSE_PLAN_WORDS.heading}</h1>
        <p className={DOOR_LEDE}>
          {CHOOSE_PLAN_WORDS.lede}
          {searchCount ? ` ${CHOOSE_PLAN_WORDS.searches(searchCount)}` : ''}
        </p>
      </div>

      <section
        aria-labelledby="full-h"
        className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-card border border-attention-line bg-attention p-4 text-attention-ink"
      >
        <div className="pt-0.5 text-attention-line">
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
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5 text-[15px]">
          <h2 id="full-h" className="font-bold">
            {CHOOSE_PLAN_WORDS.fullHeading}
          </h2>
          <p>{CHOOSE_PLAN_WORDS.full}</p>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger bg-surface p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {done ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-card border border-line bg-surface p-4 text-[15px] text-ink"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 flex-shrink-0 text-ok"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>
            {done === 'joined' ? CHOOSE_PLAN_WORDS.joined(email) : CHOOSE_PLAN_WORDS.already(email)}
          </span>
        </p>
      ) : (
        <button type="button" onClick={join} disabled={busy} className={DOOR_PRIMARY}>
          {busy ? 'Joining…' : 'Join the waitlist'}
        </button>
      )}
    </div>
  )
}

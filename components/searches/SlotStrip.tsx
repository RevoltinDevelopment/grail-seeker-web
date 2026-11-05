'use client'

import Link from 'next/link'

import type { AccountSummary } from '@/lib/api/account'
import { BUILT_PAGES, PAGE_HREF } from '@/lib/built-pages'

/**
 * Story 1.83 (U-05): the slot strip under the Searches title (searches-home.html). The plan, its
 * slots, "View plan" once the plan page exists, a meter of one block per slot on one line, and one
 * sentence. Every number is the server's (the entitlement); an account with no plan shows none.
 */
type Seg = 'in' | 'paused' | 'free' | 'over'

const SEG_CLASS: Record<Seg, string> = {
  in: 'border-primary bg-primary',
  paused: 'border-muted-foreground bg-seg-other',
  free: 'border-muted-foreground bg-surface',
  over: 'seg-over',
}

/**
 * The slots to draw: what the account is entitled to, except while lapsed, when the server's
 * entitlement is 0 but the strip shows the plan's own slots, empty (searches-pause-held.html).
 */
export function planSlots(account: AccountSummary): number {
  if (account.status === 'lapsed' && account.plan)
    return account.plan.includedSlots + account.addonSlots
  return account.slots.entitled
}

export function meterSegments(account: AccountSummary): { kinds: Seg[]; limitAfter: number } {
  const { inUse } = account.slots
  const entitled = planSlots(account)
  const used: Seg[] = [...account.searches]
    .sort((a, b) => a.firstSlot - b.firstSlot)
    .flatMap((s) => Array<Seg>(s.slots).fill(s.isActive ? 'in' : 'paused'))
    .slice(0, inUse)
  const kinds: Seg[] = used.map((k, i) => (i < entitled ? k : 'over'))
  for (let i = kinds.length; i < entitled; i++) kinds.push('free')
  return { kinds, limitAfter: entitled }
}

export function slotSentence(account: AccountSummary): {
  text: string
  strong: boolean
  label: string
} {
  const { inUse, free, over } = account.slots
  const entitled = planSlots(account)
  const paused = account.searches.filter((s) => !s.isActive).reduce((n, s) => n + s.slots, 0)
  if (inUse === 0 && account.heldSearches.length > 0) {
    return {
      text: 'None in use while your searches are on hold.',
      strong: false,
      label: `No slots in use while your searches are on hold. Your plan has ${entitled}.`,
    }
  }
  if (over > 0) {
    return {
      text: `${inUse} in use, ${over} over your plan.`,
      strong: true,
      label: `${inUse} slots in use. Your plan has ${entitled}. ${over} over.`,
    }
  }
  return {
    text: `${inUse} in use, ${free} free.`,
    strong: false,
    label: `${inUse} of ${entitled} slots in use${paused > 0 ? `, ${paused} of them paused` : ''}.`,
  }
}

export function SlotStrip({ account }: { account: AccountSummary }) {
  if (!account.plan) return null
  const { kinds, limitAfter } = meterSegments(account)
  const sentence = slotSentence(account)
  return (
    <section
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-line bg-surface px-5 py-4 text-[15px] shadow-sm"
      aria-label="Your slots"
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-bold text-ink">{account.plan.name} plan</span>
        <span className="text-ink">
          {planSlots(account)} {planSlots(account) === 1 ? 'slot' : 'slots'}
        </span>
        {BUILT_PAGES.plan && (
          <Link href={PAGE_HREF.plan} className="text-link">
            View plan
          </Link>
        )}
      </div>
      <div
        className="flex min-w-0 flex-nowrap items-center gap-1"
        role="img"
        aria-label={sentence.label}
      >
        {kinds.map((kind, i) => (
          <span key={i} className="contents">
            {i === limitAfter && (
              <span className="mx-1 h-[26px] w-0.5 rounded-sm bg-ink" data-testid="limit" />
            )}
            <span
              className={`h-[14px] min-w-[5px] shrink basis-[22px] rounded-[3px] border-[1.5px] ${SEG_CLASS[kind]}`}
              data-seg={kind}
            />
          </span>
        ))}
        {limitAfter >= kinds.length && (
          <span className="mx-1 h-[26px] w-0.5 rounded-sm bg-ink" data-testid="limit" />
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {sentence.strong ? <strong className="text-ink">{sentence.text}</strong> : sentence.text}
        {sentence.strong && ' Nothing has been stopped.'}
      </p>
    </section>
  )
}

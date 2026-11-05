import type { AccountSummary } from '@/lib/api/account'
import { BUILT_PAGES, PAGE_HREF } from '@/lib/built-pages'

import type { GrailSearch } from '@/types/search.types'

/**
 * Story 1.83 (U-05): which attention banner the Searches page shows, and its words. One at a time:
 * the lowest-numbered state that applies (UX plan section 10; attention-banner-states.html, whose
 * words are the specification). Account banners cannot be dismissed; only the marketplace nudge
 * (state 9) can, for the session.
 *
 * "You cannot add or widen a search" is said only while the server enforces the limit
 * (enforcement 'enforce'); at 'observe' it would not be true, so state 8 waits and state 7 leaves
 * that clause out (Story 1.83).
 *
 * States 1, 2 and 4 need facts billing will give (S-21): the lapse's cause, the grace and deletion
 * dates. They are chosen only when `billing` carries them, which nothing does yet.
 */

/** The marketplace nudge's dismissal, for the session (Searches; the plan page honours it too, Story 1.85) */
export const NUDGE_DISMISS_KEY = 'platform-nudge-dismissed'

export type BannerTone = 'hold' | 'attention' | 'info'

export interface BannerAction {
  label: string
  href: string
  filled: boolean
}

export interface Banner {
  state: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  tone: BannerTone
  heading: string
  paragraphs: string[]
  action: BannerAction | null
  /** "7 days left", beside the button */
  due: string | null
  dismissible: boolean
}

/** Facts billing will add (S-21). Absent today. */
export interface BillingFacts {
  lapseCause?: 'payment_failed' | 'ended'
  endedAt?: string
  graceEndsAt?: string
  deleteSearchesAt?: string
}

export interface BannerInput {
  account: AccountSummary | null
  searches: readonly Pick<GrailSearch, 'id' | 'isActive' | 'platforms' | 'held'>[]
  defaultEnabledSlugs: readonly string[]
  nudgeDismissed: boolean
  now?: Date
  billing?: BillingFacts
}

// Deadlines are set as the start of a day in Eastern time, when the rounds run; they read in Eastern.
const ZONE = 'America/New_York'
// A deadline is a moment (a pick's is the start of a day, Eastern; Story 1.76). "By <day>" and
// "the date to choose was <day>" name the last day to act, so a deadline at midnight reads as the
// day before it (review, 2026-11-04). "On <day>" names the day things change: the deadline's own.
const beforeDeadline = (iso: string) => new Date(new Date(iso).getTime() - 1).toISOString()
const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone: ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: ZONE, month: 'short', day: 'numeric' })

/** Whole days from now to the deadline, never below 0: "7 days left", "1 day left". */
export function daysLeft(dueIso: string, now: Date): string {
  const days = Math.max(0, Math.ceil((new Date(dueIso).getTime() - now.getTime()) / 86_400_000))
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function action(
  page: keyof typeof BUILT_PAGES,
  label: string,
  filled: boolean
): BannerAction | null {
  return BUILT_PAGES[page] ? { label, href: PAGE_HREF[page], filled } : null
}

function* bannersOf(input: BannerInput): Generator<Banner> {
  const { account, billing } = input
  const now = input.now ?? new Date()
  const change = account?.change ?? null
  const enforced = account?.enforcement === 'enforce'
  const planSlots = account?.slots.entitled ?? 0
  // Every search's slots, held ones included: state 3's "your searches use 8", when every search is
  // held. State 5 uses the strip's own number (in use), so the page never shows two counts.
  const allSlots = account
    ? account.searches.reduce((n, s) => n + s.slots, 0) +
      account.heldSearches.reduce((n, s) => n + s.slots, 0)
    : 0

  // 1. On hold: payment failed (billing)
  if (
    account?.status === 'lapsed' &&
    billing?.lapseCause === 'payment_failed' &&
    billing.deleteSearchesAt
  ) {
    yield {
      state: 1,
      tone: 'hold',
      heading: 'Your searches are on hold',
      paragraphs: [
        `Your last payment did not go through. Update your payment details by ${longDay(beforeDeadline(billing.deleteSearchesAt))} and every search starts again, just as you left it. After that, your searches are deleted.`,
      ],
      action: action('plan', 'Update payment details', true),
      due: null,
      dismissible: false,
    }
  }

  // 2. On hold: subscription ended (billing)
  if (
    account?.status === 'lapsed' &&
    billing?.lapseCause === 'ended' &&
    billing.endedAt &&
    billing.deleteSearchesAt
  ) {
    yield {
      state: 2,
      tone: 'hold',
      heading: 'Your searches are on hold',
      paragraphs: [
        `Your subscription ended on ${shortDay(billing.endedAt)}. Choose a plan by ${longDay(beforeDeadline(billing.deleteSearchesAt))} and every search starts again, just as you left it. After that, your searches are deleted.`,
      ],
      action: action('plan', 'Choose a plan', true),
      due: null,
      dismissible: false,
    }
  }

  // 3. On hold: the date to choose has passed
  if (change?.kind === 'pick_needed' && change.overdue && change.dueAt) {
    yield {
      state: 3,
      tone: 'hold',
      heading: 'Your searches are on hold until you choose',
      paragraphs: [
        `Your plan has ${change.slotsToFit} slots and your searches use ${allSlots}. The date to choose was ${shortDay(beforeDeadline(change.dueAt))}, so every search is on hold. Choose the searches to keep and they start again.`,
        'Nothing has been deleted.',
      ],
      action: action('pick', 'Choose searches', true),
      due: null,
      dismissible: false,
    }
  }

  // 4. Payment failed: grace (billing)
  if (account?.status === 'grace' && billing?.graceEndsAt) {
    yield {
      state: 4,
      tone: 'attention',
      heading: 'Your last payment did not go through',
      paragraphs: [
        `Update your payment details by ${longDay(beforeDeadline(billing.graceEndsAt))} and nothing changes. Every search keeps running until then.`,
      ],
      action: action('plan', 'Update payment details', true),
      due: daysLeft(billing.graceEndsAt, now),
      dismissible: false,
    }
  }

  if (change?.kind === 'pick_needed' && !change.overdue) {
    const picked = change.pickedSearchIds !== null
    // 5. Choose what to keep: no choice yet
    if (!picked) {
      const welcome = change.reason === 'return'
      if (!change.dueAt) {
        // A return pick has no deadline (Migration 074): nothing is said about a date.
        yield {
          state: 5,
          tone: 'attention',
          heading: welcome ? 'Welcome back.' : 'Choose which searches to keep',
          paragraphs: [
            `Your plan now has ${change.slotsToFit} slots and your searches use ${account!.slots.inUse}. Choose the searches to keep.`,
          ],
          action: action('pick', 'Choose searches', true),
          due: null,
          dismissible: false,
        }
      } else {
        yield {
          state: 5,
          tone: 'attention',
          heading: welcome ? 'Welcome back.' : 'Choose which searches to keep',
          paragraphs: [
            `Your plan now has ${change.slotsToFit} slots and your searches use ${account!.slots.inUse}. Choose the searches to keep by ${longDay(beforeDeadline(change.dueAt))}. Every search keeps running until then.`,
            'If you have not chosen by then, every search goes on hold until you do.',
          ],
          action: action('pick', 'Choose searches', true),
          due: daysLeft(change.dueAt, now),
          dismissible: false,
        }
      }
    } else if (change.dueAt) {
      // 6. Choose what to keep: chosen, date not reached
      // Searches coming back on the day (held, picked to return) continue too (review).
      const continuing =
        account!.searches.filter((s) => s.fate === 'continues').length +
        account!.heldSearches.filter((s) => s.fate === 'returns').length
      const stopping = account!.searches.filter((s) => s.fate === 'stops').length
      yield {
        state: 6,
        tone: 'info',
        heading: 'You have chosen what to keep',
        paragraphs: [
          `On ${longDay(change.dueAt)}, ${plural(continuing, 'search continues', 'searches continue')} and ${stopping} ${stopping === 1 ? 'stops' : 'stop'}. Every search runs until then, and you can change your choice before that date.`,
        ],
        action: action('pick', 'Change my choice', false),
        due: daysLeft(change.dueAt, now),
        dismissible: false,
      }
    }
  }

  // 7. Downgrade on its way
  if (change?.kind === 'downgrade_pending') {
    // Searches coming back on the day (held, picked to return) continue too (review).
    const continuing =
      account!.searches.filter((s) => s.fate === 'continues').length +
      account!.heldSearches.filter((s) => s.fate === 'returns').length
    const stopping = account!.searches.filter((s) => s.fate === 'stops').length
    yield {
      state: 7,
      tone: 'info',
      heading: `Your move to ${change.plan.name} is on ${shortDay(change.effectiveAt)}`,
      paragraphs: [
        `On that date, ${plural(continuing, 'search continues', 'searches continue')} and ${stopping} ${stopping === 1 ? 'stops' : 'stop'}. ${
          enforced
            ? `Until then every search runs, but you cannot add or widen a search beyond ${change.slots} slots.`
            : 'Until then every search runs.'
        }`,
      ],
      action: action('plan', 'View plan', false),
      due: null,
      dismissible: false,
    }
  }

  // 8. Over plan, nothing to choose
  if (account && enforced && account.slots.over > 0 && !change) {
    yield {
      state: 8,
      tone: 'info',
      heading: 'Your searches use more slots than your plan',
      paragraphs: [
        `Your plan has ${planSlots} slots and your searches use ${account.slots.inUse}. Nothing has been stopped, but you cannot add or widen a search until you are back within ${planSlots}.`,
      ],
      action: action('plan', 'View plan', false),
      due: null,
      dismissible: false,
    }
  }

  // 9. A marketplace is turned off (moved from the Dashboard; dismissible for the session)
  if (!input.nudgeDismissed) {
    const affected = input.searches.filter(
      (s) =>
        s.isActive && !s.held && input.defaultEnabledSlugs.some((p) => !s.platforms?.includes(p))
    ).length
    if (affected > 0) {
      yield {
        state: 9,
        tone: 'info',
        heading: 'You may be missing matches',
        paragraphs: [
          `${affected} of your searches ${affected === 1 ? 'has' : 'have'} a marketplace turned off. You may be missing matches for your grails.`,
        ],
        action: { label: 'Review searches', href: '#your-searches', filled: false },
        due: null,
        dismissible: true,
      }
    }
  }
}

/**
 * Story 1.85: every banner that applies, in the banner's order. The plan page's "Needs your
 * attention" lists them all (plan-page.js); the Searches page shows the first.
 */
export function listBanners(input: BannerInput): Banner[] {
  return [...bannersOf(input)]
}

export function chooseBanner(input: BannerInput): Banner | null {
  return bannersOf(input).next().value ?? null
}

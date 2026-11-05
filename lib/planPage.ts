import { gradeText } from '@/components/searches/SearchCard'
import type { AccountSummary, NumberedSearchView } from '@/lib/api/account'
import { slotsWord } from '@/lib/slots'
import { formatIssueNumber } from '@/lib/utils/series-formatter'
import type { GrailSearch } from '@/types/search.types'

/**
 * Story 1.85 (S-10): the plan page's words and numbers (plan-page.js, the approved design; UX plan
 * section 12), worked out from the entitlement and the searches list. The numbers are the server's;
 * this only words them and puts them in order.
 *
 * A lapse's cause comes with billing (S-21): until then the page says only what is known (as the
 * search card does, Story 1.83). Words that describe the limit ("you can use 5 slots for adding")
 * show only while it is enforced (Decision #109).
 */

const ZONE = 'America/New_York'
const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: ZONE, month: 'short', day: 'numeric' })
const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone: ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

/** As the search card titles it */
export function searchTitle(
  search: Pick<GrailSearch, 'series' | 'issueNumber' | 'issueVolumeText'>
): string {
  return `${search.series.title} ${formatIssueNumber(search.issueNumber, search.issueVolumeText)}`
}

export interface PlanFacts {
  name: string
  slots: string
  texts: string
  inUse: string
  free: string
  next: string | null
}

export function planFacts(
  account: AccountSummary,
  searches: readonly GrailSearch[]
): PlanFacts | null {
  if (!account.plan) return null
  const { plan, addonSlots, slots, change } = account
  const lapsed = account.status === 'lapsed'
  const total = plan.includedSlots + addonSlots
  let next: string | null = null
  let inUse = `${slots.inUse} of ${slots.entitled}`
  if (change?.kind === 'downgrade_pending') {
    next = `Moving to ${change.plan.name} on ${longDay(change.effectiveAt)}, with ${change.slots} slots.`
    inUse = String(slots.inUse)
  }
  if (lapsed) {
    // Review: the lapse's own date, not an earlier hold for a downgrade
    const since = searches
      .filter((s) => s.heldReason === 'lapse')
      .map((s) => s.heldAt)
      .filter((d): d is string => !!d)
      .sort()[0]
    next = since ? `On hold since ${shortDay(since)}.` : 'On hold.'
    inUse = 'None while on hold'
  }
  return {
    name: plan.name,
    slots: addonSlots ? `${total} (${plan.includedSlots} + ${addonSlots} add-on)` : String(total),
    texts: plan.textsIncluded ? 'Included' : 'Not included',
    inUse,
    free: String(lapsed ? total : slots.free),
    next,
  }
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: ZONE, month: 'short', day: 'numeric' })

export type Fate = { kind: 'continues' | 'stops' | 'undecided'; text: string }

/** What happens to a running search while a change is open; null when nothing is open. */
export function fateLine(account: AccountSummary, view: NumberedSearchView): Fate | null {
  const change = account.change
  if (!change) return null
  if (view.fate === 'continues')
    return {
      kind: 'continues',
      text:
        change.kind === 'downgrade_pending' ? `Continues on ${change.plan.name}.` : 'Continues.',
    }
  if (view.fate === 'stops')
    return {
      kind: 'stops',
      text: view.fateAt
        ? `Stops on ${shortDay(view.fateAt)}. It goes on hold, not deleted.`
        : 'Stops. It goes on hold, not deleted.',
    }
  if (view.fate === 'undecided' && view.fateAt)
    return {
      kind: 'undecided',
      text: `Runs until ${shortDay(view.fateAt)}. Keep it, or it stops then.`,
    }
  return null
}

export type SlotRow =
  | {
      kind: 'search'
      id: string
      number: string
      numberLabel: string
      title: string
      meta: string
      paused: string | null
      fate: Fate | null
      over: boolean
    }
  | { kind: 'line'; text: string }
  | { kind: 'free'; number: string; numberLabel: string; meta: string }

const numberOf = (first: number, last: number) =>
  first === last
    ? { number: String(first), numberLabel: `Slot ${first}` }
    : { number: `${first}–${last}`, numberLabel: `Slots ${first} to ${last}` }

/** Nothing to choose and more slots in use than the plan has: a line is drawn where the plan ends. */
const drawsLine = (account: AccountSummary) => !account.change && account.slots.over > 0

export function slotRows(account: AccountSummary, searches: readonly GrailSearch[]): SlotRow[] {
  const byId = new Map(searches.map((s) => [s.id, s]))
  const cap = account.slots.entitled
  // Code review: the line goes before the first search with a slot past the plan, whether it starts
  // there or crosses it (slots are numbered without gaps, so a search can straddle the limit), and
  // it is drawn even if that search is missing from the list for a moment.
  let lineDue = drawsLine(account)
  const rows: SlotRow[] = []
  for (const view of [...account.searches].sort((a, b) => a.firstSlot - b.firstSlot)) {
    const search = byId.get(view.searchId)
    if (lineDue && view.lastSlot > cap) {
      rows.push({ kind: 'line', text: `Your plan has ${cap} slots` })
      lineDue = false
    }
    if (!search) continue
    const keeps = view.slots === 1 ? 'slot' : 'slots'
    rows.push({
      kind: 'search',
      id: view.searchId,
      ...numberOf(view.firstSlot, view.lastSlot),
      title: searchTitle(search),
      meta: `${gradeText(search.gradeMin, search.gradeMax)} · ${
        search.gradingAuthority ? search.gradingAuthority.toUpperCase() : 'any grader'
      } · ${slotsWord(view.slots)}`,
      paused: view.isActive
        ? null
        : search.pausedAt
          ? `Paused by you on ${shortDate(search.pausedAt)}. It keeps its ${keeps} while paused.`
          : `Paused by you. It keeps its ${keeps} while paused.`,
      fate: fateLine(account, view),
      over: drawsLine(account) && view.lastSlot > cap,
    })
  }
  const { inUse, free } = account.slots
  if (free > 0) {
    rows.push({
      kind: 'free',
      ...numberOf(inUse + 1, cap),
      meta: `${slotsWord(free)} for new searches, or for wider grades`,
    })
  }
  return rows
}

export type MeterSeg = 'in' | 'paused' | 'free' | 'over'

export interface PlanMeter {
  inside: MeterSeg[]
  beyond: number
  legend: { seg: MeterSeg; text: string }[]
  label: string
}

/** The meter: while a choice is made, what continues first, then what stops (past the line). */
export function planMeter(account: AccountSummary): PlanMeter {
  const cap = account.slots.entitled
  const { inUse, over } = account.slots
  const change = account.change
  const numbered = [...account.searches].sort((a, b) => a.firstSlot - b.firstSlot)
  const keepList =
    change?.kind === 'downgrade_pending'
      ? change.keepSearchIds
      : change?.kind === 'pick_needed'
        ? (change.pickedSearchIds ?? [])
        : []
  const chosen = keepList.length > 0
  const kept = numbered.filter((s) => keepList.includes(s.searchId))
  const ordered = chosen
    ? [...kept, ...numbered.filter((s) => !keepList.includes(s.searchId))]
    : numbered
  const segs: MeterSeg[] = ordered.flatMap((s) =>
    Array<MeterSeg>(s.slots).fill(s.isActive ? 'in' : 'paused')
  )
  const keptSlots = kept.reduce((n, s) => n + s.slots, 0)
  const cut = chosen ? keptSlots : cap
  const inside = segs.slice(0, cut)
  const beyond = segs.length - inside.length
  while (inside.length < cap) inside.push('free')
  // Code review: the legend and the spoken summary count the free blocks the meter draws
  const drawnFree = inside.filter((k) => k === 'free').length

  const paused = numbered.filter((s) => !s.isActive).reduce((n, s) => n + s.slots, 0)
  const keptPaused = kept.filter((s) => !s.isActive).reduce((n, s) => n + s.slots, 0)
  const stopWhen =
    change?.kind === 'downgrade_pending'
      ? shortDay(change.effectiveAt)
      : change?.kind === 'pick_needed' && change.dueAt
        ? shortDay(change.dueAt)
        : ''
  const legend: { seg: MeterSeg; text: string }[] = [
    {
      seg: 'in',
      text: chosen ? `Continues · ${keptSlots - keptPaused}` : `Running · ${inUse - paused}`,
    },
  ]
  if (paused) legend.push({ seg: 'paused', text: `Paused, keeps its slot · ${paused}` })
  if (drawnFree) legend.push({ seg: 'free', text: `Free · ${drawnFree}` })
  if (chosen && beyond)
    legend.push({
      seg: 'over',
      text: stopWhen ? `Stop on ${stopWhen} · ${beyond}` : `Stop · ${beyond}`,
    })
  else if (over) legend.push({ seg: 'over', text: `Over your plan · ${over}` })

  return {
    inside,
    beyond,
    legend,
    label: `${slotsWord(inUse - paused)} running, ${paused} paused${drawnFree ? `, ${drawnFree} free` : ''}${
      over ? `, ${over} over your plan` : ''
    }. Your plan has ${cap}.`,
  }
}

export function slotsNote(account: AccountSummary): string {
  const change = account.change
  if (change?.kind === 'downgrade_pending') {
    const when = shortDay(change.effectiveAt)
    return account.enforcement === 'enforce'
      ? `From the moment you confirmed, you can use ${change.slots} slots for adding or widening a search. What happens on ${when} is shown on each search.`
      : `What happens on ${when} is shown on each search.`
  }
  if (change?.kind === 'pick_needed')
    return change.dueAt
      ? `Your plan now has ${change.slotsToFit} slots. What happens to each search on ${shortDay(change.dueAt)} is shown below.`
      : `Your plan now has ${change.slotsToFit} slots.`
  if (drawsLine(account))
    return 'Numbered in the order you added your searches. The numbers do not decide what stops: nothing stops unless you choose.'
  return 'Numbered in the order you added your searches. A paused search keeps its slots.'
}

/** A held search's line on the plan page: how it comes back. */
export function heldBackLine(
  account: AccountSummary,
  held: AccountSummary['heldSearches'][number]
): string {
  const free = account.slots.free
  if (held.fate === 'returns')
    return held.fateAt ? `Comes back on ${shortDay(held.fateAt)}.` : 'Comes back.'
  if (held.heldReason === 'lapse')
    return held.isActive
      ? 'Comes back, just as you left it, when your subscription is active again.'
      : 'Comes back paused, as you left it, when your subscription is active again.'
  // ROADMAP 000ad: "Bring it back" is not built; until it is, a search that would fit is deleted
  // and created again, at the cost of its alert history (Mahan, 2026-10-21)
  if (free >= held.slots)
    return `There is room for it now: it needs ${slotsWord(held.slots)} and you have ${free} free. To bring it back now, delete it and create it again. Its alert history does not carry over.`
  return `It needs ${slotsWord(held.slots)} and you have ${free} free. It comes back if you move to a plan with more slots.`
}

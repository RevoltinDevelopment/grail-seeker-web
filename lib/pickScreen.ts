import type { AccountSummary } from '@/lib/api/account'
import { daysLeft } from '@/lib/attention'

/**
 * Story 1.86 (S-12): the pick-your-searches screen's words and rules (pick-screen.js, approved by
 * Mahan 2026-10-20; UX plan section 11). What happens to each search is the server's (the preview's
 * fate); this words it. Counts are of searches, never slots ("3 searches continue and 2 stop").
 */

export type PickKind = 'reduce' | 'downgrade' | 'overdue' | 'return'
export type FateKind = 'continues' | 'stops' | 'returns' | 'held' | 'undecided' | 'unknown'

/** Which choice the account has to make; null when it has none. */
export function pickKindOf(
  account: AccountSummary | null
): { kind: PickKind; first: boolean } | null {
  const change = account?.change
  if (!change) return null
  if (change.kind === 'downgrade_pending') return { kind: 'downgrade', first: false }
  if (change.overdue) return { kind: 'overdue', first: false }
  if (change.reason === 'return') return { kind: 'return', first: false }
  return { kind: 'reduce', first: change.reason === 'first_plan' }
}

// Deadlines are the start of a day in Eastern time (Story 1.76). "By <day>" and "until <day>" for
// choosing name the last day to act, so a midnight deadline reads as the day before; "on <day>"
// names the day things change: the deadline's own (as the attention banner, Story 1.83).
const ZONE = 'America/New_York'
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

export interface PickDates {
  /** "Tuesday, Oct 27": the last day to choose (reduce), or the move's day (downgrade) */
  byLong: string
  /** "Oct 27" */
  byShort: string
  /** "Oct 28": the day searches stop or come back */
  onShort: string
  onLong: string
  /** "7 days left" */
  left: string
  /** "today at 7 PM Eastern": the next check, when a pick that applies at once takes effect */
  next: string
}

/** "today at 7 PM Eastern", "tomorrow at 9 AM Eastern", "Friday at 9 AM Eastern" */
export function nextCheckText(iso: string, now: Date): string {
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: ZONE })
  const at = new Date(iso)
  const tomorrow = new Date(now.getTime() + 86_400_000)
  const which =
    day(at) === day(now)
      ? 'today'
      : day(at) === day(tomorrow)
        ? 'tomorrow'
        : at.toLocaleDateString('en-US', { timeZone: ZONE, weekday: 'long' })
  const time = at
    .toLocaleTimeString('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit' })
    .replace(':00', '')
  return `${which} at ${time} Eastern`
}

export function pickDates(account: AccountSummary, now: Date = new Date()): PickDates {
  const change = account.change
  const next = nextCheckText(account.nextRoundAt ?? now.toISOString(), now)
  if (change?.kind === 'downgrade_pending') {
    const at = change.effectiveAt
    // Code review: "until" names the last day to change the choice, as for a pick's deadline
    return {
      byLong: longDay(beforeDeadline(at)),
      byShort: shortDay(beforeDeadline(at)),
      onShort: shortDay(at),
      onLong: longDay(at),
      left: daysLeft(at, now),
      next,
    }
  }
  const due = change?.kind === 'pick_needed' ? change.dueAt : null
  if (!due) return { byLong: '', byShort: '', onShort: '', onLong: '', left: '', next }
  return {
    byLong: longDay(beforeDeadline(due)),
    byShort: shortDay(beforeDeadline(due)),
    onShort: shortDay(due),
    onLong: longDay(due),
    left: daysLeft(due, now),
    next,
  }
}

const slotWord = (n: number) => (n === 1 ? 'slot' : 'slots')
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export interface FateInput {
  kind: PickKind
  /** The search is held now (in heldSearches) */
  held: boolean
  /** Paused by the subscriber (isActive false) */
  paused: boolean
  slots: number
  kept: boolean
  /** Something is kept (or the choice is confirmed): before that, a stored pick runs undecided */
  started: boolean
  confirmed: boolean
  previewFailed: boolean
  /** The server's fate for this search under the current choice, when the preview answered */
  serverFate: string | null
}

/** What happens to a search, in the design's words. The kind comes from the server when it can. */
export function fateWords(f: FateInput, d: PickDates): { kind: FateKind; text: string } {
  const n = f.slots
  if (f.previewFailed && !f.confirmed) return { kind: 'unknown', text: 'Not checked yet' }
  const server = f.serverFate as FateKind | null
  if (f.kind === 'reduce' || f.kind === 'downgrade') {
    if (f.held) {
      const returns = server ? server === 'returns' : f.kept
      return returns
        ? {
            kind: 'returns',
            text: `This search will come back on ${d.onShort}${f.paused ? ', paused as you left it.' : '.'}`,
          }
        : {
            kind: 'held',
            text: `Stays on hold. Bring it back to start it again on ${d.onShort}. It needs ${n} ${slotWord(n)}.`,
          }
    }
    if (!f.started)
      return { kind: 'undecided', text: `Runs until ${d.onShort}. Keep it, or it stops then.` }
    const continues = server ? server === 'continues' : f.kept
    if (continues)
      return {
        kind: 'continues',
        text: f.paused
          ? 'This search will continue, paused as you left it.'
          : 'This search will continue.',
      }
    return { kind: 'stops', text: `This search will stop on ${d.onShort}.` }
  }
  if (f.kind === 'overdue') {
    // Code review: a search made after the hold is running, and is worded as running
    if (!f.held) {
      const continues = server ? server === 'continues' : f.kept
      if (continues) return { kind: 'continues', text: 'This search will continue.' }
      return f.confirmed
        ? { kind: 'held', text: 'On hold now. It can come back when you have room.' }
        : { kind: 'stops', text: 'This search will stop when you confirm.' }
    }
    const returns = server ? server === 'returns' || server === 'continues' : f.kept
    if (returns)
      return {
        kind: 'returns',
        text: f.paused
          ? 'This search will come back, paused as you left it.'
          : `This search will start again at the next check, ${d.next}.`,
      }
    return {
      kind: 'held',
      text: f.confirmed
        ? 'Stays on hold. It can come back when you have room.'
        : `Stays on hold. Bring it back to start it again. It needs ${n} ${slotWord(n)}.`,
    }
  }
  // A coming-back pick: it applies at once
  if (f.held) {
    const returns = server ? server === 'returns' : f.kept
    if (returns)
      return {
        kind: 'returns',
        text: f.paused
          ? 'This search will come back paused, as you left it.'
          : f.confirmed
            ? `This search starts at the next check, ${d.next}.`
            : 'This search will come back at the next check after you confirm.',
      }
    return { kind: 'held', text: `Stays on hold. It needs ${n} ${slotWord(n)} to come back.` }
  }
  const continues = server ? server === 'continues' : f.kept
  if (continues) return { kind: 'continues', text: 'This search will continue.' }
  return f.confirmed
    ? { kind: 'held', text: 'On hold now. It can come back when you have room.' }
    : { kind: 'stops', text: 'This search will stop when you confirm.' }
}

/**
 * The sentence that counts searches: "3 searches continue and 2 stop on Oct 27." With withDate
 * false, for a sentence that already opens with the date: "... and 2 stop".
 */
export function splitSentence(
  kind: PickKind,
  kinds: readonly FateKind[],
  d: PickDates,
  withDate = true
): string {
  const count = (k: FateKind) => kinds.filter((x) => x === k).length
  const verbs: Record<string, [string, string]> = {
    continues: ['continues', 'continue'],
    returns: kind === 'overdue' ? ['starts again', 'start again'] : ['comes back', 'come back'],
    stops:
      kind === 'return' || !withDate || !d.onShort
        ? ['stops', 'stop']
        : [`stops on ${d.onShort}`, `stop on ${d.onShort}`],
    held: ['stays on hold', 'stay on hold'],
  }
  const order: FateKind[] =
    kind === 'return'
      ? ['returns', 'held', 'continues', 'stops']
      : ['continues', 'returns', 'stops', 'held']
  const parts: string[] = []
  for (const k of order) {
    const n = count(k)
    if (!n) continue
    if (kind !== 'return' && kind !== 'overdue' && k === 'held') continue
    const v = verbs[k][n === 1 ? 0 : 1]
    parts.push(parts.length === 0 ? `${n} ${n === 1 ? 'search' : 'searches'} ${v}` : `${n} ${v}`)
  }
  if (parts.length === 0) return ''
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
    : parts[0]
}

export const sentenceCase = (s: string) => (s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}.` : '')

export interface Promise_ {
  text: string
  warn: boolean
}

export interface PickHead {
  eyebrow: string | null
  title: string
  lede: string[]
  intro: string[]
  promises: Promise_[]
}

export interface IntroSearch {
  title: string
  grades: string
  slots: number
}

/** The heading, lede and promises for each kind (pick-screen.js). */
export function pickHead(input: {
  kind: PickKind
  first: boolean
  planName: string
  cap: number
  inUse: number
  heldSlots: number
  free: number
  enforced: boolean
  dates: PickDates
  /** For the first meeting: the account's running searches, in order */
  running: readonly IntroSearch[]
  /** The plan the account moves from (downgrade) */
  currentPlan: string
}): PickHead {
  const { kind, cap, inUse, dates: d } = input
  const ok = (text: string): Promise_ => ({ text, warn: false })
  if (kind === 'reduce') {
    let intro: string[] = []
    let lede: string[] = []
    if (input.first && input.running.length > 0) {
      const r = input.running
      const small = r.find((s) => s.slots > 1 && s.slots <= 5) ?? r[0]
      const big = r.reduce((a, s) => (s.slots > a.slots ? s : a), r[0])
      intro = [
        `Grail Seeker now has plans, and your account is on ${input.planName}, with ${cap} slots.`,
        small === big
          ? `A slot is one book in one grade. Your search for ${small.title} in ${small.grades} uses ${plural(small.slots, 'slot', 'slots')}.`
          : `A slot is one book in one grade. Your search for ${small.title} in ${small.grades} uses ${plural(small.slots, 'slot', 'slots')}, and your search for ${big.title} in ${big.grades} uses ${big.slots}.`,
        `Your searches use ${inUse} slots, so choose the ones to keep within ${cap}, by ${d.byLong}.`,
      ]
    } else {
      lede = [
        `Your plan now has ${cap} slots and your searches use ${inUse}. Choose the searches to keep by ${d.byLong}.`,
      ]
    }
    return {
      eyebrow: input.first ? 'Thank you for testing Grail Seeker' : null,
      title: 'Choose the searches to keep',
      lede,
      intro,
      promises: [
        ok(`Every search keeps running until ${d.onShort}.`),
        ok(
          'A search you do not keep goes on hold. It is not deleted, its alerts are kept, and it can come back when you have room.'
        ),
        ok(`You can change your choice until ${d.byShort}.`),
        {
          text: 'If you have not chosen by then, every search goes on hold until you do.',
          warn: true,
        },
      ],
    }
  }
  if (kind === 'downgrade') {
    // Story 1.86 decision 4: the move is confirmed already; "stay on" waits for checkout (S-22), and
    // the limit is described only while it is enforced (Decision #109)
    const promises = [ok(`Every search keeps running until ${d.onShort}.`)]
    if (input.enforced)
      promises.push(
        ok(`From the moment you confirm, you cannot add or widen a search beyond ${cap} slots.`)
      )
    promises.push(
      ok(
        'A search you do not keep goes on hold, not deleted, and can come back if you move to a bigger plan.'
      ),
      ok(`You can change your choice until ${d.byShort}.`)
    )
    return {
      eyebrow: null,
      title: `Choose what to keep on ${input.planName}`,
      lede: [
        `${input.planName} has ${cap} slots and your searches use ${inUse}. Choose the searches to keep. Your move happens on ${d.onLong}.`,
      ],
      intro: [],
      promises,
    }
  }
  if (kind === 'overdue') {
    return {
      eyebrow: null,
      title: 'Choose the searches to start again',
      lede: [
        `Your plan has ${cap} slots and your searches need ${input.heldSlots}. Choose the ones to start again.`,
      ],
      intro: [],
      promises: [
        ok('Nothing has been deleted. Every search keeps its alerts.'),
        ok(`The searches you choose start again at the next check, ${d.next}.`),
        ok('The rest stay on hold, and can come back when you have room.'),
      ],
    }
  }
  return {
    eyebrow: null,
    title: 'Choose what comes back',
    lede: [
      `Your plan now has ${cap} slots. Your running searches use ${inUse}, so ${input.free} are free. Your searches on hold need ${input.heldSlots}, so not all of them fit.`,
    ],
    intro: [],
    promises: [
      ok('A search you do not bring back stays on hold, with its alerts kept.'),
      ok('You can bring it back later, whenever you have room.'),
      ok('You do not have to choose now. Your free slots work for new searches too.'),
    ],
  }
}

export interface PickTally {
  label: string
  count: string
  status: string
  tone: 'none' | 'fits' | 'over'
  over: number
  canConfirm: boolean
  button: string
  note: string
}

export function pickTally(input: {
  kind: PickKind
  cap: number
  keptSlots: number
  anyKept: boolean
  dates: PickDates
  /** The plan moved to, for a downgrade's note */
  planName?: string
}): PickTally {
  const { kind, cap, keptSlots, anyKept, dates: d } = input
  const over = Math.max(0, keptSlots - cap)
  const label =
    kind === 'reduce'
      ? `Choose by ${d.byShort} · ${d.left}`
      : kind === 'downgrade'
        ? `Your move: ${d.onLong}`
        : 'Your choice'
  const status = !anyKept
    ? 'Nothing chosen yet'
    : over
      ? `${over} too many`
      : cap === keptSlots
        ? 'Fits exactly'
        : `Fits, ${cap - keptSlots} to spare`
  const button = {
    reduce: 'Confirm my choice',
    // Story 1.86 decision 4: the move is confirmed already; this changes what it keeps
    downgrade: 'Confirm my choice',
    overdue: 'Start these searches',
    return: 'Bring these back',
  }[kind]
  const fitsNote = {
    reduce: `Confirming stops nothing today. On ${d.onShort}, the searches you did not keep go on hold. You can change your choice until then.`,
    downgrade: `Your move to ${input.planName ?? ''} happens on ${d.onShort}. Every search runs until then.`,
    overdue: `The searches you chose start again at the next check, ${d.next}. The rest stay on hold.`,
    return: 'The searches you bring back start at the next check. The rest stay on hold.',
  }[kind]
  const note = !anyKept
    ? kind === 'return'
      ? 'Choose the searches to bring back.'
      : kind === 'overdue'
        ? 'Bring back the searches to start again.'
        : 'Choose Keep on the searches you want to keep.'
    : over
      ? `Your choice uses ${keptSlots} slots and your plan has ${cap}. Remove a search from your choice, or narrow one, to fit.`
      : fitsNote
  return {
    label,
    count: `${keptSlots} of ${cap} slots`,
    status,
    tone: !anyKept ? 'none' : over ? 'over' : 'fits',
    over,
    canConfirm: anyKept && over === 0,
    button,
    note,
  }
}

/** The heading of a confirmed choice */
export function confirmedTitle(kind: PickKind, d: PickDates): string {
  if (kind === 'reduce') return `What happens on ${d.onShort}`
  if (kind === 'downgrade') return `What happens on ${d.onShort}`
  return 'Your choice is saved'
}

/** The toast after Confirm */
export function confirmedToast(kind: PickKind, planName: string, d: PickDates): string {
  return {
    reduce: `Saved. Nothing changes until ${d.onShort}.`,
    downgrade: `Saved. Your move to ${planName} is on ${d.onShort}.`,
    overdue: 'Saved. Your searches start at the next check.',
    return: 'Saved. Your searches start at the next check.',
  }[kind]
}

/** Section titles of a confirmed choice, by what happens to the searches */
export function confirmedSectionTitle(kind: PickKind, fate: FateKind, d: PickDates): string {
  const atOnce = kind === 'overdue' || kind === 'return'
  if (fate === 'continues') return kind === 'return' ? 'Running' : 'Keep running'
  if (fate === 'returns') return atOnce ? 'Start at the next check' : `Come back on ${d.onShort}`
  if (fate === 'stops') return `Stop on ${d.onShort}`
  return 'Stay on hold'
}

export const sectionCount = (n: number, slots: number, needs: boolean) =>
  `${plural(n, 'search', 'searches')}${needs ? ' · need ' : ' · '}${plural(slots, 'slot', 'slots')}`

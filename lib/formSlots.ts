import type { AccountSummary } from '@/lib/api/account'
import type { GradeOption } from '@/lib/api/grades'
import { PAGE_HREF } from '@/lib/built-pages'
import type { SlotRefusal } from '@/lib/slotRefusal'
import { rangeLabel, slotsForRange, slotsWord } from '@/lib/slots'

/**
 * Story 1.85 (S-10): what the search form says about slots, worked out in one place from the
 * account, the grades and the choice (search-form.js, the approved design; UX plan section 12).
 *
 * Facts show whenever the account has a plan: the badge (the slots available, one number that does
 * not move) and the hint under Grade (the cost only). Words that describe the limit (the slots
 * alert, a Save held back for slots, "can only narrow", the blocked new search) show only while
 * the server enforces it (Decision #109). A refusal the server sends is shown whenever it comes.
 * A lapsed account cannot add a search, whatever the switch says (as on Searches, Story 1.83).
 */

export interface NoticeAction {
  label: string
  href: string
  filled: boolean
}

export interface FormNoticeModel {
  tone: 'info' | 'hold'
  /** 'alert' for something that just happened; 'region' for a standing state */
  role: 'alert' | 'region'
  heading: string
  paragraphs: string[]
  actions: NoticeAction[]
}

export interface SlotMeter {
  others: number
  thisIn: number
  free: number
  over: number
  label: string
}

export interface SlotAlert {
  equation: string
  sentence: string
  meter: SlotMeter
  /** For the legend: this search's whole cost, inside and past the plan */
  thisSlots: number
}

export interface FormSlotsInput {
  mode: 'new' | 'edit'
  grades: readonly GradeOption[] | null
  account: AccountSummary | null
  /** The account could not be read: the hint says the free slots are checked on save */
  accountFailed: boolean
  /** Edit: the slots the saved search uses (the server's) */
  savedSlots: number
  /** Edit: the saved grades, for "can only narrow" */
  savedRange: { min: number; max: number } | null
  gradeMin: number | null
  gradeMax: number | null
  /** Save was pressed on a search that does not fit */
  attempted: boolean
  refusal: SlotRefusal | null
}

export interface FormSlots {
  badge: number | null
  hint: string | null
  /** Both Minimum and Maximum are chosen: the hint is the final cost, in bold (Mahan, 2026-11-05) */
  hintFinal: boolean
  alert: SlotAlert | null
  /** Why Save cannot be pressed, for slots or a hold; the page adds its own reasons */
  why: string | undefined
  notice: FormNoticeModel | null
  /** Over plan at enforce, on an edit: the grade lists hold only the saved range */
  narrowTo: { min: number; max: number } | null
  /** Over plan at enforce, on a new search: no form, only the notice */
  blocked: boolean
  /** Save would be refused for slots: the page shows the alert instead of sending */
  shortNow: boolean
}

const MANAGE: NoticeAction = { label: 'Manage slots', href: PAGE_HREF.plan, filled: false }
const STILL_HERE = 'Everything you entered is still here.'

/** The server's words for no_room (backend slotLimitMessage), for a Save the form holds back itself */
function noRoomWords(mode: 'new' | 'edit', needed: number, available: number): string {
  return mode === 'edit'
    ? `This change needs ${needed} more ${needed === 1 ? 'slot' : 'slots'} and you have ${available} free. Choose fewer grades, or delete a search you no longer need.`
    : `This search needs ${slotsWord(needed)} and you have ${available} free. Choose fewer grades, or delete a search you no longer need.`
}

function refusalNotice(mode: 'new' | 'edit', refusal: SlotRefusal): FormNoticeModel {
  if (refusal.reason === 'on_hold') {
    return {
      tone: 'hold',
      role: 'alert',
      heading: 'Your searches are on hold',
      paragraphs: [refusal.message],
      actions: [{ label: 'View plan', href: PAGE_HREF.plan, filled: false }],
    }
  }
  return {
    tone: 'info',
    role: 'alert',
    heading: mode === 'edit' ? 'Your changes are not saved yet' : 'Your search is not saved yet',
    paragraphs: [refusal.message, STILL_HERE],
    actions: refusal.reason === 'no_plan' ? [] : [MANAGE],
  }
}

export function formSlots(input: FormSlotsInput): FormSlots {
  const { mode, grades, account, gradeMin, gradeMax } = input
  const edit = mode === 'edit'
  const own = edit ? input.savedSlots : 0
  const hasPlan = !!account?.plan
  const lapsed = account?.status === 'lapsed'
  const enforced = account?.enforcement === 'enforce'
  const cap = account?.slots.entitled ?? 0
  const inUse = account?.slots.inUse ?? 0
  const free = account?.slots.free ?? 0
  const overPlan = (account?.slots.over ?? 0) > 0

  const thisSlots = grades ? slotsForRange(grades, gradeMin, gradeMax) : null
  const extra = thisSlots === null ? 0 : thisSlots - own
  const fits = overPlan ? extra <= 0 : extra <= free
  const shortNow = enforced && hasPlan && !lapsed && !overPlan && thisSlots !== null && !fits
  const bothChosen = gradeMin !== null && gradeMax !== null
  const showAlert = shortNow && (bothChosen || input.attempted)
  const every = grades !== null && thisSlots === grades.length

  const badge = hasPlan && !lapsed && !input.accountFailed ? free + own : null

  let hint: string | null = null
  if (grades && thisSlots !== null && !lapsed && !showAlert) {
    const untouched = gradeMin === null && gradeMax === null
    const equation = `${rangeLabel(grades, gradeMin, gradeMax)} = ${slotsWord(thisSlots)}`
    hint = untouched
      ? `A search in every grade would use ${slotsWord(grades.length)}`
      : input.accountFailed
        ? `${equation} • your free slots are checked when you save`
        : equation
  }

  let alert: SlotAlert | null = null
  if (showAlert && grades && thisSlots !== null) {
    // Code review: never below zero if the account is staler than the search
    const others = Math.max(0, inUse - own)
    const total = others + thisSlots
    const inside = Math.min(total, cap)
    const over = Math.max(0, total - cap)
    const empty = cap - inside
    const thisIn = Math.max(0, inside - others)
    const freeLine = `You have ${free} of your ${cap} slots free`
    alert = {
      equation: `${rangeLabel(grades, gradeMin, gradeMax)} = ${slotsWord(thisSlots)}`,
      sentence:
        // Code review: "choose a Minimum and Maximum" only while they are not both chosen
        every && !edit && !bothChosen
          ? `${freeLine}. Choose a Minimum and Maximum grade to save this search.`
          : edit
            ? noRoomWords('edit', extra, free)
            : `${freeLine}. Choose fewer grades, or delete a search you no longer need.`,
      meter: {
        others,
        thisIn,
        free: empty,
        over,
        label: `${slotsWord(others)} used by your other searches, ${thisIn} by this search${empty ? `, ${empty} free` : ''}${over ? `, ${over} more than your plan has` : ''}. Your plan has ${cap}.`,
      },
      thisSlots,
    }
  }

  let why: string | undefined
  if (lapsed && !edit) why = 'Your searches are on hold, so a search cannot be added.'
  else if (showAlert)
    why = every
      ? 'Every grade needs more slots than you have free.'
      : 'Not enough free slots for this grade.'

  // Code review: a refusal (or a Save held back) keeps the form on screen, with what was entered,
  // even when the account read again afterwards is over plan
  const blocked = !edit && enforced && overPlan && !lapsed && !input.refusal && !input.attempted
  const narrowTo = edit && enforced && overPlan && !lapsed ? input.savedRange : null
  const overWords = `Your plan has ${cap} slots and your searches use ${inUse}. Nothing has been stopped, but you cannot add or widen a search until you are back within ${cap}.`

  let notice: FormNoticeModel | null = null
  if (input.refusal) {
    notice = refusalNotice(mode, input.refusal)
  } else if (input.attempted && showAlert && thisSlots !== null) {
    notice = refusalNotice(mode, {
      kind: 'slot_limit',
      reason: 'no_room',
      needed: edit ? extra : thisSlots,
      available: free,
      inUse,
      entitled: cap,
      message: noRoomWords(mode, edit ? extra : thisSlots, free),
    })
  } else if (blocked) {
    notice = {
      tone: 'info',
      role: 'region',
      heading: 'Your searches use more slots than your plan',
      paragraphs: [overWords, 'To add this search, first narrow or delete a search to make room.'],
      actions: [{ label: 'Back to Searches', href: '/searches', filled: true }, MANAGE],
    }
  } else if (narrowTo) {
    notice = {
      tone: 'info',
      role: 'region',
      heading: 'Your searches use more slots than your plan',
      paragraphs: [
        overWords,
        'You can still change anything on this search, and narrow its grade.',
      ],
      actions: [MANAGE],
    }
  }

  return {
    badge,
    hint,
    hintFinal: hint !== null && bothChosen,
    alert,
    why,
    notice,
    narrowTo,
    blocked,
    shortNow,
  }
}

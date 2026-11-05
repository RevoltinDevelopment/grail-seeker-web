'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

import { FormNotice } from '@/components/search/SlotParts'
import { BackArrowIcon } from '@/components/search/formStyles'
import { ACCOUNT_SUMMARY_KEY, useAccountSummary } from '@/hooks/useAccountSummary'
import { useGrades } from '@/hooks/useGrades'
import { usePickPreview } from '@/hooks/usePickPreview'
import { useSearches } from '@/hooks/useSearches'
import { accountAPI, type AccountSummary } from '@/lib/api/account'
import { searchesAPI } from '@/lib/api/searches'
import { PAGE_HREF } from '@/lib/built-pages'
import type { FormNoticeModel } from '@/lib/formSlots'
import {
  confirmedSectionTitle,
  confirmedTitle,
  confirmedToast,
  fateWords,
  pickDates,
  pickHead,
  pickKindOf,
  pickTally,
  sectionCount,
  sentenceCase,
  splitSentence,
  type FateKind,
  type PickDates,
  type PickKind,
} from '@/lib/pickScreen'
import { readPickRefusal } from '@/lib/slotRefusal'
import { formatGrade, formatIssueNumber, formatSeriesShort } from '@/lib/utils/series-formatter'
import type { GrailSearch } from '@/types/search.types'

import { PickCard, type PickCardModel } from './PickCard'
import { PickTallyPanel } from './PickTallyPanel'

/**
 * Story 1.86 (S-12): "Choose the searches to keep", at /plan/choose (pick-screen-*.html, approved by
 * Mahan 2026-10-20). One screen for the four kinds of choice: a reduction (and the beta switchover's
 * first meeting), a date to choose that has passed, searches coming back, and a downgrade's keep list.
 */

const ZONE = 'America/New_York'
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: ZONE, month: 'short', day: 'numeric' })

interface Item {
  id: string
  search: GrailSearch
  slots: number
  held: boolean
  paused: boolean
}

/** The choice frozen at Confirm, so the confirmed view stands after the account moves on */
interface Frozen {
  kind: PickKind
  first: boolean
  dates: PickDates
  planName: string
  cap: number
  fates: Map<string, string>
  /** The cards as they were: a search brought back is no longer held once the account is read again */
  items: Item[]
}

type Refusal =
  | { kind: 'does_not_fit'; was: number; now: number | null; kept: number }
  | { kind: 'list'; text: string }
  | { kind: 'failed' }
  | { kind: 'delete_failed' }

function gradeWords(
  s: GrailSearch,
  lowest: number,
  highest: number
): { every: boolean; text: string } {
  const lo = s.gradeMin ?? lowest
  const hi = s.gradeMax ?? highest
  if (
    Number(lo).toFixed(1) === Number(lowest).toFixed(1) &&
    Number(hi).toFixed(1) === Number(highest).toFixed(1)
  )
    return { every: true, text: 'every grade' }
  return {
    every: false,
    text: Number(lo) === Number(hi) ? formatGrade(lo) : `${formatGrade(lo)} to ${formatGrade(hi)}`,
  }
}

const titleOf = (s: GrailSearch) =>
  `${s.series.title} ${formatIssueNumber(s.issueNumber, s.issueVolumeText)}`

function initialKeep(account: AccountSummary, kind: PickKind): string[] {
  const c = account.change
  if (c?.kind === 'downgrade_pending') return [...c.keepSearchIds]
  if (c?.kind === 'pick_needed' && c.pickedSearchIds) return [...c.pickedSearchIds]
  // Coming back: running searches start kept, the subscriber's own earlier choice (Mahan, 2026-10-20)
  if (kind === 'return') return account.searches.map((s) => s.searchId)
  return []
}

function Frame({
  back,
  children,
}: {
  back: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <Link
        href={back.href}
        className="inline-flex min-h-touch items-center gap-1.5 self-start text-[15px] font-semibold text-link hover:underline"
      >
        <BackArrowIcon />
        {back.label}
      </Link>
      {children}
    </div>
  )
}

const H1 =
  'text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title'
const OUTLINE =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink hover:bg-chip'

export function PickScreen() {
  const queryClient = useQueryClient()
  const { account, isLoading, refetch } = useAccountSummary()
  const {
    searches,
    isLoading: searchesLoading,
    error: searchesError,
    deleteSearch,
    updateSearch,
  } = useSearches()
  const grades = useGrades()
  const [now] = useState(() => new Date())

  const live = pickKindOf(account)
  const [frozen, setFrozen] = useState<Frozen | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const view = frozen ? { kind: frozen.kind, first: frozen.first } : live

  const [keep, setKeep] = useState<string[] | null>(null)
  const [everKept, setEverKept] = useState(false)
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const [saving, setSaving] = useState(false)
  const [narrowed, setNarrowed] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [noticeKey, setNoticeKey] = useState(0)
  // The server says there is nothing to pick (a Confirm, or a preview): "Nothing to choose" at once
  const [nothingToPick, setNothingToPick] = useState(false)

  // The searches on screen: running ones in slot order, then held ones, each with the server's slots
  const items: Item[] = useMemo(() => {
    if (!account) return []
    const byId = new Map(searches.map((s) => [s.id, s]))
    const running = [...account.searches]
      .sort((a, b) => a.firstSlot - b.firstSlot)
      .flatMap((v) => {
        const s = byId.get(v.searchId)
        return s
          ? [{ id: v.searchId, search: s, slots: v.slots, held: false, paused: !v.isActive }]
          : []
      })
    const held = account.heldSearches.flatMap((h) => {
      const s = byId.get(h.searchId)
      return s
        ? [{ id: h.searchId, search: s, slots: h.slots, held: true, paused: !h.isActive }]
        : []
    })
    return [...running, ...held]
  }, [account, searches])

  // The choice starts from what is stored (decision 2), once both reads have arrived
  useEffect(() => {
    if (keep === null && account && live && !searchesLoading) {
      const start = initialKeep(account, live.kind)
      setKeep(start)
      if (start.length > 0) setEverKept(true)
    }
  }, [keep, account, live, searchesLoading])

  // Code review: the choice holds only searches on screen; a stored pick naming a search deleted
  // since would otherwise make every preview fail, with no card to untick
  const keepShown = useMemo(
    () => (keep ?? []).filter((id) => items.some((i) => i.id === id)),
    [keep, items]
  )
  const kept = useMemo(() => new Set(keepShown), [keepShown])
  // The plan's slots too: a preview is asked again when the plan changes (code review)
  const slotsSignature = `${account?.slots.entitled ?? ''}|${items.map((i) => `${i.id}:${i.slots}`).join(',')}`
  const {
    preview,
    failed: previewFailed,
    retry: retryPreview,
    error: previewError,
  } = usePickPreview(keepShown, slotsSignature, !!account && !!view && !confirmed && keep !== null)

  // Code review: a preview answering that there is nothing to pick any more is not a failure
  useEffect(() => {
    if (readPickRefusal(previewError)?.kind === 'not_needed') {
      setNothingToPick(true)
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
    }
  }, [previewError, queryClient])

  // Code review: the downgrade's screen leads back to the plan, loading or not
  const backTo =
    live?.kind === 'downgrade'
      ? { href: PAGE_HREF.plan, label: 'Back to Plan' }
      : { href: '/searches', label: 'Back to Searches' }

  if (isLoading || searchesLoading || (live && keep === null)) {
    return (
      <Frame back={backTo}>
        {/* As drawn (pick-screen-loading.html): the heading and lede, four cards, and the tally (code review) */}
        <div role="status">
          <span className="sr-only">Loading your searches</span>
          <div className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_340px]" aria-hidden="true">
            <div className="flex min-w-0 flex-col gap-6">
              <div>
                <span className="block h-8 w-[260px] max-w-[80%] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
                <span className="mt-3.5 block h-4 w-[90%] max-w-[620px] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
                <span className="mt-2 block h-4 w-[70%] max-w-[480px] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
              </div>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
                  >
                    <span className="block h-[18px] w-[70%] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
                    <span className="block h-3.5 w-[45%] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
                    <span className="block h-3.5 w-[60%] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
                    <span className="block h-11 w-full animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-sm desktop:flex">
              <span className="block h-3.5 w-[140px] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
              <span className="block h-[26px] w-[60%] animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
              <span className="block h-3.5 w-full animate-pulse rounded-button bg-chip motion-reduce:animate-none" />
              <span className="inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-dashed border-line-strong bg-background text-[15px] font-semibold text-muted-foreground">
                Loading your searches
              </span>
            </div>
          </div>
        </div>
      </Frame>
    )
  }

  if (!account || (searchesError && searches.length === 0)) {
    return (
      <Frame back={backTo}>
        <h1 className={H1}>Choose the searches to keep</h1>
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface px-5 py-4 text-[15px] text-ink"
        >
          <p>Your searches could not be loaded.</p>
          <button
            type="button"
            className={OUTLINE}
            onClick={() => {
              void refetch()
              void queryClient.invalidateQueries({ queryKey: ['searches'] })
            }}
          >
            Try again
          </button>
        </div>
      </Frame>
    )
  }

  // Nothing to choose (pick-screen.js, noPick)
  if (!view || (nothingToPick && !confirmed)) {
    const notice: FormNoticeModel = {
      tone: 'info',
      icon: 'check',
      role: 'region',
      heading: 'Your searches fit your plan',
      paragraphs: [
        account.plan
          ? `Your plan has ${account.slots.entitled} slots and your searches use ${account.slots.inUse}, so nothing will stop. Every search keeps running.`
          : 'There is nothing to choose on your account.',
      ],
      actions: [{ label: 'Back to Searches', href: '/searches', filled: true }],
    }
    return (
      <Frame back={backTo}>
        <h1 className={H1}>Nothing to choose</h1>
        <FormNotice notice={notice} />
      </Frame>
    )
  }

  const kind = view.kind
  const dates = frozen?.dates ?? pickDates(account, now)
  const cap = frozen?.cap ?? account.slots.entitled
  const planName =
    frozen?.planName ??
    (account.change?.kind === 'downgrade_pending'
      ? account.change.plan.name
      : (account.plan?.name ?? ''))
  const lowest = grades.grades?.[0]?.value ?? 0.5
  const highest = grades.grades?.[grades.grades.length - 1]?.value ?? 10

  // Confirmed: the cards as they were at Confirm, less any deleted since
  const shown =
    confirmed && frozen ? frozen.items.filter((i) => searches.some((s) => s.id === i.id)) : items
  const keptItems = items.filter((i) => kept.has(i.id))
  const keptSlots = keptItems.reduce((n, i) => n + i.slots, 0)
  const anyKept = keptItems.length > 0
  const started = anyKept || confirmed
  const serverFates = confirmed
    ? frozen!.fates
    : new Map((preview?.searches ?? []).map((s) => [s.searchId, String(s.fate)]))

  const fateOf = (i: Item) =>
    fateWords(
      {
        kind,
        held: i.held,
        paused: i.paused,
        slots: i.slots,
        kept: kept.has(i.id),
        started,
        confirmed,
        previewFailed: previewFailed && !preview,
        serverFate: serverFates.get(i.id) ?? null,
      },
      dates
    )
  const fates = new Map(shown.map((i) => [i.id, fateOf(i)]))
  const kinds = shown.map((i) => fates.get(i.id)!.kind)
  const sentence = sentenceCase(splitSentence(kind, kinds, dates))
  const bare = splitSentence(kind, kinds, dates, false)

  const running = shown.filter((i) => !i.held)
  const held = shown.filter((i) => i.held)
  const heldSlots = held.reduce((n, i) => n + i.slots, 0)
  const free = Math.max(0, cap - account.slots.inUse)

  const head = pickHead({
    kind,
    first: view.first,
    planName,
    cap,
    inUse: account.slots.inUse,
    heldSlots,
    free,
    enforced: account.enforcement === 'enforce',
    dates,
    running: running.map((i) => ({
      title: titleOf(i.search),
      grades: gradeWords(i.search, lowest, highest).text,
      slots: i.slots,
    })),
    currentPlan: account.plan?.name ?? '',
  })
  const tally = pickTally({ kind, cap, keptSlots, anyKept, dates, planName })

  const cardOf = (i: Item): PickCardModel => {
    const g = gradeWords(i.search, lowest, highest)
    const by = i.search.gradingAuthority ? i.search.gradingAuthority.toUpperCase() : 'any grader'
    const max = i.search.maxPrice ? ` · up to $${i.search.maxPrice.toLocaleString('en-US')}` : ''
    const why =
      kind === 'overdue'
        ? ', when the date to choose passed'
        : i.search.heldReason === 'downgrade'
          ? ', when your plan moved to fewer slots'
          : ''
    return {
      id: i.id,
      title: titleOf(i.search),
      series: formatSeriesShort(i.search.series),
      slots: i.slots,
      meta: `${g.every ? 'Every grade' : `Grade ${g.text}`} · ${by}${max}`,
      paused:
        i.paused && !i.held
          ? `${i.search.pausedAt ? `Paused by you on ${shortDate(i.search.pausedAt)}` : 'Paused by you'}. Keeps its ${i.slots === 1 ? 'slot' : `${i.slots} slots`} while paused.`
          : null,
      held: i.held
        ? `On hold${i.search.heldAt ? ` since ${shortDate(i.search.heldAt)}` : ''}${why}.${i.paused ? ' It was paused, and comes back paused.' : ''}`
        : null,
      tooBig: i.slots > cap,
      // Code review: only a running search of more than one grade can be narrowed here
      canBeNarrowed: !i.held && i.slots > 1,
      fate: fates.get(i.id)!,
      savedLine: narrowed[i.id] ? `Grades narrowed to ${narrowed[i.id]}. Saved.` : null,
      range:
        i.search.gradeMin !== null || i.search.gradeMax !== null
          ? { min: i.search.gradeMin ?? lowest, max: i.search.gradeMax ?? highest }
          : { min: lowest, max: highest },
      isHeld: i.held,
    }
  }

  const toggle = (id: string) => {
    setRefusal(null)
    setEverKept(true)
    setKeep((k) => {
      const list = k ?? []
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    })
  }

  const saveGrades = async (id: string, min: number, max: number, text: string) => {
    await updateSearch.mutateAsync({ id, data: { gradeMin: min, gradeMax: max } })
    setRefusal(null)
    setNarrowed((n) => ({ ...n, [id]: text }))
  }

  const remove = async (id: string) => {
    try {
      await deleteSearch.mutateAsync(id)
      setKeep((k) => (k ?? []).filter((x) => x !== id))
      setConfirmDelete(null)
    } catch {
      setConfirmDelete(null)
      setRefusal({ kind: 'delete_failed' })
    }
  }

  const confirm = async () => {
    if (!tally.canConfirm || saving) return
    setSaving(true)
    setRefusal(null)
    setNoticeKey((n) => n + 1)
    const keepIds = keptItems.map((i) => i.id)
    try {
      // Decision 3, widened in code review: the list is read again before any pick is sent. A
      // search added since the screen was read, or one the account has that the list did not show,
      // stops the pick, so no search is held or left out unseen.
      const fresh = await queryClient.fetchQuery({
        queryKey: ['searches'],
        queryFn: searchesAPI.list,
        staleTime: 0,
      })
      const known = new Set(items.map((i) => i.id))
      const added = fresh.searches.find((s) => !known.has(s.id))
      const unseen = [
        ...account.searches.map((v) => v.searchId),
        ...account.heldSearches.map((h) => h.searchId),
      ].some((id) => !known.has(id))
      if (added || unseen) {
        setRefusal({
          kind: 'list',
          text: added
            ? `${titleOf(added)} has been added since you opened this page, so your choice was not saved.`
            : 'A search has changed since you opened this page, so your choice was not saved.',
        })
        void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
        return
      }
      const after = await accountAPI.pick(keepIds)
      // Code review: the database finds the account fits again (a narrowing or a delete did it), so
      // it stores no pick: nothing will stop, and the screen says so rather than "saved"
      if (!after.change && (kind === 'reduce' || kind === 'downgrade')) {
        setNothingToPick(true)
        void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
        void queryClient.invalidateQueries({ queryKey: ['searches'] })
        return
      }
      setFrozen({
        kind,
        first: view.first,
        dates,
        planName,
        cap,
        fates: new Map(
          items.map((i) => [
            i.id,
            serverFates.get(i.id) ??
              (kept.has(i.id) ? (i.held ? 'returns' : 'continues') : i.held ? 'held' : 'stops'),
          ])
        ),
        items,
      })
      setConfirmed(true)
      window.scrollTo?.({ top: 0 })
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['searches'] })
    } catch (error) {
      const refused = readPickRefusal(error)
      if (refused?.kind === 'does_not_fit') {
        setRefusal({
          kind: 'does_not_fit',
          was: cap,
          now: refused.slotsToFit,
          kept: refused.keptSlots ?? keptSlots,
        })
        void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
      } else if (refused?.kind === 'invalid') {
        const fresh = await queryClient
          .fetchQuery({ queryKey: ['searches'], queryFn: searchesAPI.list, staleTime: 0 })
          .catch(() => null)
        const gone = fresh
          ? keptItems.filter((i) => !fresh.searches.some((s) => s.id === i.id))
          : []
        setRefusal({
          kind: 'list',
          text:
            gone.length === 1
              ? `${titleOf(gone[0].search)} has been deleted since you opened this page, so your choice was not saved.`
              : 'A search has changed since you opened this page, so your choice was not saved.',
        })
        setKeep((k) => (k ?? []).filter((id) => !gone.some((g) => g.id === id)))
        void queryClient.invalidateQueries({ queryKey: ['searches'] })
        void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
      } else if (refused?.kind === 'not_needed') {
        // Nothing to pick any more: said at once, and the account read again (code review)
        setFrozen(null)
        setNothingToPick(true)
        void queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
      } else {
        setRefusal({ kind: 'failed' })
      }
    } finally {
      setSaving(false)
    }
  }

  // Code review: back to the account's own choice, as it is now (the frozen copy goes). Offered only
  // for a pick that is stored (a reduction, a downgrade): one that applied at once leaves nothing to
  // change, so it is not offered there (Decision #109)
  const changeMyChoice = () => {
    setConfirmed(false)
    setFrozen(null)
    setRefusal(null)
  }

  // ----- Notices -----
  const notices: FormNoticeModel[] = []
  const change = {
    label: 'Change my choice',
    href: PAGE_HREF.pick,
    filled: false,
    onClick: changeMyChoice,
  }
  if (confirmed) {
    if (kind === 'reduce')
      notices.push({
        tone: 'info',
        role: 'region',
        heading: 'Your choice is saved',
        paragraphs: [
          `On ${dates.onLong}, ${bare}. Every search runs until then, and you can change your choice before that date.`,
        ],
        actions: [change],
      })
    else if (kind === 'downgrade')
      notices.push({
        tone: 'info',
        role: 'region',
        heading: `Your move to ${planName} is on ${dates.onShort}`,
        paragraphs: [
          `On that date, ${bare}. ${
            account.enforcement === 'enforce'
              ? `Until then every search runs, but you cannot add or widen a search beyond ${cap} slots.`
              : 'Until then every search runs.'
          }`,
        ],
        actions: [change],
      })
    else
      notices.push({
        tone: 'info',
        icon: 'check',
        role: 'region',
        heading: 'Your choice is saved',
        paragraphs: [
          `${sentence} The searches you chose start at the next check, ${dates.next}. Nothing has been deleted.`,
        ],
        actions: [],
      })
  } else if (kind === 'overdue') {
    notices.push({
      tone: 'hold',
      role: 'region',
      heading: 'Your searches are on hold until you choose',
      paragraphs: [
        `The date to choose was ${dates.byLong}, so every search is on hold. Choose the ones to keep below and they start again.`,
        'Nothing has been deleted.',
      ],
      actions: [],
    })
  }
  if (refusal?.kind === 'does_not_fit')
    notices.push({
      tone: 'attention',
      role: 'alert',
      heading: 'Your plan changed while you were choosing',
      paragraphs: [
        refusal.now !== null && refusal.now !== refusal.was
          ? `Your plan now has ${refusal.now} slots, not ${refusal.was}. Your choice uses ${refusal.kept}, so it was not saved.`
          : `Your choice uses ${refusal.kept} slots and your plan has ${refusal.now ?? refusal.was}, so it was not saved.`,
        'Your choices are still here. Remove a search from your choice, or narrow one, then confirm again.',
      ],
      actions: [],
    })
  if (refusal?.kind === 'list')
    notices.push({
      tone: 'info',
      role: 'alert',
      heading: 'Your list has changed',
      paragraphs: [
        refusal.text,
        'The list below is up to date. Check your choice and confirm again.',
      ],
      actions: [],
    })
  if (refusal?.kind === 'delete_failed')
    notices.push({
      tone: 'info',
      role: 'alert',
      heading: 'The search was not deleted',
      paragraphs: ['Something went wrong on our side. Try again.'],
      actions: [],
    })
  if (refusal?.kind === 'failed')
    notices.push({
      tone: 'info',
      role: 'alert',
      heading: 'That was not saved',
      paragraphs: ['Something went wrong on our side. Your choices are still here. Try again.'],
      actions: [],
    })

  // ----- Sections -----
  type Section = { title: string; note: string | null; list: Item[]; needs: boolean }
  const sections: Section[] = []
  if (confirmed) {
    for (const k of ['continues', 'returns', 'stops', 'held'] as FateKind[]) {
      const list = shown.filter((i) => fates.get(i.id)!.kind === k)
      if (list.length)
        sections.push({
          title: confirmedSectionTitle(kind, k, dates),
          note: null,
          list,
          needs: false,
        })
    }
  } else if (kind === 'overdue') {
    sections.push({
      title: 'Your searches, all on hold',
      note: 'On hold, a search uses no slots. Bring back the ones to start again.',
      list: held,
      needs: true,
    })
    // Code review: a search made after the hold runs, and is shown as running
    if (running.length)
      sections.push({ title: 'Running now', note: null, list: running, needs: false })
  } else if (kind === 'return') {
    sections.push(
      {
        title: 'On hold',
        note: `Choose which come back. They need ${heldSlots} ${heldSlots === 1 ? 'slot' : 'slots'}, and you have ${free} free.`,
        list: held,
        needs: true,
      },
      {
        title: 'Running now',
        note: 'These keep running. Press Keeping on one only if you want to make room for a search on hold.',
        list: running,
        needs: false,
      }
    )
  } else {
    sections.push({ title: 'Your searches', note: null, list: running, needs: false })
    if (held.length)
      sections.push({
        title: 'On hold',
        note: `A search on hold uses no slots. Bring one back and it starts again on ${dates.onShort}.`,
        list: held,
        needs: true,
      })
  }

  const back =
    kind === 'downgrade'
      ? { href: PAGE_HREF.plan, label: 'Back to Plan' }
      : { href: '/searches', label: 'Back to Searches' }
  const title = confirmed ? confirmedTitle(kind, dates) : head.title

  return (
    <Frame back={back}>
      {confirmed && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-card bg-ink px-4 py-3 text-[15px] font-semibold text-background"
        >
          <svg
            className="mt-0.5 flex-none"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>{confirmedToast(kind, planName, dates)}</span>
        </div>
      )}
      <div>
        {head.eyebrow && !confirmed && (
          <p className="text-xs font-bold uppercase tracking-[.08em] text-muted-foreground">
            {head.eyebrow}
          </p>
        )}
        <h1 className={H1}>{title}</h1>
        {!confirmed &&
          head.lede.map((l) => (
            <p key={l} className="mt-2.5 max-w-[720px] text-base text-ink">
              {l}
            </p>
          ))}
      </div>
      {notices.map((n) => (
        <FormNotice key={`${noticeKey}-${n.heading}`} notice={n} />
      ))}
      {!confirmed && (
        <section
          aria-label="What happens"
          className="flex max-w-[820px] flex-col gap-2.5 rounded-card border border-line bg-surface p-4 shadow-sm tablet:px-6 tablet:py-5"
        >
          {head.intro.map((p) => (
            <p key={p} className="text-[15px] text-ink">
              {p}
            </p>
          ))}
          <ul className="m-0 grid list-none gap-2 p-0">
            {head.promises.map((p) => (
              <li
                key={p.text}
                className={`flex items-start gap-2.5 text-[15px] text-ink ${p.warn ? 'font-semibold' : ''}`}
              >
                <span
                  className={`mt-[3px] flex-none ${p.warn ? 'text-attention-line' : 'text-info-icon'}`}
                >
                  {p.warn ? (
                    <svg
                      width="16"
                      height="16"
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
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_340px] desktop:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {sections.map((sec) => (
            <section key={sec.title} aria-label={sec.title}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h2 className="text-[17px] font-bold text-ink">{sec.title}</h2>
                <span className="text-sm text-muted-foreground">
                  {sectionCount(
                    sec.list.length,
                    sec.list.reduce((n, i) => n + i.slots, 0),
                    sec.needs
                  )}
                </span>
              </div>
              {sec.note && <p className="mb-2 text-sm text-muted-foreground">{sec.note}</p>}
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
                {sec.list.map((i) => (
                  <PickCard
                    key={i.id}
                    card={cardOf(i)}
                    kept={kept.has(i.id)}
                    confirmed={confirmed}
                    cap={cap}
                    keptSlots={keptSlots}
                    grades={grades.grades}
                    confirmingDelete={confirmDelete === i.id}
                    deleting={deleteSearch.isPending}
                    onKeep={() => toggle(i.id)}
                    locked={saving}
                    onSaveGrades={(min, max, text) => saveGrades(i.id, min, max, text)}
                    onAskDelete={() => setConfirmDelete(i.id)}
                    onCancelDelete={() => setConfirmDelete(null)}
                    onDelete={() => void remove(i.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
        {!confirmed && (
          <PickTallyPanel
            tally={tally}
            cap={cap}
            keptSlots={keptSlots}
            sentence={anyKept && !tally.over ? sentence : ''}
            previewFailed={previewFailed && !preview}
            onRetryPreview={retryPreview}
            idle={!everKept}
            saving={saving}
            onConfirm={() => void confirm()}
          />
        )}
      </div>
    </Frame>
  )
}

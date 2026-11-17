'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { AlertRow } from '@/components/alerts/AlertRow'
import { AlertsFilterBar, type BooksState } from '@/components/alerts/AlertsFilterBar'
import { useAccountSummary } from '@/hooks/useAccountSummary'
import { useAlerts } from '@/hooks/useAlerts'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useUiPreferences } from '@/hooks/useUiPreferences'
import { useReportSeen } from '@/hooks/useUnseenAlerts'
import {
  emptyWords,
  filterAlerts,
  marketplaceOptions,
  type MatchFilter,
  searchDetail,
  searchName,
  subtitle,
  undoRefusal,
} from '@/lib/alertRows'
import { alertsAPI } from '@/lib/api/alerts'
import { APIError } from '@/lib/api/client'
import { searchesAPI } from '@/lib/api/searches'
import type { AlertsSortMode } from '@/lib/api/user'
import { groupAlertsBySearch } from '@/lib/utils/groupAlertsBySearch'

import type { Alert } from '@/types/alert.types'

/**
 * Story 1.96 (U-11): Alerts, as drawn in alerts-list.html (UX plan section 17).
 *
 * One read of the account's active alerts; the filters, the one-search view and "Show 20 more" are
 * applied here, so every count and empty state the design draws is exact (decision 3). The cap is
 * By book's of before (1,000); no account is near it.
 *
 * "New" (Decision #103): a row whose alert had no seen mark the first time it reached the page on
 * this visit keeps its label until the subscriber leaves, even after the page reports it seen. Only
 * data read on this visit counts (a cached list from an earlier visit would call seen alerts new),
 * so nothing is reported seen until that read has come back.
 */
const ALL_ALERTS_LIMIT = 1000
const PAGE = 20
const ARCHIVED_COUNT_KEY = ['alerts', 'archived-count'] as const

const OUTLINE_BTN =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline hover:bg-chip'

// One notice, for the latest event (as drawn). Each event clears or replaces only its own alert's notice.
type Notice = { kind: 'dismissed'; alert: Alert } | { kind: 'error'; alertId: string; text: string } | null

// A second click this soon after a Dismiss lands on the row that moved up into its place (review)
const DISMISS_GUARD_MS = 500

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 flex-none"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function BellIcon() {
  return (
    <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
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
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </span>
  )
}

export default function AlertsClient() {
  const searchId = useSearchParams().get('search')
  const context = Boolean(searchId)
  const queryClient = useQueryClient()

  const [market, setMarket] = useState('all')
  const [match, setMatch] = useState<MatchFilter>('all')
  const [shownCount, setShownCount] = useState(PAGE)
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set())
  const [notice, setNotice] = useState<Notice>(null)
  const [undoing, setUndoing] = useState(false)
  const pendingArchive = useRef(new Map<string, Promise<boolean>>())
  const lastDismissAt = useRef(0)
  const undoRef = useRef<HTMLButtonElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)

  const prefs = useUiPreferences()
  const sort: AlertsSortMode = context ? 'date' : prefs.alertsSort

  // Always read afresh on opening: "New" and seen reporting wait for this visit's read, and a list
  // cached under the app's staleTime would otherwise never be read (review)
  const { alerts, isLoading, error, refetch, isFetchedAfterMount } = useAlerts(
    { limit: ALL_ALERTS_LIMIT, offset: 0, status: 'active' },
    { refetchOnMount: 'always' }
  )
  const { groups: platformGroups, displayNameFor } = usePlatforms()
  const { account } = useAccountSummary()
  const { data: searchList } = useQuery({ queryKey: ['searches'], queryFn: searchesAPI.list })
  const { data: archived } = useQuery({
    queryKey: ARCHIVED_COUNT_KEY,
    queryFn: () => alertsAPI.list({ status: 'archived', limit: 1 }),
  })

  const searchesById = useMemo(
    () => new Map((searchList?.searches ?? []).map((s) => [s.id, s])),
    [searchList]
  )
  const markets = useMemo(
    () => marketplaceOptions(platformGroups.flatMap((g) => g.platforms), alerts),
    [platformGroups, alerts]
  )
  // A marketplace that has left the options (its last alert dismissed, a shop switched off) is no
  // longer a filter: the page shows every marketplace rather than a select naming none (review)
  const activeMarket = market === 'all' || markets.some((m) => m.slug === market) ? market : 'all'
  const labelFor = useCallback(
    (slug: string) => markets.find((m) => m.slug === slug)?.label ?? displayNameFor(slug),
    [markets, displayNameFor]
  )

  // "New" for the visit (decision 2)
  const hasList = alerts.length > 0 || !error
  const ready = isFetchedAfterMount && !isLoading && !error
  const known = useRef(new Set<string>())
  const fresh = useRef(new Set<string>())
  const newIds = useMemo(() => {
    if (ready) {
      for (const a of alerts) {
        if (known.current.has(a.id)) continue
        known.current.add(a.id)
        if (a.seenAt === null) fresh.current.add(a.id) // undefined (an older server): not known to be new
      }
    }
    return new Set(fresh.current)
  }, [alerts, ready])

  const base = useMemo(
    () => alerts.filter((a) => !gone.has(a.id) && (!searchId || a.searchId === searchId)),
    [alerts, gone, searchId]
  )
  const shown = useMemo(() => filterAlerts(base, activeMarket, match), [base, activeMarket, match])
  const filtered = activeMarket !== 'all' || match !== 'all'
  const pageRows = shown.slice(0, shownCount)

  const books = useMemo(() => (sort === 'book' ? groupAlertsBySearch(shown) : []), [shown, sort])
  const booksState: BooksState | undefined = books.length
    ? books.every((b) => !prefs.isGroupCollapsed(b.id))
      ? 'open'
      : books.every((b) => prefs.isGroupCollapsed(b.id))
        ? 'closed'
        : 'mixed'
    : undefined

  // Story 1.82's rules kept: only what is on screen is reported, a collapsed book's alerts stay new
  const { isLoaded: prefsLoaded, isGroupCollapsed } = prefs
  const onScreen = useMemo(() => {
    if (!ready || !prefsLoaded) return null // still loading: the opening starts when the list arrives (Story 1.97)
    if (sort === 'book') return books.filter((b) => !isGroupCollapsed(b.id)).flatMap((b) => b.alerts.map((a) => a.id))
    return pageRows.map((a) => a.id)
  }, [ready, prefsLoaded, isGroupCollapsed, sort, books, pageRows])
  useReportSeen(onScreen)

  const resetPaging = () => setShownCount(PAGE)
  const onMarket = (slug: string) => {
    setMarket(slug)
    resetPaging()
  }
  const onMatch = (m: MatchFilter) => {
    setMatch(m)
    resetPaging()
  }
  const onClear = () => {
    setMarket('all')
    setMatch('all')
    resetPaging()
  }
  const onSort = (s: AlertsSortMode) => {
    prefs.setAlertsSort(s)
    resetPaging()
  }
  const onToggleBooks = () => {
    // Pressing closes every book, or opens them all when all are closed. Only the books on screen:
    // a book hidden by a filter keeps the state it had (review)
    const shownIds = new Set(books.map((b) => b.id))
    prefs.setAllGroupsCollapsed(prefs.collapsedGroups.filter((id) => !shownIds.has(id)).concat(booksState === 'closed' ? [] : [...shownIds]))
  }

  const refreshAfterChange = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      queryClient.invalidateQueries({ queryKey: ['searches'] }),
    ])

  // Dismiss acts at once; Undo brings it back (decision 6)
  const clearOwnNotice = (alertId: string) =>
    setNotice((n) => (n && (n.kind === 'dismissed' ? n.alert.id : n.alertId) === alertId ? null : n))
  const unhide = (alertId: string) =>
    setGone((g) => {
      const n = new Set(g)
      n.delete(alertId)
      return n
    })
  const onDismiss = (alert: Alert) => {
    const now = Date.now()
    if (now - lastDismissAt.current < DISMISS_GUARD_MS) return
    lastDismissAt.current = now
    setGone((g) => new Set(g).add(alert.id))
    setNotice({ kind: 'dismissed', alert })
    // The button that was pressed has gone with its row: the page brings the bar into view and
    // keyboard focus goes to Undo (review). Scrolled explicitly: a phone's browser does not scroll
    // to a button focused from code, so on a phone the bar stayed out of sight (Mahan, 2026-11-16).
    requestAnimationFrame(() => {
      const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      noticeRef.current?.scrollIntoView?.({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
      undoRef.current?.focus({ preventScroll: true })
    })
    const archived = alertsAPI
      .archive(alert.id)
      .then(() => true)
      .catch((e: unknown) => {
        // Already archived by the system (sold, ended, replaced): it is in the archive, so it leaves
        // Alerts all the same and the list is read again (review)
        if (e instanceof APIError && e.code === 'NOT_ACTIVE') return true
        unhide(alert.id)
        setNotice({ kind: 'error', alertId: alert.id, text: 'That alert couldn\u2019t be moved to the archive. Try again.' })
        return false
      })
      .then(async (ok) => {
        if (ok) await refreshAfterChange()
        return ok
      })
      .finally(() => pendingArchive.current.delete(alert.id))
    pendingArchive.current.set(alert.id, archived)
  }
  const onUndo = async (alert: Alert) => {
    setUndoing(true)
    try {
      // An Undo pressed before the Dismiss has reached the server waits for it (review)
      const pending = pendingArchive.current.get(alert.id)
      if (pending && !(await pending)) return
      await alertsAPI.restore(alert.id)
      await refreshAfterChange()
      unhide(alert.id)
      clearOwnNotice(alert.id)
    } catch (e) {
      setNotice({ kind: 'error', alertId: alert.id, text: undoRefusal(e instanceof APIError ? e.code : undefined) })
    } finally {
      setUndoing(false)
    }
  }

  const loading = isLoading
  const contextSearch = searchId ? searchesById.get(searchId) : undefined
  const contextFallback = searchId ? alerts.find((a) => a.searchId === searchId)?.search : undefined
  const contextArchived = contextSearch?.archivedAlertCount ?? 0
  const searchCount = new Set(base.map((a) => a.searchId)).size
  const empty = !loading && hasList && shown.length === 0
  const words = emptyWords({
    baseCount: base.length,
    context,
    match,
    marketLabel: activeMarket === 'all' ? null : labelFor(activeMarket),
    // Unknown plan: the texting promise is left out rather than stated (Decision #109)
    textsIncluded: account?.plan?.textsIncluded ?? false,
  })

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
            Alerts
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {error && !hasList
              ? 'Your alerts couldn’t be loaded'
              : subtitle({
                  loading,
                  context,
                  baseCount: base.length,
                  shownCount: shown.length,
                  searchCount,
                  filtered,
                })}
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5 tablet:items-end">
          <Link href="/alerts/archive" className={OUTLINE_BTN}>
            {archived ? `Archived alerts (${archived.pagination.total})` : 'Archived alerts'}
          </Link>
        </div>
      </div>

      {context && (
        <section
          aria-label="Showing one search"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-card border-[1.5px] border-line-strong bg-surface px-4 py-3.5"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Alerts for one search</p>
            {contextSearch ? (
              <>
                <p className="text-[17px] font-bold leading-[1.3] text-ink">{searchName(contextSearch)}</p>
                <p className="text-sm text-muted-foreground">{searchDetail(contextSearch)}</p>
              </>
            ) : (
              contextFallback && <p className="text-[17px] font-bold leading-[1.3] text-ink">{searchName(contextFallback)}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contextArchived > 0 && (
              <Link
                href={`/alerts/archive?search=${encodeURIComponent(searchId ?? '')}`}
                className="inline-flex min-h-touch items-center px-2 text-[15px] font-semibold text-link underline underline-offset-[3px]"
              >
                {contextArchived} archived
              </Link>
            )}
            <Link href="/alerts" className={OUTLINE_BTN}>
              All alerts
            </Link>
          </div>
        </section>
      )}

      <AlertsFilterBar
        markets={markets}
        market={activeMarket}
        match={match}
        onMarket={onMarket}
        onMatch={onMatch}
        onClear={onClear}
        sort={context ? undefined : sort}
        onSort={context ? undefined : onSort}
        books={sort === 'book' ? booksState : undefined}
        onToggleBooks={onToggleBooks}
      />

      <div ref={noticeRef} role="status" aria-live="polite" className="scroll-mt-4 empty:hidden">
        {notice && (
          <div className="flex items-center gap-2.5 rounded-card bg-ink px-4 py-3 text-[15px] font-semibold text-background">
            {notice.kind === 'dismissed' ? (
              <>
                <CheckIcon />
                <span>Moved to the archive.</span>
                <button
                  ref={undoRef}
                  type="button"
                  onClick={() => onUndo(notice.alert)}
                  disabled={undoing}
                  className="-my-3 -mr-2 ml-auto min-h-touch bg-transparent px-2 font-bold text-background underline underline-offset-[3px] disabled:opacity-60"
                >
                  Undo
                </button>
              </>
            ) : (
              <span>{notice.text}</span>
            )}
          </div>
        )}
      </div>

      {loading && (
        <ul aria-busy="true" aria-label="Loading alerts" className="m-0 list-none rounded-card border border-line bg-surface px-5 shadow-sm">
          {[0, 1, 2].map((k) => (
            <li key={k} className="grid gap-3 border-t border-line py-4 first:border-t-0 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center">
              <div>
                <span className="block h-[18px] w-[62%] animate-pulse rounded-sm bg-chip motion-reduce:animate-none" />
                <span className="mt-2.5 block h-3.5 w-[34%] animate-pulse rounded-sm bg-chip motion-reduce:animate-none" />
                <span className="mt-2.5 block h-3 w-[48%] animate-pulse rounded-sm bg-chip motion-reduce:animate-none" />
              </div>
              <span className="block h-11 w-[200px] max-w-full animate-pulse rounded-sm bg-chip motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
      )}

      {error && !loading && !hasList && (
        <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-10 text-center">
          <h2 className="text-[19px] font-bold text-ink">Your alerts couldn&apos;t be loaded right now</h2>
          <p className="max-w-[460px] text-[15px] text-muted-foreground">Nothing is lost. Try again in a moment.</p>
          <button type="button" onClick={() => refetch()} className={OUTLINE_BTN}>
            Try again
          </button>
        </section>
      )}

      {!loading && hasList && sort === 'date' && pageRows.length > 0 && (
        <>
          <ul aria-label="Alerts, newest first" className="m-0 list-none rounded-card border border-line bg-surface px-5 shadow-sm">
            {pageRows.map((a) => (
              <AlertRow key={a.id} alert={a} label={labelFor(a.listing.platform)} isNew={newIds.has(a.id)} onDismiss={onDismiss} />
            ))}
          </ul>
          {shown.length > pageRows.length && (
            <div className="flex flex-col items-center gap-1 pt-1">
              <button type="button" onClick={() => setShownCount((n) => n + PAGE)} className={OUTLINE_BTN}>
                Show 20 more
              </button>
              <p className="text-sm text-muted-foreground">
                Showing {pageRows.length} of {shown.length} alerts
              </p>
            </div>
          )}
        </>
      )}

      {!loading && hasList && sort === 'book' && books.length > 0 && (
        <div className="flex flex-col gap-3">
          {books.map((b) => {
            const open = !prefs.isGroupCollapsed(b.id)
            const s = searchesById.get(b.id)
            return (
              <section key={b.id} className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => prefs.toggleGroupCollapsed(b.id)}
                  className="flex min-h-14 w-full items-center gap-3 bg-transparent py-2 pl-5 pr-4 text-left text-base font-bold leading-[1.3] text-ink"
                >
                  <span className="min-w-0 flex-auto">
                    <span>{b.title}</span>
                    {s && <span className="block text-[13px] font-medium text-muted-foreground">{searchDetail(s)}</span>}
                  </span>
                  <span
                    aria-label={`${b.alerts.length} ${b.alerts.length === 1 ? 'alert' : 'alerts'}`}
                    className="min-w-7 flex-none rounded-full bg-chip px-2 py-px text-center text-[13px] font-bold"
                  >
                    {b.alerts.length}
                  </span>
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
                    className={`flex-none text-muted-foreground transition-transform motion-reduce:transition-none ${open ? '' : '-rotate-90'}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {open && (
                  <ul className="m-0 list-none border-t border-line px-5">
                    {b.alerts.map((a) => (
                      <AlertRow
                        key={a.id}
                        alert={a}
                        label={labelFor(a.listing.platform)}
                        isNew={newIds.has(a.id)}
                        inBook
                        onDismiss={onDismiss}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      {empty && (
        <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-10 text-center">
          <BellIcon />
          <h2 className="text-[19px] font-bold text-ink">{words.heading}</h2>
          <p className="max-w-[460px] text-[15px] text-muted-foreground">{words.body}</p>
          {words.filteredOut ? (
            <button type="button" onClick={onClear} className={OUTLINE_BTN}>
              Clear filters
            </button>
          ) : (
            <Link href="/searches" className={OUTLINE_BTN}>
              Back to Searches
            </Link>
          )}
        </section>
      )}
    </div>
  )
}

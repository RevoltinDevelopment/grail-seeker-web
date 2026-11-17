'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ArchivedAlertRow } from '@/components/alerts/AlertRow'
import { AlertsFilterBar, type BooksState } from '@/components/alerts/AlertsFilterBar'
import { useArchiveGroups } from '@/hooks/useArchiveGroups'
import { useArchivedAlerts } from '@/hooks/useArchivedAlerts'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useUiPreferences } from '@/hooks/useUiPreferences'
import { archiveSubtitle, marketplaceOptions, searchDetail, searchName, type MatchFilter } from '@/lib/alertRows'
import { alertsAPI } from '@/lib/api/alerts'
import { searchesAPI } from '@/lib/api/searches'

import type { AlertsSortMode } from '@/lib/api/user'
import type { GrailSearch } from '@/types/search.types'

/**
 * Story 1.98 (U-12): the archive, as drawn in alerts-archive.html. Each archived alert says why it
 * is there, with the right link; rows share Story 1.96's body, so grade, page quality, price and a
 * near miss read as on Alerts. The archive has no size ceiling, so it pages on the server: By date
 * asks for 20 more at a time; By book reads the list of books (deleted searches included) and each
 * open book pages its own alerts. By book opens with every book closed. No "New" here and no seen
 * reports: the count of new alerts is of active alerts only (Decision #103).
 */
const PAGE = 20

/** Every archived alert, unfiltered, for "3 of your 12" (the same key Alerts reads for its button). */
const ARCHIVED_COUNT_KEY = ['alerts', 'archived-count'] as const

const OUTLINE_BTN =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline hover:bg-chip'

const LIST = 'm-0 list-none rounded-card border border-line bg-surface px-5 shadow-sm'

const MATCH_TYPE = { all: 'all', within: 'direct_match', near: 'near_miss' } as const

function ArchiveIcon() {
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
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />
      </svg>
    </span>
  )
}

function Skeleton() {
  return (
    <ul aria-busy="true" aria-label="Loading archived alerts" className={LIST}>
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
  )
}

/** A failed read, as drawn: the information banner (Story 1.83's info tone), never the error's text. */
function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      aria-labelledby="archive-error-h"
      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-card border border-line-strong bg-surface p-4 text-ink tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:px-6 tablet:py-5"
    >
      <div className="pt-0.5 text-info-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h2 id="archive-error-h" className="text-card-title font-bold leading-[1.3]">
          We couldn&apos;t load your archive
        </h2>
        <p className="text-[15px]">Your archived alerts are safe. Try again in a moment.</p>
      </div>
      <div className="col-span-2 flex items-center tablet:col-span-1">
        <button type="button" onClick={onRetry} className={OUTLINE_BTN}>
          Try again
        </button>
      </div>
    </section>
  )
}

function ShowMore({
  shown,
  total,
  loading,
  failed,
  onMore,
}: {
  shown: number
  total: number
  loading: boolean
  /** The last read failed while rows stayed on screen (review) */
  failed: boolean
  onMore: () => void
}) {
  if (shown >= total) return null
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <button type="button" onClick={onMore} disabled={loading} className={`${OUTLINE_BTN} disabled:opacity-60`}>
        {loading ? 'Loading…' : failed ? 'Try again' : 'Show 20 more'}
      </button>
      <p role="status" className="text-sm text-muted-foreground">
        {failed && !loading ? 'Those alerts couldn’t be loaded.' : `Showing ${shown} of ${total} archived alerts`}
      </p>
    </div>
  )
}

/** One open book's archived alerts, paged on their own. Mounted only while the book is open. */
function BookAlerts({
  searchId,
  platform,
  matchType,
  labelFor,
}: {
  searchId: string
  platform: string
  matchType: (typeof MATCH_TYPE)[MatchFilter]
  labelFor: (slug: string) => string
}) {
  const [limit, setLimit] = useState(PAGE)
  const { data, isLoading, isFetching, error, moreFailed, refetch } = useArchivedAlerts({ searchId, platform, matchType, limit })
  if (isLoading) return <p className="border-t border-line px-5 py-4 text-sm text-muted-foreground">Loading…</p>
  if (error && !data)
    return (
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 text-sm text-muted-foreground">
        <span>These alerts couldn&apos;t be loaded.</span>
        <button type="button" onClick={() => refetch()} className="font-semibold text-link underline underline-offset-[3px]">
          Try again
        </button>
      </div>
    )
  const alerts = data?.alerts ?? []
  return (
    <div className="border-t border-line">
      <ul className="m-0 list-none px-5">
        {alerts.map((a) => (
          <ArchivedAlertRow key={a.id} alert={a} label={labelFor(a.listing.platform)} inBook />
        ))}
      </ul>
      <ShowMore
        shown={alerts.length}
        total={data?.pagination.total ?? 0}
        loading={isFetching}
        failed={moreFailed}
        onMore={() => (moreFailed ? refetch() : setLimit((n) => n + PAGE))}
      />
    </div>
  )
}

/**
 * Keyed by the search it shows, so following "See the newer alert" to another search's archive starts
 * afresh: no filter, page size or open books carried over (review).
 */
export default function ArchiveClient() {
  const searchId = useSearchParams().get('search')
  return <Archive key={searchId ?? ''} searchId={searchId} />
}

function Archive({ searchId }: { searchId: string | null }) {
  const context = !!searchId

  const [market, setMarket] = useState('all')
  const [match, setMatch] = useState<MatchFilter>('all')
  const [limit, setLimit] = useState(PAGE)
  // By book opens with every book closed, on every visit (as drawn; not stored)
  const [openBooks, setOpenBooks] = useState<Set<string>>(new Set())

  const { archiveSort, setArchiveSort, isLoaded: prefsLoaded } = useUiPreferences()
  const sort: AlertsSortMode = context ? 'date' : archiveSort
  const matchType = MATCH_TYPE[match]

  const { groups: platformGroups, displayNameFor } = usePlatforms()
  const { data: searchList, isSuccess: searchesLoaded } = useQuery({ queryKey: ['searches'], queryFn: searchesAPI.list })
  const { data: all } = useQuery({
    queryKey: ARCHIVED_COUNT_KEY,
    queryFn: () => alertsAPI.list({ status: 'archived', limit: 1 }),
  })

  const dated = useArchivedAlerts({ platform: market, matchType, searchId: searchId ?? undefined, limit })
  const books = useArchiveGroups({ platform: market, matchType }, { enabled: sort === 'book' })

  const searchesById = useMemo(
    () => new Map<string, GrailSearch>((searchList?.searches ?? []).map((s) => [s.id, s])),
    [searchList]
  )
  const loaded = useMemo(() => dated.data?.alerts ?? [], [dated.data])
  const markets = useMemo(
    () => marketplaceOptions(platformGroups.flatMap((g) => g.platforms), loaded),
    [platformGroups, loaded]
  )
  const labelFor = (slug: string) => markets.find((m) => m.slug === slug)?.label ?? displayNameFor(slug)

  const filtered = market !== 'all' || match !== 'all'
  const isBook = sort === 'book'
  const loading = !prefsLoaded || (isBook ? books.isLoading : dated.isLoading)
  const failed = isBook ? !!books.error && books.groups.length === 0 : !!dated.error && !dated.data
  const shownCount = isBook ? books.groups.reduce((n, g) => n + g.count, 0) : (dated.data?.pagination.total ?? 0)
  const contextSearch = searchId ? searchesById.get(searchId) : undefined
  const contextFallback = searchId ? loaded[0]?.search : undefined
  const allCount = context ? (contextSearch?.archivedAlertCount ?? null) : (all?.pagination.total ?? null)
  const empty = !loading && !failed && shownCount === 0

  const booksState: BooksState | undefined = isBook && books.groups.length
    ? books.groups.every((g) => openBooks.has(g.searchId))
      ? 'open'
      : books.groups.every((g) => !openBooks.has(g.searchId))
        ? 'closed'
        : 'mixed'
    : undefined

  const reset = () => setLimit(PAGE)
  const onMarket = (slug: string) => {
    setMarket(slug)
    reset()
  }
  const onMatch = (m: MatchFilter) => {
    setMatch(m)
    reset()
  }
  const onClear = () => {
    setMarket('all')
    setMatch('all')
    reset()
  }
  const onSort = (s: AlertsSortMode) => {
    setArchiveSort(s)
    reset()
  }
  const toggleBook = (id: string) =>
    setOpenBooks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const onToggleBooks = () =>
    setOpenBooks(booksState === 'closed' ? new Set(books.groups.map((g) => g.searchId)) : new Set())

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <div>
        <Link href="/alerts" className="inline-flex min-h-9 items-center text-[15px] font-semibold text-link no-underline hover:underline">
          ← Back to Alerts
        </Link>
        <h1 className="mt-1 text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
          Archived alerts
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {failed
            ? isBook
              ? 'Grouped by book' // as drawn
              : 'Your archive couldn’t be loaded'
            : archiveSubtitle({ loading, context, shownCount, allCount, filtered })}
        </p>
      </div>

      {context && (
        <section
          aria-label="Showing one search"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-card border-[1.5px] border-line-strong bg-surface px-4 py-3.5"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Archived alerts for one search</p>
            {contextSearch ? (
              <>
                <p className="text-[17px] font-bold leading-[1.3] text-ink">{searchName(contextSearch)}</p>
                <p className="text-sm text-muted-foreground">{searchDetail(contextSearch)}</p>
              </>
            ) : (
              contextFallback && <p className="text-[17px] font-bold leading-[1.3] text-ink">{searchName(contextFallback)}</p>
            )}
          </div>
          <Link href="/alerts/archive" className={OUTLINE_BTN}>
            All archived alerts
          </Link>
        </section>
      )}

      {!(allCount === 0 && shownCount === 0 && !filtered) && (
        <AlertsFilterBar
          markets={markets}
          market={market}
          match={match}
          onMarket={onMarket}
          onMatch={onMatch}
          onClear={onClear}
          sort={context ? undefined : sort}
          onSort={context ? undefined : onSort}
          books={booksState}
          onToggleBooks={onToggleBooks}
        />
      )}

      {loading && <Skeleton />}

      {!loading && failed && <LoadError onRetry={() => (isBook ? books.refetch() : dated.refetch())} />}

      {!loading && !failed && !isBook && loaded.length > 0 && (
        <div>
          <ul aria-label="Archived alerts, newest first" className={LIST}>
            {loaded.map((a) => (
              <ArchivedAlertRow key={a.id} alert={a} label={labelFor(a.listing.platform)} />
            ))}
          </ul>
          <ShowMore
            shown={loaded.length}
            total={dated.data?.pagination.total ?? 0}
            loading={dated.isFetching}
            failed={dated.moreFailed}
            onMore={() => (dated.moreFailed ? dated.refetch() : setLimit((n) => n + PAGE))}
          />
        </div>
      )}

      {!loading && !failed && isBook && books.groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {books.groups.map((g) => {
            const open = openBooks.has(g.searchId)
            const s = searchesById.get(g.searchId)
            const sub = s ? searchDetail(s) : searchesLoaded ? 'Search deleted' : ''
            return (
              <section key={g.searchId} className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggleBook(g.searchId)}
                  className="flex min-h-14 w-full items-center gap-3 bg-transparent py-2 pl-5 pr-4 text-left text-base font-bold leading-[1.3] text-ink"
                >
                  <span className="min-w-0 flex-auto">
                    <span>{g.title}</span>
                    {sub && <span className="block text-[13px] font-medium text-muted-foreground">{sub}</span>}
                  </span>
                  <span
                    aria-label={`${g.count} ${g.count === 1 ? 'archived alert' : 'archived alerts'}`}
                    className="min-w-7 flex-none rounded-full bg-chip px-2 py-px text-center text-[13px] font-bold"
                  >
                    {g.count}
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
                  <BookAlerts
                    key={`${g.searchId}:${market}:${matchType}`}
                    searchId={g.searchId}
                    platform={market}
                    matchType={matchType}
                    labelFor={labelFor}
                  />
                )}
              </section>
            )
          })}
        </div>
      )}

      {empty && (
        <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-10 text-center">
          <ArchiveIcon />
          <h2 className="text-[19px] font-bold text-ink">
            {filtered ? 'No archived alerts match these filters' : 'Nothing archived yet'}
          </h2>
          <p className="max-w-[460px] text-[15px] text-muted-foreground">
            {filtered
              ? 'Your other archived alerts are hidden by the filters.'
              : 'An alert moves here when its listing sells or ends, or when you dismiss it. Your archive keeps the history of every find.'}
          </p>
          {filtered ? (
            <button type="button" onClick={onClear} className={OUTLINE_BTN}>
              Clear filters
            </button>
          ) : (
            <Link href="/alerts" className={OUTLINE_BTN}>
              Back to Alerts
            </Link>
          )}
        </section>
      )}
    </div>
  )
}

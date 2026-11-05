'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

import { BackToSearches, BUTTON_OFF } from '@/components/search/SearchFormLayout'
import { independentShopsOf, SearchCard } from '@/components/searches/SearchCard'
import { useAccountSummary } from '@/hooks/useAccountSummary'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useSearches } from '@/hooks/useSearches'
import { listBanners, NUDGE_DISMISS_KEY, type Banner } from '@/lib/attention'
import { PAGE_HREF } from '@/lib/built-pages'
import {
  heldBackLine,
  planFacts,
  planMeter,
  slotRows,
  slotsNote,
  type Fate,
  type MeterSeg,
  type SlotRow,
} from '@/lib/planPage'

/**
 * Story 1.85 (S-10): "Your plan" (plan-page-*.html, approved by Mahan 2026-10-21; plan-page.js).
 * The plan and its facts; "Needs your attention", every banner that applies, left out when none
 * does; the numbered slots as a list, with Edit and Delete on every search; and the held searches.
 * Reached from the avatar menu ("Plan and slots"), "View plan" and "Manage slots".
 */

const SUPPORT = 'support@grailseeker.io'

const OUTLINE =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline hover:bg-chip'
const FILLED =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline'
const QUIET =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-transparent bg-transparent px-[18px] text-[15px] font-semibold text-danger disabled:opacity-60'
const PANEL =
  'flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface px-4 py-5 shadow-sm tablet:px-6'
const SECTION_TITLE = 'text-[19px] font-bold text-ink'
const SMALL_CAPS = 'text-xs font-semibold uppercase tracking-[.04em] text-muted-foreground'

const svg = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const ToneIcon = ({ tone }: { tone: Banner['tone'] }) =>
  tone === 'hold' ? (
    <svg {...svg}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ) : tone === 'attention' ? (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ) : (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </svg>
  )
const TONE_ICON = {
  hold: 'text-hold-line',
  attention: 'text-attention-line',
  info: 'text-info-icon',
}

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
)
const FateIcon = ({ kind }: { kind: Fate['kind'] }) =>
  kind === 'stops' ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  ) : kind === 'continues' ? (
    <svg {...svg} width={16} height={16} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ) : (
    <svg {...svg} width={16} height={16}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
const FATE_ICON = { stops: 'text-over', continues: 'text-primary', undecided: 'text-ink' }

const SEG: Record<MeterSeg, string> = {
  in: 'border-primary bg-primary',
  paused: 'border-muted-foreground bg-seg-other',
  free: 'border-muted-foreground bg-surface',
  over: 'seg-over',
}

/** On the plan page an action that leads to the plan page itself is left out; "#..." is on Searches. */
function actionOf(banner: Banner) {
  const a = banner.action
  if (!a || a.href === PAGE_HREF.plan) return null
  return { ...a, href: a.href.startsWith('#') ? `/searches${a.href}` : a.href }
}

function Skeleton() {
  const bar = 'block animate-pulse rounded-button bg-chip motion-reduce:animate-none'
  return (
    <div role="status" className="flex flex-col gap-5">
      <span className="sr-only">Loading your plan</span>
      <span aria-hidden="true" className={`${bar} h-[34px] w-[220px]`} />
      <div
        className="grid gap-5 desktop:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        aria-hidden="true"
      >
        <div className={PANEL}>
          <span className={`${bar} h-3 w-[90px]`} />
          <span className={`${bar} h-7 w-[160px]`} />
          <span className={`${bar} h-[60px] w-full`} />
          <span className={`${bar} h-11 w-[140px]`} />
        </div>
        <div className={PANEL}>
          <span className={`${bar} h-[18px] w-[180px]`} />
          <span className={`${bar} h-4 w-full`} />
          <span className={`${bar} h-4 w-4/5`} />
        </div>
      </div>
      <div className={PANEL} aria-hidden="true">
        <span className={`${bar} h-[18px] w-[140px]`} />
        <span className={`${bar} h-14 w-full`} />
        <span className={`${bar} h-14 w-full`} />
        <span className={`${bar} h-14 w-full`} />
      </div>
    </div>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <BackToSearches />
      {children}
    </div>
  )
}

function Title() {
  return (
    <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
      Your plan
    </h1>
  )
}

export function PlanPage() {
  const { account, isLoading, refetch } = useAccountSummary()
  const { searches, isLoading: searchesLoading, error: searchesError, deleteSearch } = useSearches()
  const { groups, defaultEnabledSlugs } = usePlatforms()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const queryClient = useQueryClient()
  // Code review: a nudge dismissed on Searches stays dismissed here, for the session
  const [nudgeDismissed, setNudgeDismissed] = useState(true)
  useEffect(() => {
    setNudgeDismissed(sessionStorage.getItem(NUDGE_DISMISS_KEY) === 'true')
  }, [])

  if (isLoading || searchesLoading) {
    return (
      <Frame>
        <Skeleton />
      </Frame>
    )
  }

  // Code review: a failed refresh with the page's data still in hand keeps the page; only data that
  // never arrived is a failure, and Try again asks for both again
  if (!account || (searchesError && searches.length === 0)) {
    return (
      <Frame>
        <Title />
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface px-5 py-4 text-[15px] text-ink"
        >
          <p>Your plan could not be loaded.</p>
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

  const facts = planFacts(account, searches)
  if (!facts) {
    return (
      <Frame>
        <Title />
        <section className={PANEL}>
          <p className="text-[15px] text-ink">Your account does not have a plan yet.</p>
          <p className="text-sm text-muted-foreground">
            Until checkout arrives, Grail Seeker sets plans for you: write to{' '}
            <a href={`mailto:${SUPPORT}`} className="font-semibold text-link">
              {SUPPORT}
            </a>
            .
          </p>
        </section>
      </Frame>
    )
  }

  const lapsed = account.status === 'lapsed'
  const attention = listBanners({ account, searches, defaultEnabledSlugs, nudgeDismissed })
  const two = attention.length > 0
  const rows = slotRows(account, searches)
  const meter = planMeter(account)
  const byId = new Map(searches.map((s) => [s.id, s]))
  const held = account.heldSearches.flatMap((h) => {
    const s = byId.get(h.searchId)
    return s ? [{ view: h, search: s }] : []
  })
  const independentShops = independentShopsOf(groups)

  const handleDelete = async (id: string) => {
    setDeleteFailed(false)
    try {
      await deleteSearch.mutateAsync(id)
      setConfirmId(null)
    } catch {
      setDeleteFailed(true)
    }
  }

  return (
    <Frame>
      <Title />

      <div
        className={`grid items-start gap-5 ${two ? 'desktop:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''}`}
      >
        <section className={PANEL} aria-labelledby="pp-plan">
          <p
            id="pp-plan"
            className="text-xs font-bold uppercase tracking-[.06em] text-muted-foreground"
          >
            Plan
          </p>
          <p className="text-[26px] font-bold leading-[1.15] text-ink">{facts.name}</p>
          <dl
            className={`m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 ${two ? '' : 'desktop:grid-cols-4'}`}
          >
            {(
              [
                ['Slots', facts.slots],
                ['Texts', facts.texts],
                ['In use', facts.inUse],
                ['Free', facts.free],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className={SMALL_CAPS}>{k}</dt>
                <dd className="m-0 text-base font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {facts.next && (
            <p className="rounded-lg border border-line-strong px-3 py-2.5 text-sm text-ink">
              {facts.next}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              aria-disabled="true"
              aria-describedby="pp-change"
              className={`${BUTTON_OFF} self-start`}
              onClick={(e) => e.preventDefault()}
            >
              Change plan
            </button>
            <p id="pp-change" className="text-sm text-muted-foreground">
              Changing plan opens here when checkout arrives. Until then, Grail Seeker changes plans
              for you: write to{' '}
              <a href={`mailto:${SUPPORT}`} className="font-semibold text-link">
                {SUPPORT}
              </a>
              .
            </p>
          </div>
        </section>

        {two && (
          <section className={PANEL} aria-labelledby="pp-att">
            <h2 id="pp-att" className={SECTION_TITLE}>
              Needs your attention
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {attention.map((b) => {
                const action = actionOf(b)
                return (
                  <li
                    key={b.state}
                    className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-line py-3.5 first:border-t-0 first:pt-1"
                  >
                    <span className={`pt-px ${TONE_ICON[b.tone]}`}>
                      <ToneIcon tone={b.tone} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold leading-[1.35] text-ink">{b.heading}</h3>
                      {b.paragraphs.map((p) => (
                        <p key={p} className="mt-0.5 text-sm text-ink">
                          {p}
                        </p>
                      ))}
                      {b.due && (
                        <span className="mt-1 inline-block rounded-md border border-attention-line bg-attention px-2 py-px text-[13px] font-bold text-attention-ink">
                          {b.due}
                        </span>
                      )}
                    </div>
                    {action && (
                      <div className="col-start-2 flex flex-wrap gap-2">
                        <Link href={action.href} className={action.filled ? FILLED : OUTLINE}>
                          {action.label}
                        </Link>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      <section aria-labelledby="pp-slots" className="flex flex-col gap-3">
        <div>
          <h2 id="pp-slots" className={SECTION_TITLE}>
            Your slots
          </h2>
          {!lapsed && <p className="mt-0.5 text-sm text-muted-foreground">{slotsNote(account)}</p>}
        </div>
        {deleteFailed && (
          <p role="alert" className="text-[15px] font-semibold text-danger">
            The search could not be deleted. Try again.
          </p>
        )}
        {lapsed ? (
          <p className="rounded-card border border-line bg-background px-4 py-3 text-sm text-muted-foreground">
            While your searches are on hold they use no slots. When your subscription is active
            again, every search comes back, just as you left it.
          </p>
        ) : (
          <>
            <div
              role="img"
              aria-label={meter.label}
              className="flex min-w-0 flex-nowrap items-center gap-1"
            >
              {meter.inside.map((kind, i) => (
                <span
                  key={`i${i}`}
                  data-seg={kind}
                  className={`h-[14px] min-w-[5px] shrink basis-[22px] rounded-[3px] border-[1.5px] ${SEG[kind]}`}
                />
              ))}
              <span
                className="mx-1 h-[26px] w-0.5 flex-none rounded-sm bg-ink"
                data-testid="limit"
              />
              {Array.from({ length: meter.beyond }, (_, i) => (
                <span
                  key={`b${i}`}
                  data-seg="over"
                  className={`h-[14px] min-w-[5px] shrink basis-[22px] rounded-[3px] border-[1.5px] ${SEG.over}`}
                />
              ))}
            </div>
            <ul
              className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-[13px] text-muted-foreground"
              aria-hidden="true"
            >
              {meter.legend.map((l) => (
                <li key={l.text} className="inline-flex items-center gap-1.5">
                  <span
                    className={`inline-block h-[11px] w-[14px] rounded-[3px] border-[1.5px] ${SEG[l.seg]}`}
                  />
                  {l.text}
                </li>
              ))}
            </ul>
            <ol
              className="m-0 list-none overflow-hidden rounded-card border border-line bg-surface p-0 shadow-sm"
              aria-label="Your slots, numbered"
            >
              {rows.map((row, i) => (
                <SlotListRow
                  key={row.kind === 'search' ? row.id : `${row.kind}${i}`}
                  row={row}
                  confirming={row.kind === 'search' && confirmId === row.id}
                  deleting={deleteSearch.isPending}
                  onAskDelete={(id) => {
                    setDeleteFailed(false)
                    setConfirmId(id)
                  }}
                  onCancelDelete={() => {
                    setDeleteFailed(false)
                    setConfirmId(null)
                  }}
                  onDelete={(id) => void handleDelete(id)}
                />
              ))}
            </ol>
          </>
        )}
      </section>

      {held.length > 0 && (
        <section aria-labelledby="pp-held" className="flex flex-col gap-3">
          <div>
            <h2 id="pp-held" className={SECTION_TITLE}>
              On hold
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              A search on hold is not searched and uses no slots. Nothing has been deleted, and its
              alerts are kept.
            </p>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {held.map(({ view, search }) => (
              <SearchCard
                key={search.id}
                search={{ ...search, held: true, heldReason: view.heldReason }}
                independentShops={independentShops}
                toggling={false}
                refused={null}
                confirmingDelete={confirmId === search.id}
                deleting={deleteSearch.isPending}
                onToggle={() => {}}
                onAskDelete={() => {
                  setDeleteFailed(false)
                  setConfirmId(search.id)
                }}
                onCancelDelete={() => {
                  setDeleteFailed(false)
                  setConfirmId(null)
                }}
                onDelete={() => void handleDelete(search.id)}
                backLine={heldBackLine(account, view)}
                showHeldPause
              />
            ))}
          </div>
        </section>
      )}
    </Frame>
  )
}

function SlotListRow({
  row,
  confirming,
  deleting,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  row: SlotRow
  confirming: boolean
  deleting: boolean
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (id: string) => void
}) {
  const ROW =
    'grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1 border-t border-line px-4 py-3.5 first:border-t-0 tablet:grid-cols-[72px_minmax(0,1fr)_auto]'
  const NUMBER =
    'grid min-h-10 place-items-center whitespace-nowrap rounded-lg border-[1.5px] px-1.5 text-[15px] font-bold tabular-nums'
  const ACTIONS =
    'col-start-2 mt-1 flex flex-wrap gap-2 tablet:col-start-3 tablet:row-span-3 tablet:row-start-1 tablet:mt-0 tablet:self-center'

  if (row.kind === 'line') {
    return (
      <li
        aria-label={row.text}
        className="flex items-center gap-3 border-t border-line bg-background px-4 py-2.5 text-[13px] font-bold uppercase tracking-[.04em] text-ink"
      >
        <span aria-hidden="true" className="h-0.5 flex-1 rounded-sm bg-ink" />
        <span>{row.text}</span>
        <span aria-hidden="true" className="h-0.5 flex-1 rounded-sm bg-ink" />
      </li>
    )
  }

  if (row.kind === 'free') {
    return (
      <li className={ROW}>
        <span className={`${NUMBER} border-dashed border-muted-foreground text-muted-foreground`}>
          <span aria-hidden="true">{row.number}</span>
          <span className="sr-only">{row.numberLabel}</span>
        </span>
        <div>
          <p className="text-base font-semibold leading-[1.35] text-muted-foreground">Free</p>
          <p className="text-sm text-muted-foreground">{row.meta}</p>
        </div>
        <div className={ACTIONS}>
          <Link href="/searches/new" className={OUTLINE}>
            New search
          </Link>
        </div>
      </li>
    )
  }

  return (
    <li className={`${ROW} ${row.paused ? 'bg-paused' : ''}`}>
      <span
        className={`${NUMBER} ${
          row.over
            ? 'border-over bg-attention text-ink'
            : row.paused
              ? 'border-muted-foreground text-ink'
              : 'border-primary text-ink'
        }`}
      >
        {/* Code review: aria-label on a plain span is ignored; the words are read instead */}
        <span aria-hidden="true">{row.number}</span>
        <span className="sr-only">{row.numberLabel}</span>
      </span>
      <div>
        <p
          className={`text-base font-bold leading-[1.35] ${row.paused ? 'text-muted-foreground' : 'text-ink'}`}
        >
          {row.title}
        </p>
        <p className="text-sm text-muted-foreground">{row.meta}</p>
        {row.paused && (
          <p className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold text-ink">
            <span className="mt-[3px] flex-none">
              <PauseIcon />
            </span>
            <span>{row.paused}</span>
          </p>
        )}
        {row.fate && (
          <p
            className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold text-ink"
            data-fate={row.fate.kind}
          >
            <span className={`mt-[3px] flex-none ${FATE_ICON[row.fate.kind]}`}>
              <FateIcon kind={row.fate.kind} />
            </span>
            <span>{row.fate.text}</span>
          </p>
        )}
      </div>
      {confirming ? (
        <div className={ACTIONS} role="group" aria-label={`Delete ${row.title}?`}>
          <p className="w-full text-sm font-semibold text-ink">Delete this search?</p>
          <button
            type="button"
            className={QUIET}
            onClick={() => onDelete(row.id)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button type="button" className={OUTLINE} onClick={onCancelDelete}>
            Cancel
          </button>
        </div>
      ) : (
        <div className={ACTIONS}>
          <Link
            href={`/searches/${row.id}/edit`}
            className={OUTLINE}
            aria-label={`Edit ${row.title}`}
          >
            Edit
          </Link>
          <button
            type="button"
            className={QUIET}
            onClick={() => onAskDelete(row.id)}
            aria-label={`Delete ${row.title}`}
          >
            Delete
          </button>
        </div>
      )}
    </li>
  )
}

'use client'

import Link from 'next/link'

import { CORE_MARKETPLACES } from '@/lib/marketplaceNames'
import { formatGrade, formatIssueNumber, formatSeriesShort } from '@/lib/utils/series-formatter'

import type { GrailSearch } from '@/types/search.types'

/**
 * Story 1.83 (U-05): the search card, as approved in session 3 and section 15
 * (searches-home.html, searches-pause-held.html). Running has no label; paused is recessed with
 * "Paused by you on Oct 12." and Resume as the one filled button; on hold has the dashed border,
 * the bar with the lock and its reason, and only View and Delete.
 */

export interface IndependentShops {
  label: string
  /** The shops, in the registry's order: each one's slug and its name for a subscriber */
  shops: readonly { slug: string; name: string }[]
}

/**
 * Below this many shops, the card names each shop a search covers ("Comic Book Addiction"); from
 * this many, one chip counts them ("Independent shops (3 of 5)"). Mahan, 2026-11-04: a name tells a
 * subscriber more than a count, and launch will likely have fewer than five.
 */
export const NAME_SHOPS_BELOW = 5

interface SearchCardProps {
  search: GrailSearch
  independentShops: IndependentShops | null
  /** The pause or resume in flight for this card */
  toggling: boolean
  /** Pause met a hold: the refused line's words, or null */
  refused: string | null
  confirmingDelete: boolean
  deleting: boolean
  onToggle: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}

// Story 1.84: the names are shared with the search form's Search Platforms
const CORE_CHIPS = CORE_MARKETPLACES

// Dates of account events (a pause, a hold) read in Eastern, as the banner's do (review).
const ZONE_OPTS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  timeZone: 'America/New_York',
}
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', ZONE_OPTS)
const timeOf = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

/** "today at 9:04 AM", "yesterday at 7:02 PM", "Oct 12 at 9:04 AM" */
export function dayAndTime(iso: string, now: Date = new Date()): string {
  const at = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const startOfAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
  const day =
    at >= startOfToday && at < startOfTomorrow
      ? 'today'
      : at >= startOfYesterday && at < startOfToday
        ? 'yesterday'
        : at >= startOfTomorrow && at < startOfAfter
          ? 'tomorrow'
          : at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) // the subscriber's own clock, as the time is
  return `${day} at ${timeOf(at)}`
}

export function gradeText(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Any'
  if (min !== null && max !== null && Number(min) === Number(max)) return formatGrade(min)
  return `${formatGrade(min ?? 0.5)} to ${formatGrade(max ?? 10)}`
}

export function chipsFor(
  search: Pick<GrailSearch, 'platforms'>,
  shops: IndependentShops | null
): string[] {
  const chips = CORE_CHIPS.filter((c) => search.platforms.includes(c.slug)).map((c) => c.label)
  if (shops && shops.shops.length > 0) {
    const covered = shops.shops.filter((s) => search.platforms.includes(s.slug))
    if (shops.shops.length < NAME_SHOPS_BELOW) {
      chips.push(...covered.map((s) => s.name))
    } else if (covered.length > 0) {
      const total = shops.shops.length
      chips.push(
        `${shops.label} (${covered.length === total ? total : `${covered.length} of ${total}`})`
      )
    }
  }
  return chips
}

function heldReasonText(search: GrailSearch): string {
  const since = search.heldAt ? `Since ${shortDate(search.heldAt)}` : ''
  if (search.heldReason === 'downgrade')
    return since
      ? `${since}, when your plan moved to fewer slots.`
      : 'Your plan moved to fewer slots.'
  // A lapse's cause comes with billing (S-21); until then the date alone (Story 1.83, decision 4).
  return since ? `${since}.` : ''
}

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
)
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
)

const BTN =
  'inline-flex min-h-touch min-w-0 flex-1 basis-0 items-center justify-center gap-2 rounded-button border-[1.5px] px-2.5 text-[15px] font-semibold no-underline disabled:opacity-60'
const OUTLINE = `${BTN} border-line-strong bg-surface text-ink`
const FILLED = `${BTN} border-transparent bg-primary text-primary-foreground`
const QUIET = `${BTN} border-transparent bg-transparent text-danger`

export function SearchCard(props: SearchCardProps) {
  const { search } = props
  const held = !!search.held
  const paused = !held && !search.isActive
  const title = `${search.series.title} ${formatIssueNumber(search.issueNumber, search.issueVolumeText)}`
  const slots = search.slotsUsed ?? 0
  const current = search.currentAlertCount ?? 0
  const archived = search.archivedAlertCount ?? 0

  return (
    <article
      className={`flex flex-col gap-3.5 overflow-hidden rounded-card p-5 ${
        held
          ? 'border-2 border-dashed border-hold-line bg-surface'
          : paused
            ? 'border border-line bg-paused'
            : 'border border-line bg-surface shadow-sm'
      }`}
      data-state={held ? 'held' : paused ? 'paused' : 'running'}
    >
      {held && (
        <div className="-mx-5 -mt-5 flex items-start gap-2.5 bg-hold px-5 py-3 text-sm leading-[1.4] text-hold-ink">
          <svg
            className="flex-none"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span>
            <strong className="block text-[15px]">On hold</strong>
            {heldReasonText(search)}
          </span>
        </div>
      )}

      {/* Always present, so screen readers announce the line when it appears */}

      <div role="status" aria-live="polite" className="contents">
        {props.refused && (
          <p className="flex items-start gap-2 rounded-button bg-ink px-3 py-2 text-sm font-semibold text-background">
            <svg
              className="mt-0.5 flex-none"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            {props.refused}
          </p>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 border-b border-rule pb-3">
        <h3
          className={`text-card-title font-bold leading-[1.3] ${paused ? 'text-muted-foreground' : 'text-ink'}`}
        >
          {title}
        </h3>
        <p className="row-span-2 whitespace-nowrap text-right text-[13px] leading-[1.2] text-muted-foreground">
          <b className="block text-[22px] leading-[1.1] text-ink">{held ? 0 : slots}</b>
          {(held ? 0 : slots) === 1 ? 'slot' : 'slots'}
          {held && <span className="mt-0.5 block text-xs font-semibold">needs {slots}</span>}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{formatSeriesShort(search.series)}</p>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div>
          <dt className="text-label font-semibold uppercase text-muted-foreground">Grade</dt>
          <dd className="m-0 text-[15px] font-semibold text-ink">
            {gradeText(search.gradeMin, search.gradeMax)}
          </dd>
        </div>
        <div>
          <dt className="text-label font-semibold uppercase text-muted-foreground">Graded by</dt>
          <dd className="m-0 text-[15px] font-semibold text-ink">
            {search.gradingAuthority ? search.gradingAuthority.toUpperCase() : 'Any'}
          </dd>
        </div>
        <div>
          <dt className="text-label font-semibold uppercase text-muted-foreground">Max price</dt>
          <dd className="m-0 text-[15px] font-semibold text-ink">
            {search.maxPrice ? `$${search.maxPrice.toLocaleString('en-US')}` : 'Any'}
          </dd>
        </div>
        {/* Kept from the old card (Redesign Keeps Function); not in the session 3 drawing */}
        {search.pageQuality && (
          <div>
            <dt className="text-label font-semibold uppercase text-muted-foreground">Pages</dt>
            <dd className="m-0 text-[15px] font-semibold text-ink">{search.pageQuality}</dd>
          </div>
        )}
      </dl>

      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Where it looks">
        {chipsFor(search, props.independentShops).map((chip) => (
          <li
            key={chip}
            className={`rounded-md px-2 py-[3px] text-[13px] text-ink ${paused ? 'border border-line-strong bg-transparent' : 'bg-chip'}`}
          >
            {chip}
          </li>
        ))}
      </ul>

      {paused && (
        <p className="flex items-start gap-2 text-sm font-semibold text-ink">
          <span className="mt-[3px] flex-none">
            <PauseIcon />
          </span>
          <span>
            {search.pausedAt ? `Paused by you on ${shortDate(search.pausedAt)}.` : 'Paused by you.'}
          </span>
        </p>
      )}
      {!held && !paused && (
        <p className="text-sm text-muted-foreground">
          {search.lastCheckedAt
            ? `Checked ${dayAndTime(search.lastCheckedAt)}`
            : search.nextScheduledRunAt
              ? `First check ${dayAndTime(search.nextScheduledRunAt)}`
              : 'Not checked yet'}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        {current === 0 && archived === 0 ? (
          '0 alerts'
        ) : (
          <>
            {current > 0 && (
              <Link href={`/alerts?search=${search.id}`} className="font-semibold text-link">
                {current} {current === 1 ? 'alert' : 'alerts'}
              </Link>
            )}
            {current > 0 && archived > 0 && ' + '}
            {archived > 0 && (
              <Link
                href={`/alerts/archive?search=${search.id}`}
                className="font-semibold text-link"
              >
                {archived} archived
              </Link>
            )}
          </>
        )}
      </p>

      {props.confirmingDelete ? (
        <div className="mt-auto flex flex-col gap-2" role="group" aria-label={`Delete ${title}?`}>
          <p className="text-sm font-semibold text-ink">Delete this search?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={QUIET}
              onClick={props.onDelete}
              disabled={props.deleting}
            >
              {props.deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button type="button" className={OUTLINE} onClick={props.onCancelDelete}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex gap-2">
          {held ? (
            <Link href={`/searches/${search.id}/edit`} className={OUTLINE}>
              View
            </Link>
          ) : (
            <>
              <Link href={`/searches/${search.id}/edit`} className={OUTLINE}>
                Edit
              </Link>
              <button
                type="button"
                className={paused ? FILLED : OUTLINE}
                onClick={props.onToggle}
                disabled={props.toggling}
                aria-label={`${paused ? 'Resume' : 'Pause'} ${title}`}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
                {paused ? 'Resume' : 'Pause'}
              </button>
            </>
          )}
          <button
            type="button"
            className={QUIET}
            onClick={props.onAskDelete}
            aria-label={`Delete ${title}`}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

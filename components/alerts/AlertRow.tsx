'use client'

import Link from 'next/link'

import {
  archiveReason,
  archiveWhereLine,
  bookTitle,
  gradeLine,
  nearMissFlag,
  priceText,
  rowName,
  whereLine,
  type ArchiveIcon,
} from '@/lib/alertRows'

import type { Alert } from '@/types/alert.types'

/** A row's frame: the alert's details on the left, its actions on the right (under them on a phone). */
const ROW =
  'grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line py-4 first:border-t-0 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center tablet:gap-x-6'

/** Every action column is 280 pixels on desktop, so the buttons line up down the list. */
const ACTIONS = 'flex flex-col items-stretch gap-0.5 tablet:w-[280px]'

function ExternalIcon() {
  return (
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
      className="flex-none"
    >
      <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  )
}

/**
 * Story 1.96 (U-11), shared with the archive by Story 1.98 (U-12): what a row says about its alert.
 * The book, grade (grading company, grade, page quality) and price, the listing's own title, where
 * and when, a near miss marked; "New" for the visit on Alerts. In By book the group header names the
 * book, so the row starts at the grade. `children` adds lines under it (the archive's reason).
 */
export function AlertRowBody({
  alert,
  where,
  isNew = false,
  inBook = false,
  children,
}: {
  alert: Alert
  where: string
  isNew?: boolean
  inBook?: boolean
  children?: React.ReactNode
}) {
  const grade = gradeLine(alert)
  const flag = nearMissFlag(alert)
  const newLabel = isNew ? (
    <span className="ml-1.5 inline-block rounded-sm border border-link bg-primary-tint px-[7px] align-[2px] text-xs font-bold leading-5 text-link">
      New
    </span>
  ) : null
  const detail = (
    <>
      {grade && <>{grade} · </>}
      <b className="font-bold tabular-nums">{priceText(alert)}</b>
    </>
  )

  return (
    <div>
      {inBook ? (
        <p className="text-[15px] text-ink">
          {detail}
          {newLabel}
        </p>
      ) : (
        <>
          <p className="text-base font-bold leading-[1.35] text-ink">
            {bookTitle(alert)}
            {newLabel}
          </p>
          <p className="mt-0.5 text-[15px] text-ink">{detail}</p>
        </>
      )}
      <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{alert.listing.title}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{where}</p>
      {flag && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-line-strong px-2 py-0.5 text-[13px] font-semibold text-ink">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="flex-none text-muted-foreground"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          {flag}
        </p>
      )}
      {children}
    </div>
  )
}

/**
 * Story 1.96 (U-11): one alert on Alerts, as a row in the Latest matches family (alerts-list.html).
 * One View button per row, every one the width of the longest label ("View on Comic Book
 * Addiction", 280 pixels on desktop; full width on a phone), with Dismiss as a link under it.
 */
export function AlertRow({
  alert,
  label,
  isNew,
  inBook = false,
  onDismiss,
}: {
  alert: Alert
  /** The marketplace's name, as the subscriber reads it */
  label: string
  isNew: boolean
  inBook?: boolean
  onDismiss: (alert: Alert) => void
}) {
  return (
    <li className={ROW}>
      <AlertRowBody alert={alert} where={whereLine(alert, label)} isNew={isNew} inBook={inBook} />
      <div className={ACTIONS}>
        {alert.listing.url && (
          <a
            href={alert.listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-touch items-center justify-center gap-2 rounded-button bg-primary px-3.5 py-2 text-center text-[15px] font-semibold leading-tight text-primary-foreground no-underline"
          >
            View on {label}
            <ExternalIcon />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => onDismiss(alert)}
          aria-label={`Dismiss ${rowName(alert)}`}
          className="min-h-9 self-center bg-transparent px-2.5 text-sm font-semibold text-link underline underline-offset-[3px]"
        >
          Dismiss
        </button>
      </div>
    </li>
  )
}

const REASON_ICON: Record<ArchiveIcon, string> = {
  sold: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  ended: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  dismissed: 'M6 6l12 12M18 6L6 18',
  replaced: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  removed: 'M5 5l14 14M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
}

const OUTLINE =
  'inline-flex min-h-touch items-center justify-center gap-2 rounded-button border-[1.5px] border-line-strong bg-surface px-3.5 py-2 text-center text-[15px] font-semibold leading-tight text-ink no-underline hover:bg-chip'

/**
 * Story 1.98 (U-12): one archived alert (alerts-archive.html). The same body as Alerts, "alert Oct
 * 25" for when it was found, then why it is archived, and the one link that fits: the sold or ended
 * listing, the newer alert, the listing for a dismissed one, nothing for a removed one.
 */
export function ArchivedAlertRow({ alert, label, inBook = false }: { alert: Alert; label: string; inBook?: boolean }) {
  const reason = archiveReason(alert, label)
  const action = reason.action
  return (
    <li className={ROW}>
      <AlertRowBody alert={alert} where={archiveWhereLine(alert, label)} inBook={inBook}>
        <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-ink">
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
            className="mt-0.5 flex-none text-muted-foreground"
          >
            <path d={REASON_ICON[reason.icon]} />
          </svg>
          <span>{reason.text}</span>
        </p>
      </AlertRowBody>
      {action && (
        <div className={ACTIONS}>
          {action.kind === 'listing' ? (
            <a href={action.href} target="_blank" rel="noopener noreferrer" className={OUTLINE}>
              {action.label}
              <ExternalIcon />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={action.href} className={OUTLINE}>
              {action.label}
            </Link>
          )}
        </div>
      )}
    </li>
  )
}

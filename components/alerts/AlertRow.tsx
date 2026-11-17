'use client'

import {
  bookTitle,
  gradeLine,
  nearMissFlag,
  priceText,
  rowName,
  whereLine,
} from '@/lib/alertRows'

import type { Alert } from '@/types/alert.types'

/**
 * Story 1.96 (U-11): one alert, as a row in the Latest matches family (alerts-list.html). The book,
 * grade and price, the listing's own title, where and when; a near miss marked; "New" for the
 * visit. One View button per row, every one the width of the longest label ("View on Comic Book
 * Addiction", 280 pixels on desktop; full width on a phone), with Dismiss as a link under it.
 * In By book the group header names the book, so the row starts at the grade.
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
    <li className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-line py-4 first:border-t-0 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center tablet:gap-x-6">
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
        <p className="mt-1 text-[13px] text-muted-foreground">{whereLine(alert, label)}</p>
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
      </div>
      <div className="flex flex-col items-stretch gap-0.5 tablet:w-[280px]">
        {alert.listing.url && (
          <a
            href={alert.listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-touch items-center justify-center gap-2 rounded-button bg-primary px-3.5 py-2 text-center text-[15px] font-semibold leading-tight text-primary-foreground no-underline"
          >
            View on {label}
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

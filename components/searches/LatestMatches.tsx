'use client'

import Link from 'next/link'

import { useAlerts } from '@/hooks/useAlerts'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useReportSeen } from '@/hooks/useUnseenAlerts'
import { matchTime } from '@/lib/utils/match-time'
import { formatGrade, formatIssueNumber } from '@/lib/utils/series-formatter'

import type { Alert } from '@/types/alert.types'

/**
 * Story 1.82 (U-04): Latest matches, which replaces the Dashboard's recent alerts
 * (searches-home.html). The three latest active alerts, "All alerts", and the alerts it showed
 * reported as seen (Decision #103). It also carries the realtime subscription with toasts on,
 * so a match found while Searches is open says so.
 */
const SHOWN = 3

function gradeAndPrice(alert: Alert): string {
  const grade = alert.listing.grade
    ? [alert.listing.gradingAuthority?.toUpperCase(), formatGrade(alert.listing.grade)]
        .filter(Boolean)
        .join(' ')
    : ''
  let price = `$${alert.listing.price.toLocaleString()}`
  // A MyComicShop auction not yet started carries a placeholder price; like the alert card, say
  // when it starts beside it, so the book never looks free (Story 1.34).
  if (alert.listing.auctionStartTime) {
    const starts = new Date(alert.listing.auctionStartTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    price = `${price}, auction starts ${starts}`
  }
  return grade ? `${grade} · ${price}` : price
}

export function LatestMatches({ className = '' }: { className?: string }) {
  const { alerts, isLoading, error } = useAlerts(
    { limit: SHOWN, status: 'active' },
    { enableToasts: true }
  )
  const { displayNameFor } = usePlatforms()
  const shown = alerts.slice(0, SHOWN)
  useReportSeen(shown.map((a) => a.id))

  return (
    <aside
      className={`flex flex-col gap-2 rounded-card border border-line bg-surface px-5 py-4 shadow-sm ${className}`}
      aria-labelledby="latest-matches-h"
    >
      <h2 id="latest-matches-h" className="text-card-title font-bold text-ink">
        Latest matches
      </h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading matches...</p>
      ) : error ? (
        <p className="text-sm text-muted-foreground">
          Your latest matches could not be loaded. They are on Alerts.
        </p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No matches yet. We&apos;re checking the marketplaces for your searches, and you&apos;ll be
          told the moment we find one.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {shown.map((alert) => (
            <li key={alert.id} className="border-b border-line py-3">
              <p className="text-[15px] font-semibold text-ink">
                {alert.search.series.title}{' '}
                {formatIssueNumber(alert.search.issueNumber, alert.search.issueVolumeText)}
              </p>
              <p className="mt-0.5 text-sm text-ink">{gradeAndPrice(alert)}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {displayNameFor(alert.listing.platform)} · {matchTime(alert.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/alerts"
        className="inline-flex min-h-11 items-center text-[15px] font-semibold text-link"
      >
        All alerts
      </Link>
    </aside>
  )
}

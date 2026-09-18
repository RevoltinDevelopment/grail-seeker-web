'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { usePlatforms } from '@/hooks/usePlatforms'
import type { GrailSearch } from '@/types/search.types'

// sessionStorage (not localStorage): dismissal lasts for the browser session,
// so the nudge reappears at next login (review C1: login-time nudge)
const DISMISS_KEY = 'platform-nudge-dismissed'

interface PlatformNudgeBannerProps {
  searches: GrailSearch[]
}

/**
 * Dismissible dashboard banner shown when any active search has a marketplace
 * platform turned off (review C1). Chosen over a modal per Session 74 design
 * notes — informative, not blocking.
 */
export function PlatformNudgeBanner({ searches }: PlatformNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(true) // hidden until mounted to avoid SSR flash
  // Story 1.49 (code review correction): checks every DEFAULT-ENABLED
  // registry platform, Core and Independent Shops alike -- confirmed policy
  // is "treat Independent Shops exactly like Core," and Core's own slugs
  // are always defaultEnabled, so comparing against defaultEnabledSlugs
  // (identical to comparing against every slug, for Core) is the correct
  // generalization. Comparing against every registry slug unconditionally
  // was wrong: architecture.md seeds a new Independent Shop row
  // default_enabled=false until Mahan flips it, and this banner would have
  // nagged every existing search about a shop deliberately not yet turned
  // on for anyone -- the exact silent-regression class this review caught.
  const { defaultEnabledSlugs } = usePlatforms()

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  const affected = searches.filter(
    (s) => s.isActive && defaultEnabledSlugs.some((p) => !s.platforms?.includes(p))
  )

  if (dismissed || affected.length === 0) {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 p-4">
      <span className="text-xl" aria-hidden="true">
        ⚠️
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900">
          {affected.length === 1
            ? '1 of your searches has a marketplace turned off.'
            : `${affected.length} of your searches have a marketplace turned off.`}{' '}
          You may be missing matches for your grails.
        </p>
        <Link
          href="/searches"
          className="mt-1 inline-block text-sm font-semibold text-collector-blue hover:underline"
        >
          Review your searches →
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="rounded p-1 text-amber-700 transition-colors hover:bg-amber-100"
      >
        ✕
      </button>
    </div>
  )
}

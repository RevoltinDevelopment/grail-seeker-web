import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { alertsAPI } from '@/lib/api/alerts'

/**
 * Story 1.82 (Decision #103): the count of new alerts, for the header and the phone menu's dot.
 * Under the 'alerts' key, so everything that refreshes alerts (the realtime subscription, a mark)
 * refreshes the count too. A failed read shows no count rather than a wrong one.
 */
export const UNSEEN_COUNT_KEY = ['alerts', 'unseen-count'] as const

export function useUnseenCount(): number {
  const { data } = useQuery({
    queryKey: UNSEEN_COUNT_KEY,
    queryFn: () => alertsAPI.getUnseenCount(),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })
  return data?.unseen ?? 0
}

/** The server takes at most 200 ids a call (Story 1.80). */
const SEEN_BATCH = 200

/**
 * Story 1.82 (Decision #103): a page reports the alerts it showed. Each id is reported once per
 * page (a set that grows, as when "Load more" adds alerts, reports only the new ones), in batches
 * the server accepts, and only while the page is visible. Quietly: a failed report changes nothing
 * on the page, and its ids are tried again when the page is next visible. On success the count is
 * refreshed.
 */
export function useReportSeen(alertIds: readonly string[]): void {
  const queryClient = useQueryClient()
  const reported = useRef<Set<string>>(new Set())
  const key = [...new Set(alertIds)].sort().join(',')
  // Only what a person could see counts (review, 2026-11-04): a page in a background tab reports
  // nothing until it is visible again. Becoming visible also retries a failed report.
  const [visibleTick, setVisibleTick] = useState(0)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') setVisibleTick((t) => t + 1)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!key || document.visibilityState !== 'visible') return
    const fresh = key.split(',').filter((id) => !reported.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach((id) => reported.current.add(id))
    for (let i = 0; i < fresh.length; i += SEEN_BATCH) {
      const batch = fresh.slice(i, i + SEEN_BATCH)
      alertsAPI
        .markSeen(batch)
        .then((result) => {
          if (result.marked > 0) queryClient.invalidateQueries({ queryKey: UNSEEN_COUNT_KEY })
        })
        .catch(() => {
          batch.forEach((id) => reported.current.delete(id)) // tried again when the page is next visible
        })
    }
  }, [key, queryClient, visibleTick])
}

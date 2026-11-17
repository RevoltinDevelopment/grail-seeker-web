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
 * Story 1.97 (Decision #103, amended 2026-11-17): how long after the page opens, or after the
 * person last interacted with it, the page counts as attended. Rows the person asked for (Show 20
 * more, opening a book, a filter, the next page over the network) arrive inside it; an alert that
 * a round finds while the window sits open does not.
 */
export const PRESENCE_WINDOW_MS = 10_000

/**
 * The signs of a person (Story 1.97): a click or tap, a scroll by hand, a key, the window gaining
 * focus. Not the `scroll` event: the page also moves by itself (scroll anchoring when rows arrive
 * above, scrollIntoView, the browser restoring position), and an unattended page must not count
 * that. Becoming visible is a sign too, handled with the visibility listener.
 */
const DOCUMENT_SIGNS = ['pointerdown', 'wheel', 'touchmove', 'keydown'] as const

/**
 * Story 1.82 (Decision #103): a page reports the alerts it showed. Each id is reported once per
 * page (a set that grows, as when "Load more" adds alerts, reports only the new ones), in batches
 * the server accepts, and only while the page is visible. Quietly: a failed report changes nothing
 * on the page, and its ids are tried again at the next sign of the person. On success the count is
 * refreshed.
 *
 * Story 1.97 (amended Decision #103): ids are reported only while the person is there, meaning the
 * page became visible or was interacted with in the last PRESENCE_WINDOW_MS. Ids that reach the
 * page otherwise (a realtime refetch into a window left open) wait, still "new"; the next sign
 * reports every id on screen then. Pass null while the page's list is still loading: the window
 * that covers the opening starts when the list arrives.
 */
export function useReportSeen(alertIds: readonly string[] | null): void {
  const queryClient = useQueryClient()
  const reported = useRef<Set<string>>(new Set())
  const loaded = alertIds !== null
  const key = [...new Set(alertIds ?? [])].sort().join(',')
  // When the page stops counting as attended. The page "opens" when its list first arrives (null
  // means still loading, so a slow first read is still the opening, review 2026-11-17); a page
  // that opens hidden starts the window when it is first seen. Each sign restarts it.
  const presentUntil = useRef(0)
  const opened = useRef(false)
  // Ids held back, or a report that failed, wait for the next sign
  const waiting = useRef(false)
  // Bumped by each sign, so held-back ids (and a failed report) are reported then
  const [signTick, setSignTick] = useState(0)
  useEffect(() => {
    const onSign = () => {
      const lapsed = Date.now() >= presentUntil.current
      presentUntil.current = Date.now() + PRESENCE_WINDOW_MS
      // Re-render only when something may be waiting (review 2026-11-17): a scroll or typing fires
      // many signs a second, and each would otherwise re-render the whole list
      if (lapsed || waiting.current) setSignTick((t) => t + 1)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onSign()
    }
    const opts = { capture: true, passive: true } as const
    DOCUMENT_SIGNS.forEach((type) => document.addEventListener(type, onSign, opts))
    window.addEventListener('focus', onSign)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      DOCUMENT_SIGNS.forEach((type) => document.removeEventListener(type, onSign, opts))
      window.removeEventListener('focus', onSign)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (!opened.current) {
      opened.current = true
      if (document.visibilityState === 'visible') presentUntil.current = Math.max(presentUntil.current, Date.now() + PRESENCE_WINDOW_MS)
    }
    if (!key) return
    const fresh = key.split(',').filter((id) => !reported.current.has(id))
    if (fresh.length === 0) return
    if (document.visibilityState !== 'visible' || Date.now() >= presentUntil.current) {
      waiting.current = true // nobody there: wait for a sign
      return
    }
    waiting.current = false
    fresh.forEach((id) => reported.current.add(id))
    for (let i = 0; i < fresh.length; i += SEEN_BATCH) {
      const batch = fresh.slice(i, i + SEEN_BATCH)
      alertsAPI
        .markSeen(batch)
        .then((result) => {
          if (result.marked > 0) queryClient.invalidateQueries({ queryKey: UNSEEN_COUNT_KEY })
        })
        .catch(() => {
          batch.forEach((id) => reported.current.delete(id))
          waiting.current = true // tried again at the next sign
        })
    }
  }, [key, loaded, queryClient, signTick])
}

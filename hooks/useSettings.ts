'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { accountAPI, type CheckTimes, type QuietPreview } from '@/lib/api/account'
import { getUserPreferences, updateUserPreferences, type UserPreferences } from '@/lib/api/user'

/** Story 1.104: Settings reads the account's preferences once; each save writes its answer back here. */
export const PREFERENCES_KEY = ['user', 'preferences'] as const
export const CHECK_TIMES_KEY = ['account', 'check-times'] as const

export function usePreferences() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: getUserPreferences,
    staleTime: 60_000,
    retry: 1,
  })

  /**
   * Saves some fields; on success the cache takes the server's answer for those fields only. The
   * server answers its whole row, and two saves can be in flight at once (a switch and Save quiet
   * hours): taking only each save's own fields means an answer arriving late can't put back a field
   * another save changed (review, 2026-11-18). Throws on failure.
   */
  const save = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const answer = await updateUserPreferences(patch)
      const mine = Object.fromEntries(
        Object.keys(patch).map((k) => [k, answer.preferences[k as keyof UserPreferences]])
      ) as Partial<UserPreferences>
      queryClient.setQueryData(PREFERENCES_KEY, (old: UserPreferences | undefined) =>
        old ? { ...old, ...mine } : old
      )
      return answer.preferences
    },
    [queryClient]
  )

  /** Read again from the server (the consent time recorded by the phone step). */
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY }),
    [queryClient]
  )

  return {
    prefs: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    save,
    invalidate,
  }
}

/** When the searches are checked, for the saved quiet hours. */
export function useCheckTimes(enabled = true) {
  const query = useQuery({
    queryKey: CHECK_TIMES_KEY,
    queryFn: () => accountAPI.checkTimes(),
    staleTime: 5 * 60_000,
    retry: 1,
    enabled,
  })
  return { checkTimes: query.data ?? null, error: query.error, refetch: query.refetch }
}

/**
 * The same, for quiet hours being edited and not yet saved, asked of the server 300 ms after the
 * last change so the warning is the worker's own rule (Decision #108). While an answer is on its
 * way, the last one stays; a failed preview answers null (nothing false is shown). An answer to an
 * older edit never replaces a newer one.
 */
export function useQuietPreview(
  preview: QuietPreview | null,
  delayMs = 300
): CheckTimes | null | undefined {
  const [answer, setAnswer] = useState<CheckTimes | null | undefined>(undefined)
  const latest = useRef(0)
  const key = preview ? JSON.stringify(preview) : null

  useEffect(() => {
    if (!key) {
      // An answer still on its way is for hours no longer on screen (review, 2026-11-18)
      latest.current++
      setAnswer(undefined)
      return
    }
    const asked = ++latest.current
    const timer = setTimeout(() => {
      accountAPI
        .checkTimes(JSON.parse(key) as QuietPreview)
        .then((ct) => {
          if (asked === latest.current) setAnswer(ct)
        })
        .catch(() => {
          if (asked === latest.current) setAnswer(null)
        })
    }, delayMs)
    return () => clearTimeout(timer)
  }, [key, delayMs])

  return answer
}

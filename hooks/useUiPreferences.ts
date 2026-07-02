'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUserPreferences, updateUserPreferences } from '@/lib/api/user'
import type { AlertsUiPreferences, AlertsSortMode } from '@/lib/api/user'

const DEFAULT_PREFS: AlertsUiPreferences = {
  alertsSort: 'date',
  alertsCollapsedGroups: [],
}

export function useUiPreferences() {
  const [prefs, setPrefs] = useState<AlertsUiPreferences>(DEFAULT_PREFS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    getUserPreferences()
      .then((p) => {
        setPrefs({ ...DEFAULT_PREFS, ...p.uiPreferences })
      })
      .catch(() => {
        // silently fall back to defaults
      })
      .finally(() => setIsLoaded(true))
  }, [])

  const persist = useCallback((next: AlertsUiPreferences) => {
    updateUserPreferences({ uiPreferences: next }).catch(() => {
      // fire-and-forget; local state is already updated
    })
  }, [])

  const setAlertsSort = useCallback(
    (sort: AlertsSortMode) => {
      const next = { ...prefs, alertsSort: sort }
      setPrefs(next)
      persist(next)
    },
    [prefs, persist]
  )

  const toggleGroupCollapsed = useCallback(
    (searchId: string) => {
      const collapsed = prefs.alertsCollapsedGroups ?? []
      const next = {
        ...prefs,
        alertsCollapsedGroups: collapsed.includes(searchId)
          ? collapsed.filter((id) => id !== searchId)
          : [...collapsed, searchId],
      }
      setPrefs(next)
      persist(next)
    },
    [prefs, persist]
  )

  const isGroupCollapsed = useCallback(
    (searchId: string) => (prefs.alertsCollapsedGroups ?? []).includes(searchId),
    [prefs]
  )

  return {
    alertsSort: prefs.alertsSort ?? 'date',
    isGroupCollapsed,
    setAlertsSort,
    toggleGroupCollapsed,
    isLoaded,
  }
}

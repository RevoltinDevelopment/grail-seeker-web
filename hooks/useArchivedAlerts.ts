import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

import { alertsAPI, type AlertFilters } from '@/lib/api/alerts'

import type { AlertListResponse } from '@/types/alert.types'

export type ArchivedParams = Pick<AlertFilters, 'platform' | 'matchType' | 'searchId' | 'limit'>

/**
 * Story 1.98 (U-12): a page of archived alerts, newest first. A plain query, with no realtime
 * subscription (useAlerts opens one per call, and each open book would add its own). Under the
 * 'alerts' key, so a dismissal or a new round elsewhere refreshes it. "Show 20 more" asks for a
 * larger page; the rows already shown stay on screen while it loads, and stay if it fails
 * (`moreFailed`, review). A change of filter never keeps the old rows.
 */
export function useArchivedAlerts(params: ArchivedParams) {
  const { platform, matchType, searchId, limit } = params
  const filters = { platform, matchType, searchId }
  const filtersKey = JSON.stringify(filters)
  const query = useQuery<AlertListResponse>({
    queryKey: ['alerts', 'archived', filters, limit],
    queryFn: () => alertsAPI.list({ ...filters, limit, offset: 0, status: 'archived' }),
    placeholderData: (previous, previousQuery) => {
      const key = previousQuery?.queryKey as readonly unknown[] | undefined
      return key && JSON.stringify(key[2]) === filtersKey ? previous : undefined
    },
  })
  // The last page read for these filters, kept for a larger page that fails
  const lastGood = useRef<{ filters: string; data: AlertListResponse } | null>(null)
  if (query.data && !query.isPlaceholderData) lastGood.current = { filters: filtersKey, data: query.data }
  const kept = query.isError && !query.data && lastGood.current?.filters === filtersKey ? lastGood.current.data : undefined

  return {
    data: query.data ?? kept,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    /** A larger page failed; the rows shown are the last ones read */
    moreFailed: kept !== undefined,
    refetch: query.refetch,
  }
}

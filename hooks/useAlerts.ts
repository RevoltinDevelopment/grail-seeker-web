import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { alertsAPI, type AlertFilters } from '@/lib/api/alerts'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useAlerts(params?: AlertFilters, options?: { enableToasts?: boolean }) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsAPI.list(params),
  })

  // Subscribe to real-time updates for new alerts
  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = async () => {
      // Get current user to filter alerts
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Subscribe to search_results table for INSERT events
      channel = supabase
        .channel('search-results-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'search_results',
          },
          (payload) => {
            console.log('New alert received via Realtime:', payload)

            // Invalidate alerts query to refetch with new data
            queryClient.invalidateQueries({ queryKey: ['alerts'] })

            // Also invalidate searches to update alert counts
            queryClient.invalidateQueries({ queryKey: ['searches'] })

            // Dispatch custom event for toast notifications
            if (options?.enableToasts) {
              const event = new CustomEvent('new-alert', {
                detail: { alert: payload.new },
              })
              window.dispatchEvent(event)
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
    // Note: 'supabase' removed from deps - client is now a singleton and stable
  }, [queryClient, options?.enableToasts])

  return {
    alerts: data?.alerts || [],
    pagination: data?.pagination,
    isLoading,
    error,
  }
}

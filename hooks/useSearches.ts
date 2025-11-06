import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { searchesAPI } from '@/lib/api/searches'
import type {
  CreateSearchRequest,
  SearchListResponse,
  UpdateSearchRequest,
} from '@/types/search.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useSearches() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch all searches
  const { data, isLoading, error } = useQuery({
    queryKey: ['searches'],
    queryFn: searchesAPI.list,
  })

  // Subscribe to real-time updates for searches
  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Subscribe to user_grail_searches table for all change events
      channel = supabase
        .channel('searches-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'user_grail_searches',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Search changed via Realtime:', payload)

            // Invalidate searches query to refetch
            queryClient.invalidateQueries({ queryKey: ['searches'] })
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
    // Note: 'supabase' removed from deps - client is now a singleton and stable
  }, [queryClient])

  // Create search mutation
  const createSearch = useMutation({
    mutationFn: (searchData: CreateSearchRequest) => searchesAPI.create(searchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] })
    },
  })

  // Update search mutation
  const updateSearch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSearchRequest }) =>
      searchesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] })
    },
  })

  // Delete search mutation with optimistic update
  const deleteSearch = useMutation({
    mutationFn: (searchId: string) => searchesAPI.delete(searchId),
    onMutate: async (searchId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['searches'] })

      // Snapshot previous value
      const previousSearches = queryClient.getQueryData(['searches'])

      // Optimistically remove the search
      queryClient.setQueryData<SearchListResponse>(['searches'], (old) => {
        if (!old) return { searches: [] }
        return {
          ...old,
          searches: old.searches.filter((s) => s.id !== searchId),
        }
      })

      return { previousSearches }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSearches) {
        queryClient.setQueryData(['searches'], context.previousSearches)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] })
    },
  })

  // Pause/Resume search mutation
  const updateSearchStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      searchesAPI.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] })
    },
  })

  return {
    searches: data?.searches || [],
    isLoading,
    error,
    createSearch,
    updateSearch,
    deleteSearch,
    updateSearchStatus,
  }
}

// Hook for fetching a single search by ID
export function useSearch(id: string | null) {
  return useQuery({
    queryKey: ['searches', id],
    queryFn: () => searchesAPI.get(id!),
    enabled: !!id,
  })
}

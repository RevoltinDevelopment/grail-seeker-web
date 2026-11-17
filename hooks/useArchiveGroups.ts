import { useQuery } from '@tanstack/react-query'
import { alertsAPI, type AlertFilters } from '@/lib/api/alerts'

type ArchiveGroupsParams = Pick<AlertFilters, 'platform' | 'matchType'>

export function useArchiveGroups(params?: ArchiveGroupsParams, options?: { enabled?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    // Under 'alerts', so a dismissal or a new round refreshes the books and their counts too (review)
    queryKey: ['alerts', 'archive-groups', params],
    queryFn: () => alertsAPI.getArchiveGroups(params),
    enabled: options?.enabled ?? true,
  })

  return {
    groups: data?.groups || [],
    isLoading,
    error,
    refetch,
  }
}

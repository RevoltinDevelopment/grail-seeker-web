import { useQuery } from '@tanstack/react-query'
import { alertsAPI, type AlertFilters } from '@/lib/api/alerts'

type ArchiveGroupsParams = Pick<AlertFilters, 'platform' | 'matchType'>

export function useArchiveGroups(params?: ArchiveGroupsParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['archive-groups', params],
    queryFn: () => alertsAPI.getArchiveGroups(params),
  })

  return {
    groups: data?.groups || [],
    isLoading,
    error,
  }
}

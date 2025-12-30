import { useQuery } from '@tanstack/react-query'
import { alertsAPI } from '@/lib/api/alerts'

/**
 * Hook for fetching alert statistics (active, total, archivedThisWeek)
 * Used by Dashboard to show active alerts count
 */
export function useAlertStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alert-stats'],
    queryFn: () => alertsAPI.getStats(),
  })

  return {
    stats: data || { active: 0, total: 0, archivedThisWeek: 0 },
    isLoading,
    error,
  }
}

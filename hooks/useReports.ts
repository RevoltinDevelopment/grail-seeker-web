import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '@/lib/api/reports'

export function useReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.get(),
    // Reports data changes only when a monitoring run fires — 5 min stale time is fine
    staleTime: 5 * 60 * 1000,
  })

  return { report: data, isLoading, error }
}

export function useWeekReport(weekStart: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'week', weekStart],
    queryFn: () => reportsAPI.getWeek(weekStart),
    staleTime: Infinity, // past weeks never change
  })

  return { report: data, isLoading, error }
}

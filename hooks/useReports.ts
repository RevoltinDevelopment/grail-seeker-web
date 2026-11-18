import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '@/lib/api/reports'

/** Reports change only when a round runs, twice a day: 5 minutes stale is fine. */
const FIVE_MINUTES = 5 * 60 * 1000

export const REPORTS_KEY = ['reports'] as const

export function useReports() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: REPORTS_KEY,
    queryFn: () => reportsAPI.get(),
    staleTime: FIVE_MINUTES,
  })

  return { report: data, isLoading, error, refetch }
}

export function useWeekReport(weekStart: string, options: { enabled?: boolean } = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'week', weekStart],
    queryFn: () => reportsAPI.getWeek(weekStart),
    // A week's counts are fixed, but where each copy is now changes (sold, ended): 5 minutes (review)
    staleTime: FIVE_MINUTES,
    enabled: options.enabled ?? true,
    // A week outside the account's reports answers 400: asking again changes nothing (Story 1.100)
    retry: (count, err) => (err as { status?: number })?.status !== 400 && count < 2,
  })

  return { report: data, isLoading, error, refetch }
}

/** Story 1.100 (U-14): Books found, every copy since the account was made. */
export function useBooksFound() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'books-found'],
    queryFn: () => reportsAPI.getBooksFound(),
    staleTime: FIVE_MINUTES,
  })

  return { report: data, isLoading, error, refetch }
}

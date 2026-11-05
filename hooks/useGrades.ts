import { useQuery } from '@tanstack/react-query'
import { gradesAPI, type GradeOption } from '@/lib/api/grades'

/**
 * Story 1.84 (S-04): the standard grades, with their labels, from GET /api/grades.
 *
 * The list changes only by migration, so it is kept for an hour and not re-read when the window
 * regains focus. A failure is reported as a failure (the form says so and offers Try again); there
 * is no fallback list (S-04 AC 2).
 */
export function useGrades() {
  const { data, isPending, fetchStatus, isFetching, errorUpdatedAt, refetch } = useQuery({
    queryKey: ['grades'],
    queryFn: () => gradesAPI.list(),
    staleTime: 60 * 60 * 1000,
    // Code review: one quick retry, not React Query's three with backoff, so the failure shows
    // in about a second; the form offers Try again itself.
    retry: 1,
    // Code review: a failed list would otherwise be re-asked on every return to the tab, turning
    // Try again into "Trying again..." without the subscriber asking.
    refetchOnWindowFocus: false,
  })

  const grades: GradeOption[] | null = data?.grades && data.grades.length > 0 ? data.grades : null
  // Code review: offline, a first request is paused, not fetching; that is not loading, so the form
  // shows the failure and Try again instead of a Grade field with nothing in it.
  const isLoading = isPending && fetchStatus === 'fetching'

  return {
    /** The grades in the server's order, or null while loading or when they could not be loaded */
    grades,
    isLoading,
    /** No usable list and none on the way: a failed request, an empty answer, or a paused one */
    failed: !isLoading && grades === null,
    isRetrying: isFetching && !isLoading,
    /** Changes with each failed attempt, so the failure is announced again after a Try again */
    failedAt: errorUpdatedAt,
    retry: () => {
      void refetch()
    },
  }
}

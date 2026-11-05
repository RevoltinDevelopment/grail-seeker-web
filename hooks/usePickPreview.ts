import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { accountAPI } from '@/lib/api/account'

/**
 * Story 1.86 (S-12): what the current choice would do, from POST /api/account/pick/preview. Read
 * again whenever the choice changes, or a search's slots do (a narrowing): the key carries both, and
 * the latest answer wins. While a new answer is on its way the previous one is kept, flagged as
 * placeholder, so a card never shows the old choice's fate as the new one's.
 */
export function usePickPreview(
  keepSearchIds: readonly string[],
  slotsSignature: string,
  enabled: boolean
) {
  const keep = [...keepSearchIds].sort()
  const q = useQuery({
    queryKey: ['pick-preview', keep, slotsSignature],
    queryFn: () => accountAPI.previewPick(keep),
    enabled,
    placeholderData: keepPreviousData,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  return {
    /** The answer for this exact choice, or null while it is on its way or when it failed */
    preview: q.data && !q.isPlaceholderData ? q.data : null,
    failed: q.isError && !q.isFetching,
    /** The refusal, so the screen can tell "nothing to pick any more" from a failure */
    error: q.error,
    retry: () => {
      void q.refetch()
    },
  }
}

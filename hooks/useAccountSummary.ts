import { useQuery } from '@tanstack/react-query'

import { accountAPI } from '@/lib/api/account'

/**
 * Story 1.83: the account's plan, slots and any change in hand. Its own key (review: under the
 * 'searches' prefix it would be caught by useSearches' prefix-wide cancel); useSearches refreshes
 * it after every search change.
 */
export const ACCOUNT_SUMMARY_KEY = ['account-summary'] as const

export function useAccountSummary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ACCOUNT_SUMMARY_KEY,
    queryFn: () => accountAPI.getEntitlement(),
    staleTime: 30_000,
  })
  return { account: data ?? null, isLoading, error }
}

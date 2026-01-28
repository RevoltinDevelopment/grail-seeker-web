'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook that handles secure logout by clearing all cached data before signing out.
 *
 * SECURITY: This hook exists to prevent cross-user data leakage.
 * Without clearing the React Query cache, a subsequent user logging in
 * on the same browser could briefly see the previous user's cached data
 * (searches, alerts, preferences) before fresh data is fetched.
 *
 * @returns Async logout function that clears cache and signs out
 */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return async () => {
    // CRITICAL: Clear ALL cached queries BEFORE signing out
    // This prevents the next user from seeing stale data
    queryClient.clear()

    // Sign out from Supabase (clears auth token)
    const supabase = createClient()
    await supabase.auth.signOut()

    // Redirect to login page
    router.push('/login')

    // Force a full page refresh to ensure all client state is cleared
    router.refresh()
  }
}

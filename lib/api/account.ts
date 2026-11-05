import { apiClient } from './client'

/**
 * Story 1.83: GET /api/account/entitlement, what the signed-in account has and uses (backend
 * Stories 1.72 to 1.81). The screens show these numbers and never work them out.
 */
export type SearchFate = 'continues' | 'stops' | 'undecided' | 'returns' | 'held'

export interface NumberedSearchView {
  searchId: string
  slots: number
  firstSlot: number
  lastSlot: number
  isActive: boolean
  fate: SearchFate | string
  fateAt: string | null
}

export interface HeldSearchView {
  searchId: string
  /** The slots it would use if it came back. */
  slots: number
  heldReason: 'lapse' | 'downgrade'
  /** As the subscriber left it: false when they had paused it before it was held. */
  isActive: boolean
  fate: SearchFate | string
  fateAt: string | null
}

export type AccountChange =
  | {
      kind: 'downgrade_pending'
      plan: { code: string; name: string; includedSlots: number }
      addonSlots: number
      slots: number
      effectiveAt: string
      keepSearchIds: string[]
    }
  | {
      kind: 'pick_needed'
      reason: 'first_plan' | 'reduce' | 'return'
      dueAt: string | null
      overdue: boolean
      slotsToFit: number
      pickedSearchIds: string[] | null
    }

export interface AccountSummary {
  plan: { code: string; name: string; includedSlots: number; textsIncluded: boolean } | null
  addonSlots: number
  status: 'active' | 'grace' | 'lapsed' | 'none' | string
  slots: { entitled: number; inUse: number; free: number; over: number }
  searches: NumberedSearchView[]
  heldSearches: HeldSearchView[]
  change: AccountChange | null
  enforcement: 'off' | 'observe' | 'enforce' | string
  nextRoundAt?: string
}

export const accountAPI = {
  getEntitlement: () => apiClient.get<AccountSummary>('/api/account/entitlement'),
}

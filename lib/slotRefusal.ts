import { APIError } from '@/lib/api/client'

/**
 * Story 1.85 (S-10, need 21): a refusal's details, read from the server's error object.
 *
 * SLOT_LIMIT_EXCEEDED (409) carries reason, needed, available, inUse and entitled beside code and
 * message (backend Story 1.74); SEARCH_HELD (409) carries heldReason (Story 1.73). The message is
 * the server's own words, and the form shows them as they are.
 */
export type SlotLimitReason = 'no_room' | 'over_plan' | 'no_plan' | 'on_hold'

export interface SlotRefusal {
  kind: 'slot_limit'
  /** Null if the server could not say why (it still refused) */
  reason: SlotLimitReason | null
  needed: number | null
  available: number | null
  inUse: number | null
  entitled: number | null
  message: string
}

export interface HeldRefusal {
  kind: 'held'
  heldReason: 'lapse' | 'downgrade' | null
  message: string
}

const REASONS: readonly SlotLimitReason[] = ['no_room', 'over_plan', 'no_plan', 'on_hold']
const count = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null)

export function readRefusal(error: unknown): SlotRefusal | HeldRefusal | null {
  if (!(error instanceof APIError)) return null
  const body = error.body ?? {}
  if (error.code === 'SLOT_LIMIT_EXCEEDED') {
    const reason = REASONS.includes(body.reason as SlotLimitReason)
      ? (body.reason as SlotLimitReason)
      : null
    return {
      kind: 'slot_limit',
      reason,
      needed: count(body.needed),
      available: count(body.available),
      inUse: count(body.inUse),
      entitled: count(body.entitled),
      message: error.message,
    }
  }
  if (error.code === 'SEARCH_HELD') {
    const r = body.heldReason
    return {
      kind: 'held',
      heldReason: r === 'lapse' || r === 'downgrade' ? r : null,
      message: error.message,
    }
  }
  return null
}

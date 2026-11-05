/**
 * Story 1.83: pages a banner or the slot strip may send a subscriber to, and whether each exists
 * yet. A button for a page not built is not shown (a subscriber is never sent to a page that does
 * not exist). S-10 switches the plan page on; S-12 the pick screen.
 */
export const BUILT_PAGES = {
  plan: true, // S-10 (Story 1.85): /plan
  pick: true, // S-12 (Story 1.86): /plan/choose
} as const

export const PAGE_HREF = {
  plan: '/plan',
  pick: '/plan/choose',
} as const

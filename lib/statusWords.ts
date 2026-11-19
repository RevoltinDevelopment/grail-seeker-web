/**
 * Story 1.105 (U-16): the words of the error and not-found pages, in one place so the four
 * files that show them can't drift apart. Drawn in errors-and-legal-pages.html; the support
 * line kept from today's pages (Mahan, 2026-11-19).
 */
export type StatusKind = 'error' | 'notFound'

export const STATUS_WORDS: Record<StatusKind, { title: string; body: string }> = {
  error: {
    title: 'Something went wrong',
    body: 'Your searches and alerts are safe, and we’ve been told about it.',
  },
  notFound: {
    title: 'We can’t find that page',
    body: 'The link may be old, or the address may have a typo.',
  },
}

export const RETRY_LABEL = 'Try again'
export const BACK_TO_SEARCHES = 'Back to Searches'
export const SUPPORT_LEAD = 'Still having trouble? Email'
export const SUPPORT_EMAIL = 'support@grailseeker.io'

import { linkLifeWords } from '@/lib/auth/linkLifetime'

/**
 * Story 1.106 (U-18, need 37): what sign-in and the password pages say when the sign-in provider
 * refuses, chosen by the provider's error code and never its message (the message is the
 * provider's English, written for developers). Drawn words from front-door-sign-in.html and
 * front-door-password.html; items 1 and 2 are undrawn, approved with the story.
 */
export type ProviderError = {
  code?: string
  message?: string
  name?: string
  status?: number
} | null

export interface NoticeWords {
  heading: string
  lines: readonly string[]
}

export const AUTH_WORDS = {
  wrong: {
    heading: "That email and password don't match",
    lines: ['Try again, or choose Forgot password to set a new one.'],
  },
  // Shown only when PAY_FIRST_SIGNUP is on (lib/front-door.ts)
  wrongPayer:
    'Just subscribed and never set a password? Forgot password sets your first one, using the email you paid with.',
  tooMany: {
    heading: 'Too many tries for now',
    lines: [
      'To keep your account safe, wait a few minutes before trying again, or choose Forgot password.',
    ],
  },
  offline: {
    heading: "We couldn't reach Grail Seeker",
    lines: ['Check your connection and try again.'],
  },
  failed: {
    heading: "Sign-in didn't work just now",
    lines: ['Try again in a moment. If it keeps happening, email support@grailseeker.io.'],
  },
  fromLink: "Sign in to continue. We'll take you straight back to the page you opened.",
} as const

/**
 * A failure that never reached the provider. supabase-js wraps a failed fetch as
 * AuthRetryableFetchError with status 0, or lets the fetch's TypeError through.
 */
export function isNetworkFailure(error: ProviderError | unknown): boolean {
  if (error instanceof TypeError) return true
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; status?: number }
  // supabase-js also names a 502/503/504 AuthRetryableFetchError, with its real status: that is
  // the provider failing, not the connection (code review)
  return e.status === 0 || (e.name === 'AuthRetryableFetchError' && !e.status)
}

function isRateLimit(error: ProviderError, code: string): boolean {
  return error?.code === code || error?.status === 429
}

/** Sign-in's refusal, as a notice. */
export function signInRefusal(error: ProviderError | unknown): {
  kind: 'wrong' | 'tooMany' | 'offline' | 'failed'
  words: NoticeWords
} {
  if (isNetworkFailure(error)) return { kind: 'offline', words: AUTH_WORDS.offline }
  const e = (error ?? null) as ProviderError
  if (e?.code === 'invalid_credentials') return { kind: 'wrong', words: AUTH_WORDS.wrong }
  if (isRateLimit(e, 'over_request_rate_limit'))
    return { kind: 'tooMany', words: AUTH_WORDS.tooMany }
  return { kind: 'failed', words: AUTH_WORDS.failed }
}

/**
 * Forgot password's answer. It never says whether the email has an account (AC 3): every outcome
 * but a lost connection shows "Check your email".
 *
 * Code review: the provider rate-limits a second request within a minute only for an address that
 * has an account (an unknown address always gets a quiet success), so the drawn "We've sent several
 * links already" would tell a stranger the account exists. A rate limit therefore reads as sent too;
 * the page's own 60-second countdown keeps a person from asking again too soon.
 */
export function forgotOutcome(error: ProviderError | unknown): 'sent' | 'offline' {
  if (error && isNetworkFailure(error)) return 'offline'
  return 'sent'
}

export const FORGOT_WORDS = {
  heading: 'Reset your password',
  lede: "Enter your email and we'll send you a link to set a new password.",
  // Shown only when PAY_FIRST_SIGNUP is on (lib/front-door.ts)
  payerFine:
    'Just subscribed and never set a password? Use the email you paid with, and the link sets your first one.',
  sentHeading: 'Check your email',
  sent: (email: string) =>
    `If an account uses ${email}, a link to set your password is on its way. The link works for ${linkLifeWords()}.`,
  nothing: 'Nothing after a few minutes? Check your spam folder, or send it again.',
  resent: 'Sent again. Only the newest link works.',
  expiredHeading: 'This link has expired',
  expiredLede: `Links to set a password work for ${linkLifeWords()}, and only once. Send yourself a new one.`,
} as const

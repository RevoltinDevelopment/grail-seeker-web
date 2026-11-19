import type { ProviderError } from '@/lib/auth/authErrorWords'

/**
 * The provider's refusal of a new password, in plain words. Story 1.89 wrote it for /welcome;
 * Story 1.106 moved it here so reset password says the same.
 */
export const PASSWORD_WORDS = {
  short: 'Choose a longer password, at least 8 characters.',
  weak: 'Choose a stronger password. That one is too easy to guess.',
  same: 'That is already your password. Choose a different one.',
  notSaved: 'Your password could not be saved. Try again.',
} as const

export function passwordRefusalWords(error: ProviderError): string {
  if (error?.code === 'same_password') return PASSWORD_WORDS.same
  if (error?.code === 'weak_password' || /password should|weak/i.test(error?.message ?? '')) {
    return /at least \d+ characters/i.test(error?.message ?? '')
      ? PASSWORD_WORDS.short
      : PASSWORD_WORDS.weak
  }
  return PASSWORD_WORDS.notSaved
}

/** The session the save needed is gone (expired, or signed out in another tab). */
export function sessionEnded(error: ProviderError): boolean {
  return error?.name === 'AuthSessionMissingError' || error?.status === 401
}

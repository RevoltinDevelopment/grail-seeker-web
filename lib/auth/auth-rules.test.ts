/** Story 1.106 (U-18): the words chosen from the provider's codes, the guards' rule, and the link's life. */
import { describe, expect, it } from 'vitest'

import {
  AUTH_WORDS,
  FORGOT_WORDS,
  forgotOutcome,
  isNetworkFailure,
  signInRefusal,
} from './authErrorWords'
import { doorStep, needsWelcome } from './door'
import { EMAIL_LINK_HOURS, linkLifeWords } from './linkLifetime'
import { hasRecoveryMark } from './recoveryMark'

describe('sign-in refusals (need 37)', () => {
  it('chooses by the code, never the message', () => {
    expect(
      signInRefusal({
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
        status: 400,
      }).kind
    ).toBe('wrong')
    expect(signInRefusal({ code: 'over_request_rate_limit', status: 429 }).kind).toBe('tooMany')
    expect(signInRefusal({ status: 429 }).kind).toBe('tooMany')
    expect(
      signInRefusal({ code: 'user_banned', message: 'User is banned', status: 400 }).kind
    ).toBe('failed')
    expect(signInRefusal({ message: 'Invalid login credentials' }).kind).toBe('failed')
    expect(signInRefusal({ status: 500 }).kind).toBe('failed')
  })

  it('a lost connection is said as one', () => {
    expect(isNetworkFailure(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkFailure({ name: 'AuthRetryableFetchError', status: 0 })).toBe(true)
    expect(isNetworkFailure({ name: 'AuthRetryableFetchError' })).toBe(true)
    expect(isNetworkFailure({ code: 'invalid_credentials', status: 400 })).toBe(false)
    // a 5xx from the provider is not a lost connection
    expect(isNetworkFailure({ name: 'AuthRetryableFetchError', status: 503 })).toBe(false)
    expect(signInRefusal({ name: 'AuthRetryableFetchError', status: 502 }).kind).toBe('failed')
    expect(forgotOutcome({ name: 'AuthRetryableFetchError', status: 504 })).toBe('sent')
    expect(signInRefusal(new TypeError('Failed to fetch')).kind).toBe('offline')
  })

  it("the drawn words, and the provider's never", () => {
    expect(signInRefusal({ code: 'invalid_credentials' }).words).toEqual(AUTH_WORDS.wrong)
    for (const words of [
      AUTH_WORDS.wrong,
      AUTH_WORDS.tooMany,
      AUTH_WORDS.offline,
      AUTH_WORDS.failed,
    ]) {
      expect(JSON.stringify(words)).not.toMatch(/credentials/i)
    }
  })
})

describe('forgot password never says who has an account (AC 3)', () => {
  it('every refusal but a lost connection reads as sent, a rate limit included', () => {
    expect(forgotOutcome(null)).toBe('sent')
    expect(forgotOutcome({ code: 'user_not_found', status: 400 })).toBe('sent')
    expect(forgotOutcome({ code: 'email_address_invalid', status: 400 })).toBe('sent')
    expect(forgotOutcome({ status: 500 })).toBe('sent')
    expect(forgotOutcome({ code: 'over_email_send_rate_limit', status: 429 })).toBe('sent')
    expect(forgotOutcome(new TypeError('Failed to fetch'))).toBe('offline')
  })

  it('the sent words are the same for any address, and name the real lifetime', () => {
    expect(FORGOT_WORDS.sent('a@example.com')).toBe(
      'If an account uses a@example.com, a link to set your password is on its way. The link works for 24 hours.'
    )
    expect(FORGOT_WORDS.expiredLede).toBe(
      'Links to set a password work for 24 hours, and only once. Send yourself a new one.'
    )
  })
})

describe('the link lifetime (one number)', () => {
  it("matches Supabase's Email OTP expiration, 24 hours since 2026-11-09", () => {
    expect(EMAIL_LINK_HOURS).toBe(24)
    expect(linkLifeWords()).toBe('24 hours')
    expect(linkLifeWords(1)).toBe('one hour')
  })
})

describe('the guards (need 39)', () => {
  const welcomed = {
    invited_at: '2026-11-12T00:00:00Z',
    user_metadata: { welcomed_at: '2026-11-12T00:01:00Z' },
  }
  const texts = { textsIncluded: true }
  const appOnly = { textsIncluded: false }

  it('an invitation never finished goes to /welcome first, whatever the plan', () => {
    const invited = { invited_at: '2026-11-12T00:00:00Z', user_metadata: {} }
    expect(needsWelcome(invited)).toBe(true)
    expect(doorStep(invited, texts)).toBe('welcome')
    expect(doorStep(invited, undefined)).toBe('welcome')
    expect(needsWelcome({ invited_at: null })).toBe(false)
    expect(needsWelcome(welcomed)).toBe(false)
  })

  it('no plan goes to the plan step', () => {
    expect(doorStep({}, null)).toBe('choose-plan')
    expect(doorStep(welcomed, null)).toBe('choose-plan')
  })

  it('a plan with texts and no verified number goes to the phone step', () => {
    expect(doorStep({ phone_confirmed_at: null }, texts)).toBe('verify-phone')
    expect(doorStep({ phone_confirmed_at: '2026-11-01T00:00:00Z' }, texts)).toBeNull()
    expect(doorStep({ phone_confirmed_at: null }, appOnly)).toBeNull()
  })

  it('a backend that cannot be read locks nobody out', () => {
    expect(doorStep({ phone_confirmed_at: null }, undefined)).toBeNull()
  })
})

describe('the recovery mark', () => {
  it('opens the form only for the account the link signed in', () => {
    expect(hasRecoveryMark('user-1', 'user-1')).toBe(true)
    expect(hasRecoveryMark('user-1', 'user-2')).toBe(false)
    expect(hasRecoveryMark(undefined, 'user-1')).toBe(false)
  })
})

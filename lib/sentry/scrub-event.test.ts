import { describe, expect, it } from 'vitest'

import { scrubAddress, scrubServerEvent } from './scrub-event'

import type { ErrorEvent } from '@sentry/nextjs'

// Story 1.77: what the server and edge configs send Sentry.
function event(overrides: Partial<ErrorEvent>): ErrorEvent {
  return { type: undefined, ...overrides } as ErrorEvent
}

describe('scrubServerEvent', () => {
  it('drops parsed cookies, which carry the Supabase session', () => {
    const scrubbed = scrubServerEvent(
      event({ request: { cookies: { 'sb-abc-auth-token': 'secret-jwt' }, method: 'GET' } })
    )
    expect(scrubbed.request?.cookies).toBeUndefined()
    expect(JSON.stringify(scrubbed)).not.toContain('secret-jwt')
  })

  it('masks sensitive headers whatever their case, and keeps the rest', () => {
    const scrubbed = scrubServerEvent(
      event({
        request: {
          headers: {
            Cookie: 'sb-abc-auth-token=secret-jwt',
            authorization: 'Bearer x',
            'user-agent': 'Safari',
          },
        },
      })
    )
    expect(scrubbed.request?.headers).toEqual({
      Cookie: '[FILTERED]',
      authorization: '[FILTERED]',
      'user-agent': 'Safari',
    })
  })

  it('filters the sign-in code in the request path the hook records', () => {
    const scrubbed = scrubServerEvent(
      event({ contexts: { nextjs: { request_path: '/auth/callback?code=abc123&next=/alerts' } } })
    )
    const path = (scrubbed.contexts?.nextjs as { request_path: string }).request_path
    expect(path).not.toContain('abc123')
    expect(path).toContain('next=%2Falerts')
  })

  it('filters sensitive values in the address and the query string', () => {
    const scrubbed = scrubServerEvent(
      event({
        request: {
          url: 'https://app.example/reset?token=t1&page=2',
          query_string: 'password=p1&tab=signup',
        },
      })
    )
    expect(scrubbed.request?.url).toBe('https://app.example/reset?token=%5BFILTERED%5D&page=2')
    expect(scrubbed.request?.query_string).toBe('password=%5BFILTERED%5D&tab=signup')
  })

  it('leaves an event without a request alone', () => {
    const original = event({ message: 'boom' })
    expect(scrubServerEvent(original)).toEqual(event({ message: 'boom' }))
  })
})

describe('scrubAddress', () => {
  it('leaves an address without sensitive values unchanged', () => {
    expect(scrubAddress('/alerts?search=abc')).toBe('/alerts?search=abc')
    expect(scrubAddress('/searches')).toBe('/searches')
  })

  it('keeps the fragment', () => {
    expect(scrubAddress('/x?code=1#top')).toBe('/x?code=%5BFILTERED%5D#top')
  })
})

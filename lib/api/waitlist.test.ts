/** Story 1.89 (U-09): the one call made with no session. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APIError } from './client'
import { joinWaitlist } from './waitlist'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const answer = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body })

describe('joinWaitlist', () => {
  it('posts the address as JSON to /api/waitlist with no Authorization header, and answers joined', async () => {
    answer(200, { status: 'joined' })
    await expect(joinWaitlist('ann@example.com')).resolves.toBe('joined')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/waitlist$/)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ email: 'ann@example.com' }))
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(Object.keys(init.headers)).not.toContain('Authorization')
  })

  it('answers already_on_list for a repeat', async () => {
    answer(200, { status: 'already_on_list' })
    await expect(joinWaitlist('ann@example.com')).resolves.toBe('already_on_list')
  })

  it.each([
    [400, 'INVALID_EMAIL', 'Enter an email address.'],
    [429, 'RATE_LIMITED', 'Too many tries just now. Please try again in an hour.'],
    [500, 'DATABASE_ERROR', 'We could not save your place just now. Please try again.'],
  ])("a %s is an APIError with the server's code %s and its words", async (status, code, message) => {
    answer(status, { error: { code, message } })
    await expect(joinWaitlist('ann@example.com')).rejects.toMatchObject({ status, code, message })
    await expect(joinWaitlist('ann@example.com')).rejects.toBeInstanceOf(APIError)
  })

  it('a failure with no JSON body is still an APIError with the status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('not json') } })
    await expect(joinWaitlist('ann@example.com')).rejects.toMatchObject({ status: 502, code: 'API_ERROR' })
  })

  it('an answer that is neither status is refused rather than trusted', async () => {
    answer(200, { status: 'maybe' })
    await expect(joinWaitlist('ann@example.com')).rejects.toMatchObject({ code: 'API_ERROR' })
  })

  it('offline: the fetch rejects and that rejection is passed on as it is', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(joinWaitlist('ann@example.com')).rejects.toBeInstanceOf(TypeError)
  })
})

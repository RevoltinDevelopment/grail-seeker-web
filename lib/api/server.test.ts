/** Story 1.106 (U-18): the guards' read of the plan, from the web server. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ captured: [] as unknown[] }))
vi.mock('@sentry/nextjs', () => ({ captureException: (e: unknown) => state.captured.push(e) }))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { readDoorAccount } from './server'

const supabaseWith = (token: string | null) =>
  ({
    auth: {
      getSession: async () => ({ data: { session: token ? { access_token: token } : null } }),
    },
  }) as never

const answer = (status: number, body: unknown) =>
  vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
  )

beforeEach(() => {
  state.captured = []
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readDoorAccount', () => {
  it('sends the session token and reads the plan, its name and the searches', async () => {
    const fetchMock = answer(200, {
      plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
      searches: [{}, {}],
      heldSearches: [{}],
    })
    vi.stubGlobal('fetch', fetchMock)
    expect(await readDoorAccount(supabaseWith('tok'))).toEqual({
      plan: { textsIncluded: true },
      searchCount: 3,
      planName: 'Collector',
    })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/api\/account\/entitlement$/)
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(init.cache).toBe('no-store')
  })

  it('no plan is null, not unread', async () => {
    vi.stubGlobal('fetch', answer(200, { plan: null, searches: [], heldSearches: [{}, {}] }))
    expect(await readDoorAccount(supabaseWith('tok'))).toEqual({
      plan: null,
      searchCount: 2,
      planName: null,
    })
  })

  it('a failure, an odd answer or no session is unread (nobody locked out), and Sentry hears of failures', async () => {
    vi.stubGlobal('fetch', answer(500, { error: {} }))
    expect((await readDoorAccount(supabaseWith('tok'))).plan).toBeUndefined()
    vi.stubGlobal('fetch', answer(200, { plan: { name: 'X' } }))
    expect((await readDoorAccount(supabaseWith('tok'))).plan).toBeUndefined()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('fetch failed')))
    )
    expect((await readDoorAccount(supabaseWith('tok'))).plan).toBeUndefined()
    expect(state.captured).toHaveLength(3)
    expect((await readDoorAccount(supabaseWith(null))).plan).toBeUndefined()
  })
})

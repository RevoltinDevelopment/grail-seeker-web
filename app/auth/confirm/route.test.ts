/** Story 1.89 (U-09): the server route that completes an emailed token-hash link. */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ verifyOtp: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp: state.verifyOtp } }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { GET } from './route'

const ORIGIN = 'https://app.grailseeker.io'
const get = (query: string) => GET(new Request(`${ORIGIN}/auth/confirm?${query}`))
const location = (res: Response) => res.headers.get('location')

beforeEach(() => {
  state.verifyOtp.mockReset().mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /auth/confirm', () => {
  it('an invitation: verifies the token hash as an invite through the server client, then goes to /welcome', async () => {
    const res = await get('token_hash=abc123&type=invite&next=/welcome')
    expect(state.verifyOtp).toHaveBeenCalledWith({ type: 'invite', token_hash: 'abc123' })
    expect(res.status).toBe(307)
    expect(location(res)).toBe(`${ORIGIN}/welcome`)
  })

  it('an invitation with no next still lands on /welcome', async () => {
    expect(location(await get('token_hash=abc123&type=invite'))).toBe(`${ORIGIN}/welcome`)
  })

  it('next is followed only inside the app: another site is ignored (Story 1.77)', async () => {
    expect(location(await get('token_hash=abc123&type=invite&next=https://evil.example/x'))).toBe(`${ORIGIN}/welcome`)
    expect(location(await get('token_hash=abc123&type=invite&next=//evil.example'))).toBe(`${ORIGIN}/welcome`)
    expect(location(await get('token_hash=abc123&type=recovery&next=/plan'))).toBe(`${ORIGIN}/plan`)
  })

  it('a failed invitation (expired, used) lands on the expired page, with nothing of the token in the address', async () => {
    state.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
    const res = await get('token_hash=abc123&type=invite&next=/welcome')
    expect(location(res)).toBe(`${ORIGIN}/welcome?error=link`)
    expect(location(res)).not.toContain('abc123')
  })

  it('a failed link of another type lands on sign-in, as the callback does', async () => {
    state.verifyOtp.mockResolvedValue({ error: { message: 'expired' } })
    expect(location(await get('token_hash=abc123&type=recovery'))).toBe(`${ORIGIN}/login?error=verification_failed`)
  })

  it('no token, or a type that is not an email type, is refused without calling the provider', async () => {
    expect(location(await get('type=invite'))).toBe(`${ORIGIN}/welcome?error=link`)
    expect(location(await get('token_hash=abc123&type=sms'))).toBe(`${ORIGIN}/login?error=verification_failed`)
    expect(location(await get('token_hash=abc123'))).toBe(`${ORIGIN}/login?error=verification_failed`)
    expect(state.verifyOtp).not.toHaveBeenCalled()
  })
})

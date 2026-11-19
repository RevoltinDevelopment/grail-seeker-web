/** Story 1.89 (U-09): the server route that completes an emailed token-hash link. */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextResponse } from 'next/server'

const state = vi.hoisted(() => ({ verifyOtp: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp: state.verifyOtp } }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { GET, HEAD } from './route'

const ORIGIN = 'https://app.grailseeker.io'
const get = (query: string) =>
  GET(new Request(`${ORIGIN}/auth/confirm?${query}`)) as Promise<NextResponse>
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

  it('an invitation always lands on /welcome, whatever next says: nobody skips the password', async () => {
    expect(location(await get('token_hash=abc123&type=invite&next=/plan'))).toBe(
      `${ORIGIN}/welcome`
    )
    expect(location(await get('token_hash=abc123&type=invite&next=/welcome?error=link'))).toBe(
      `${ORIGIN}/welcome`
    )
  })

  it('another type with no next goes to Searches', async () => {
    expect(location(await get('token_hash=abc123&type=magiclink'))).toBe(`${ORIGIN}/searches`)
  })

  it('a link checker or a prefetch does not spend the one-time token', async () => {
    expect((await HEAD()).status).toBe(200)
    const prefetch = await GET(
      new Request(`${ORIGIN}/auth/confirm?token_hash=abc123&type=invite`, {
        headers: { 'Sec-Purpose': 'prefetch' },
      })
    )
    expect(prefetch.status).toBe(204)
    expect(state.verifyOtp).not.toHaveBeenCalled()
  })

  it('a provider call that throws is a failed link, not an error page with the token in the address', async () => {
    state.verifyOtp.mockRejectedValue(new Error('network'))
    expect(location(await get('token_hash=abc123&type=invite'))).toBe(
      `${ORIGIN}/welcome?error=link`
    )
  })

  it('an invitation with no next still lands on /welcome', async () => {
    expect(location(await get('token_hash=abc123&type=invite'))).toBe(`${ORIGIN}/welcome`)
  })

  it('next is followed only inside the app: another site is ignored (Story 1.77)', async () => {
    expect(location(await get('token_hash=abc123&type=invite&next=https://evil.example/x'))).toBe(
      `${ORIGIN}/welcome`
    )
    expect(location(await get('token_hash=abc123&type=invite&next=//evil.example'))).toBe(
      `${ORIGIN}/welcome`
    )
    expect(location(await get('token_hash=abc123&type=email_change&next=/plan'))).toBe(
      `${ORIGIN}/plan`
    )
  })

  it('a failed invitation (expired, used) lands on the expired page, with nothing of the token in the address', async () => {
    state.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
    const res = await get('token_hash=abc123&type=invite&next=/welcome')
    expect(location(res)).toBe(`${ORIGIN}/welcome?error=link`)
    expect(location(res)).not.toContain('abc123')
  })

  it('a failed link of another type lands on sign-in, as the callback does', async () => {
    state.verifyOtp.mockResolvedValue({ error: { message: 'expired' } })
    expect(location(await get('token_hash=abc123&type=magiclink'))).toBe(
      `${ORIGIN}/login?error=verification_failed`
    )
  })

  // Story 1.106 (U-18): the Reset Password template links here
  it('a good reset link lands on reset password with the recovery mark for that account, never cached', async () => {
    state.verifyOtp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const res = await get('token_hash=abc123&type=recovery&next=/reset-password')
    expect(location(res)).toBe(`${ORIGIN}/reset-password`)
    expect(state.verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'abc123' })
    expect(res.cookies.get('gs-recovery')?.value).toBe('user-1')
    expect(res.headers.get('cache-control')).toMatch(/no-store/)
  })

  it('a reset link always lands on reset password, whatever next says', async () => {
    state.verifyOtp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    expect(location(await get('token_hash=abc123&type=recovery&next=/searches'))).toBe(
      `${ORIGIN}/reset-password`
    )
  })

  it('a failed reset link lands on its expired page, with no mark and nothing of the token', async () => {
    state.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
    const res = await get('token_hash=abc123&type=recovery&next=/reset-password')
    expect(location(res)).toBe(`${ORIGIN}/reset-password?error=link`)
    expect(location(res)).not.toContain('abc123')
    expect(res.cookies.get('gs-recovery')).toBeUndefined()
  })

  it('other link types set no recovery mark', async () => {
    state.verifyOtp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    expect(
      (await get('token_hash=abc123&type=email_change&next=/settings')).cookies.get('gs-recovery')
    ).toBeUndefined()
  })

  it('no token, or a type that is not an email type, is refused without calling the provider', async () => {
    expect(location(await get('type=invite'))).toBe(`${ORIGIN}/welcome?error=link`)
    expect(location(await get('token_hash=abc123&type=sms'))).toBe(
      `${ORIGIN}/login?error=verification_failed`
    )
    expect(location(await get('token_hash=abc123'))).toBe(
      `${ORIGIN}/login?error=verification_failed`
    )
    expect(state.verifyOtp).not.toHaveBeenCalled()
  })
})

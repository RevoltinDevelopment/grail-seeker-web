/** Story 1.104: the sign-in page says an account has been deleted (settings-delete-account.html, "deleted"). */
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ params: new URLSearchParams() }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => state.params,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('@/components/auth/SignInForm', () => ({ SignInForm: () => <form aria-label="Sign in" /> }))
vi.mock('@/components/auth/WaitlistJoin', () => ({
  WaitlistJoin: () => <form aria-label="Join the waitlist" />,
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import LoginPage from './page'

beforeEach(() => {
  state.params = new URLSearchParams()
})

describe('the sign-in page after Delete account (Story 1.104)', () => {
  it.each(['deleted=1', 'deleted=true'])('%s: the notice above the sign-in form', async (q) => {
    state.params = new URLSearchParams(q)
    render(<LoginPage />)
    expect(
      await screen.findByRole('heading', { name: 'Your account has been deleted' })
    ).toBeInTheDocument()
    expect(screen.getByText('Thank you for searching with Grail Seeker.')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('otherwise no notice', async () => {
    render(<LoginPage />)
    await screen.findByRole('form', { name: 'Sign in' })
    expect(screen.queryByText('Your account has been deleted')).not.toBeInTheDocument()
  })
})

// Story 1.106 (U-18): one quiet column, no tabs; the waitlist in the same column until launch
describe('the door (Story 1.106)', () => {
  it("sign-in's last line points to the landing page and the waitlist (Mahan, 2026-11-19)", async () => {
    render(<LoginPage />)
    await screen.findByRole('form', { name: 'Sign in' })
    expect(screen.queryByRole('button', { name: 'Join the waitlist' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute(
      'href',
      'https://grailseeker.io'
    )
    expect(screen.getByRole('link', { name: 'join the waitlist' })).toHaveAttribute(
      'href',
      '/login?tab=signup'
    )
  })

  it('?tab=signup shows the waitlist, keeping redirectTo on the way back', async () => {
    state.params = new URLSearchParams('tab=signup&redirectTo=/alerts')
    render(<LoginPage />)
    await screen.findByRole('form', { name: 'Join the waitlist' })
    expect(screen.queryByRole('form', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?redirectTo=%2Falerts'
    )
  })
})

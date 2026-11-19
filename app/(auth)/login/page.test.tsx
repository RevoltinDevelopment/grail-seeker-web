/** Story 1.104: the sign-in page says an account has been deleted (settings-delete-account.html, "deleted"). */
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ params: new URLSearchParams() }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => state.params,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('@/components/auth/SignInForm', () => ({ SignInForm: () => <form aria-label="Sign in" /> }))
vi.mock('@/components/auth/WaitlistJoin', () => ({ WaitlistJoin: () => null }))
vi.mock('@/components/auth/HeroPanel', () => ({ HeroPanel: () => null }))

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

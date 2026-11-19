/** Story 1.106 (U-18): sign-in, forgot password and the no-plan step, as drawn. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
  reset: vi.fn(),
  join: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useSearchParams: () => state.params,
  useRouter: () => ({ push: state.push, refresh: state.refresh, replace: vi.fn() }),
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: state.signIn, resetPasswordForEmail: state.reset },
  }),
}))
vi.mock('@/lib/api/waitlist', () => ({ joinWaitlist: state.join }))
vi.mock('@sentry/nextjs', () => ({ addBreadcrumb: vi.fn() }))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { ChoosePlanStep } from './ChoosePlanStep'
import { SendLinkForm } from './SendLinkForm'
import { SignInForm } from './SignInForm'

beforeEach(() => {
  state.params = new URLSearchParams()
  for (const fn of [state.push, state.refresh, state.signIn, state.reset, state.join])
    fn.mockReset()
})

async function signIn(email = 'a@example.com', password = 'secret123') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  })
}

describe('sign-in', () => {
  it("a wrong password reads in plain words; the payer's line waits for billing", async () => {
    state.signIn.mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 },
    })
    render(<SignInForm />)
    await signIn()
    expect(screen.getByRole('alert')).toHaveTextContent("That email and password don't match")
    expect(screen.queryByText(/Invalid login credentials/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Just subscribed/)).not.toBeInTheDocument()
    expect(state.push).not.toHaveBeenCalled()
  })

  it('too many tries', async () => {
    state.signIn.mockResolvedValue({ error: { code: 'over_request_rate_limit', status: 429 } })
    render(<SignInForm />)
    await signIn()
    expect(screen.getByRole('alert')).toHaveTextContent('Too many tries for now')
  })

  it('from a link: says why, then goes back to that page', async () => {
    state.params = new URLSearchParams('redirectTo=/plan/choose')
    state.signIn.mockResolvedValue({ error: null })
    render(<SignInForm />)
    expect(screen.getByRole('status')).toHaveTextContent(
      "We'll take you straight back to the page you opened."
    )
    await signIn()
    expect(state.push).toHaveBeenCalledWith('/plan/choose')
    expect(state.refresh).toHaveBeenCalled()
  })

  it('a link to elsewhere is neither explained nor followed (need 34)', async () => {
    state.params = new URLSearchParams('redirectTo=https://example.com')
    state.signIn.mockResolvedValue({ error: null })
    render(<SignInForm />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await signIn()
    expect(state.push).toHaveBeenCalledWith('/searches')
  })
})

describe('forgot password', () => {
  async function ask(email: string) {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send link' }))
    })
  }

  it.each([
    [null],
    [{ code: 'user_not_found', status: 400 }],
    [{ status: 500 }],
    [{ status: 429 }],
  ])('the same answer whether or not there is an account (%j)', async (error) => {
    state.reset.mockResolvedValue({ error })
    render(<SendLinkForm variant="forgot" />)
    await ask('who@example.com')
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'If an account uses who@example.com, a link to set your password is on its way. The link works for 24 hours.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send it again' })).toBeDisabled()
  })

  it('a rate limit reads as sent too (the provider limits only addresses with an account)', async () => {
    state.reset.mockResolvedValue({ error: { code: 'over_email_send_rate_limit', status: 429 } })
    render(<SendLinkForm variant="forgot" />)
    await ask('who@example.com')
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
  })

  it('a lost connection says so, and stays on the form', async () => {
    state.reset.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<SendLinkForm variant="forgot" />)
    await ask('who@example.com')
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't reach Grail Seeker")
    expect(screen.getByRole('button', { name: 'Send link' })).toBeInTheDocument()
  })

  it('the expired page says the real lifetime and offers a new link', () => {
    render(<SendLinkForm variant="expired" />)
    expect(screen.getByRole('heading', { name: 'This link has expired' })).toBeInTheDocument()
    expect(screen.getByText(/work for 24 hours, and only once/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send a new link' })).toBeInTheDocument()
  })
})

describe('the no-plan step, sales closed', () => {
  it('joins the waitlist with the known email, in the approved words', async () => {
    state.join.mockResolvedValue('joined')
    render(<ChoosePlanStep email="m@example.com" searchCount={6} />)
    expect(
      screen.getByText(
        "Your account doesn't have a plan yet. Your 6 searches are kept just as they are."
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Our subscriber list is full right now' })
    ).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Join the waitlist' }))
    })
    expect(state.join).toHaveBeenCalledWith('m@example.com')
    expect(screen.getByRole('status')).toHaveTextContent(
      "You're on the list. When a spot opens, we'll email m@example.com."
    )
    expect(screen.queryByText(/choice of/)).not.toBeInTheDocument()
  })
})

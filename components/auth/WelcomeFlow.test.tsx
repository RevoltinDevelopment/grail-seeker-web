/** Story 1.89 (U-09): the first password, then the phone step for a plan with texts, then Searches. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  updateUser: vi.fn(),
  getEntitlement: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  phoneStep: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: state.push, refresh: state.refresh }),
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { updateUser: state.updateUser } }),
}))
vi.mock('@/lib/api/account', () => ({ accountAPI: { getEntitlement: state.getEntitlement } }))
vi.mock('@/components/auth/PhoneStep', () => ({
  PhoneStep: (props: { planName: string | null; onDone: () => void }) => {
    state.phoneStep(props.planName)
    return (
      <div aria-label="Phone step stand-in">
        <button type="button" onClick={props.onDone}>
          verified
        </button>
      </div>
    )
  },
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { AFTER_WELCOME, WELCOME_FLOW_WORDS, WelcomeFlow, passwordRefusalWords } from './WelcomeFlow'

const plan = (textsIncluded: boolean, name = 'Collector') => ({
  plan: { code: name.toLowerCase(), name, includedSlots: 10, textsIncluded },
})

beforeEach(() => {
  state.updateUser.mockReset().mockResolvedValue({ error: null })
  state.getEntitlement.mockReset().mockResolvedValue(plan(true))
  state.push.mockReset()
  state.refresh.mockReset()
  state.phoneStep.mockReset()
})

async function savePassword(password = 'correct-horse-battery') {
  render(<WelcomeFlow email="ann@example.com" expired={false} />)
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.submit(screen.getByRole('form', { name: 'Set your password' }))
}

describe('WelcomeFlow', () => {
  it('the expired link: the words, Sign in, and no password field', () => {
    render(<WelcomeFlow email={null} expired />)
    expect(screen.getByRole('heading', { name: WELCOME_FLOW_WORDS.expiredHeading })).toBeInTheDocument()
    expect(screen.getByText(WELCOME_FLOW_WORDS.expiredLede)).toBeInTheDocument()
    expect(screen.getByText(WELCOME_FLOW_WORDS.expiredSignedUp)).toBeInTheDocument()
    expect(screen.getByText(WELCOME_FLOW_WORDS.expiredNew)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByLabelText('Password')).toBeNull()
    expect(screen.queryByRole('button', { name: /send a new link/i })).toBeNull()
  })

  it('one password field with Show, for the address; Save needs 8 characters', () => {
    render(<WelcomeFlow email="ann@example.com" expired={false} />)
    expect(screen.getByRole('heading', { name: WELCOME_FLOW_WORDS.passwordHeading })).toBeInTheDocument()
    expect(screen.getByText('For ann@example.com')).toBeInTheDocument()
    const field = screen.getByLabelText('Password')
    expect(field).toHaveAttribute('type', 'password')
    expect(field).toHaveAttribute('autocomplete', 'new-password')
    expect(document.querySelectorAll('input')).toHaveLength(1) // one field, no Confirm
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(field).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument()
    fireEvent.change(field, { target: { value: 'short' } })
    expect(screen.getByRole('button', { name: 'Save password' })).toBeDisabled()
    fireEvent.change(field, { target: { value: 'long-enough-1' } })
    expect(screen.getByRole('button', { name: 'Save password' })).toBeEnabled()
  })

  it('saves the password with updateUser, then the phone step for a plan with texts, naming the plan', async () => {
    await savePassword()
    await waitFor(() => expect(screen.getByLabelText('Phone step stand-in')).toBeInTheDocument())
    expect(state.updateUser).toHaveBeenCalledWith({ password: 'correct-horse-battery' })
    expect(state.phoneStep).toHaveBeenCalledWith('Collector')
    expect(state.push).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'verified' }))
    expect(state.push).toHaveBeenCalledWith(AFTER_WELCOME)
    expect(state.refresh).toHaveBeenCalled()
  })

  it('a plan without texts goes straight to Searches, marked as an invited arrival', async () => {
    state.getEntitlement.mockResolvedValue(plan(false, 'App Only'))
    await savePassword()
    await waitFor(() => expect(state.push).toHaveBeenCalledWith('/searches?welcome=invited'))
    expect(state.phoneStep).not.toHaveBeenCalled()
  })

  it('no plan at all goes to Searches (the no-plan guard is U-18\'s)', async () => {
    state.getEntitlement.mockResolvedValue({ plan: null })
    await savePassword()
    await waitFor(() => expect(state.push).toHaveBeenCalledWith(AFTER_WELCOME))
    expect(state.phoneStep).not.toHaveBeenCalled()
  })

  it('a summary that cannot be read still offers the phone step, without a plan name', async () => {
    state.getEntitlement.mockRejectedValue(new Error('down'))
    await savePassword()
    await waitFor(() => expect(screen.getByLabelText('Phone step stand-in')).toBeInTheDocument())
    expect(state.phoneStep).toHaveBeenCalledWith(null)
  })

  it("the provider's refusals in plain words, and the form stays", async () => {
    state.updateUser.mockResolvedValue({ error: { code: 'weak_password', message: 'Password should be at least 6 characters.' } })
    await savePassword('aaaaaaaa')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(WELCOME_FLOW_WORDS.weak))
    expect(screen.getByRole('form', { name: 'Set your password' })).toBeInTheDocument()
    expect(state.getEntitlement).not.toHaveBeenCalled()
  })

  it('passwordRefusalWords: weak by code or by message; anything else asks to try again', () => {
    expect(passwordRefusalWords({ code: 'weak_password' })).toBe(WELCOME_FLOW_WORDS.weak)
    expect(passwordRefusalWords({ message: 'Password should contain a number' })).toBe(WELCOME_FLOW_WORDS.weak)
    expect(passwordRefusalWords({ code: 'unexpected_failure', message: 'Database error' })).toBe(WELCOME_FLOW_WORDS.notSaved)
    expect(passwordRefusalWords(null)).toBe(WELCOME_FLOW_WORDS.notSaved)
  })
})

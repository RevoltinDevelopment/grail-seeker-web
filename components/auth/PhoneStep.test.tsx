/** Story 1.89 (U-09): today's phone step, on its own. */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
  resend: vi.fn(),
  preferences: vi.fn(),
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { updateUser: state.updateUser, verifyOtp: state.verifyOtp, resend: state.resend },
  }),
}))
vi.mock('@/lib/api/user', () => ({ updateUserPreferences: state.preferences }))
vi.mock('@/components/ui/PhoneInput', () => ({
  PhoneInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input id="signup-phone" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { PhoneStep, RESEND_SECONDS } from './PhoneStep'

const onDone = vi.fn()

beforeEach(() => {
  state.updateUser.mockReset().mockResolvedValue({ error: null })
  state.verifyOtp.mockReset().mockResolvedValue({ error: null })
  state.resend.mockReset().mockResolvedValue({ error: null })
  state.preferences.mockReset().mockResolvedValue({})
  onDone.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
})

async function toCode(phone = '+14155551234') {
  render(<PhoneStep planName="Collector" onDone={onDone} />)
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: phone } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.submit(screen.getByRole('form', { name: 'Your phone' }))
  await waitFor(() => expect(screen.getByRole('form', { name: 'Enter the code' })).toBeInTheDocument())
}

describe('PhoneStep', () => {
  it('names the plan, asks for the number and the consent, and cannot be sent without both', () => {
    render(<PhoneStep planName="Collector" onDone={onDone} />)
    expect(screen.getByText(/Your Collector plan texts you the moment we find a match/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+14155551234' } })
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
    expect(screen.getByText(/TCPA Consent Required/)).toBeInTheDocument()
  })

  it("adds the number with updateUser (which sends the code), then asks for the code; the provider's refusal is shown", async () => {
    await toCode()
    expect(state.updateUser).toHaveBeenCalledWith({ phone: '+14155551234' })
    expect(screen.getByText(/We sent a 6-digit code to/)).toHaveTextContent('+14155551234')
  })

  it("a refused number stays on the phone step with the provider's words", async () => {
    state.updateUser.mockResolvedValue({ error: { message: 'Phone number already in use' } })
    render(<PhoneStep onDone={onDone} />)
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+14155551234' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('form', { name: 'Your phone' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Phone number already in use'))
    expect(screen.getByRole('form', { name: 'Your phone' })).toBeInTheDocument()
  })

  it('verifies the code as a phone change, records the consent, and calls onDone', async () => {
    await toCode()
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '12a456' } })
    expect(screen.getByLabelText('Verification Code')).toHaveValue('12456') // digits only
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Enter the code' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(state.verifyOtp).toHaveBeenCalledWith({ phone: '+14155551234', token: '123456', type: 'phone_change' })
    expect(state.preferences).toHaveBeenCalledWith({ smsConsentGiven: true })
  })

  it('a consent record that fails does not stop the step (logged, non-blocking)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    state.preferences.mockRejectedValue(new Error('down'))
    await toCode()
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Enter the code' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
  })

  it('a wrong code is shown and onDone is not called', async () => {
    state.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
    await toCode()
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '000000' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Enter the code' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Token has expired or is invalid'))
    expect(onDone).not.toHaveBeenCalled()
  })

  it(`resend waits ${RESEND_SECONDS} seconds after each code, then sends again as a phone change`, async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await toCode()
    const resend = () => screen.getByRole('button', { name: /Resend code in|Resend/ })
    expect(resend()).toBeDisabled()
    expect(resend()).toHaveTextContent(`Resend code in ${RESEND_SECONDS}s`)
    await act(async () => {
      vi.advanceTimersByTime(RESEND_SECONDS * 1000)
    })
    await waitFor(() => expect(resend()).toBeEnabled())
    fireEvent.click(resend())
    await waitFor(() => expect(state.resend).toHaveBeenCalledWith({ phone: '+14155551234', type: 'phone_change' }))
    await waitFor(() => expect(resend()).toBeDisabled())
  })

  it('Change phone number goes back to the number, keeping it', async () => {
    await toCode()
    fireEvent.click(screen.getByRole('button', { name: /Change phone number/ }))
    expect(screen.getByRole('form', { name: 'Your phone' })).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toHaveValue('+14155551234')
  })
})

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
  // The real PhoneInput puts the id it is given on its number field; the label finds it only if PhoneStep passes it
  PhoneInput: ({
    id,
    value,
    onChange,
  }: {
    id?: string
    value: string
    onChange: (v: string) => void
  }) => <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />,
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { PhoneStep, RESEND_SECONDS, phoneErrorText } from './PhoneStep'

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
  await waitFor(() =>
    expect(screen.getByRole('form', { name: 'Enter the code' })).toBeInTheDocument()
  )
}

describe('PhoneStep', () => {
  it('names the plan, asks for the number and the consent, and cannot be sent without both', () => {
    render(<PhoneStep planName="Collector" onDone={onDone} />)
    expect(
      screen.getByText(/Your Collector plan texts you the moment we find a match/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+14155551234' } })
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
    expect(screen.getByText(/TCPA Consent Required/)).toBeInTheDocument()
  })

  it('adds the number with updateUser (which sends the code), then asks for the code', async () => {
    await toCode()
    expect(state.updateUser).toHaveBeenCalledWith({ phone: '+14155551234' })
    expect(screen.getByText(/We sent a 6-digit code to/)).toHaveTextContent('+14155551234')
  })

  it("a refused number stays on the phone step, in plain words by the provider's code (Story 1.104)", async () => {
    state.updateUser.mockResolvedValue({
      error: { code: 'phone_exists', message: 'Phone number already in use' },
    })
    render(<PhoneStep onDone={onDone} />)
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+14155551234' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('form', { name: 'Your phone' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'That number is already used by another account.'
      )
    )
    expect(screen.getByRole('form', { name: 'Your phone' })).toBeInTheDocument()
  })

  it('verifies the code as a phone change, records the consent, and calls onDone', async () => {
    await toCode()
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '12a456' } })
    expect(screen.getByLabelText('Verification Code')).toHaveValue('12456') // digits only
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Enter the code' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(state.verifyOtp).toHaveBeenCalledWith({
      phone: '+14155551234',
      token: '123456',
      type: 'phone_change',
    })
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
    state.verifyOtp.mockResolvedValue({
      error: { code: 'otp_expired', message: 'Token has expired or is invalid' },
    })
    await toCode()
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '000000' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Enter the code' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'That code is wrong or has expired. Check it, or send a new one.'
      )
    )
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
    await waitFor(() =>
      expect(state.resend).toHaveBeenCalledWith({ phone: '+14155551234', type: 'phone_change' })
    )
    await waitFor(() => expect(resend()).toBeDisabled())
  })

  it('Change phone number goes back to the number, keeping it', async () => {
    await toCode()
    fireEvent.click(screen.getByRole('button', { name: /Change phone number/ }))
    expect(screen.getByRole('form', { name: 'Your phone' })).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toHaveValue('+14155551234')
  })

  // Story 1.104: Settings' use of the step
  it('Settings gives its own heading, leaves out the sign-up line, and offers Cancel on both steps', async () => {
    const onCancel = vi.fn()
    render(<PhoneStep heading="Your new phone number" onCancel={onCancel} onDone={onDone} />)
    expect(screen.getByRole('heading', { name: 'Your new phone number' })).toBeInTheDocument()
    expect(screen.queryByText(/plan texts/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+14155551234' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('form', { name: 'Your phone' }))
    await waitFor(() =>
      expect(screen.getByRole('form', { name: 'Enter the code' })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('the sign-up keeps its own heading and line, and has no Cancel', () => {
    render(<PhoneStep planName="Collector" onDone={onDone} />)
    expect(
      screen.getByRole('heading', { name: 'Where should we text your matches?' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Your Collector plan texts/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it("errors are plain words by code, never the provider's text", () => {
    expect(phoneErrorText('over_sms_send_rate_limit', 'phone')).toBe(
      'Too many codes asked for. Wait a minute, then try again.'
    )
    expect(phoneErrorText('validation_failed', 'phone')).toMatch(
      /doesn’t look like a mobile number/
    )
    expect(phoneErrorText(undefined, 'phone')).toBe('Couldn’t send the code. Try again.')
    expect(phoneErrorText('something_new', 'verify')).toBe('Couldn’t check the code. Try again.')
  })
})

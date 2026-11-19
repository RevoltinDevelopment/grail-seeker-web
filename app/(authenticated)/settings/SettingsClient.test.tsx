/**
 * Story 1.104 (U-15): Settings on one page, as drawn in settings-page.html. The words themselves
 * are tested in lib/settingsWords.test.ts; these check each section's behaviour.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckTimes } from '@/lib/api/account'
import type { UserPreferences } from '@/lib/api/user'

const state = vi.hoisted(() => ({
  prefs: null as unknown,
  prefsError: null as unknown,
  refetch: vi.fn(),
  save: vi.fn(),
  account: null as unknown,
  checkTimes: null as unknown,
  preview: undefined as unknown,
  previewArgs: [] as unknown[],
  user: null as unknown,
  getUser: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
  sendTestSms: vi.fn(),
  invalidate: vi.fn(),
  accountLoading: false,
}))

// A stable router, as Next.js gives
const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/hooks/useSettings', () => ({
  usePreferences: () => ({
    invalidate: state.invalidate,
    prefs: state.prefs,
    isLoading: false,
    error: state.prefsError,
    refetch: state.refetch,
    save: state.save,
  }),
  useCheckTimes: () => ({ checkTimes: state.checkTimes, error: null, refetch: vi.fn() }),
  useQuietPreview: (p: unknown) => {
    state.previewArgs.push(p)
    return p ? state.preview : undefined
  },
}))
vi.mock('@/hooks/useAccountSummary', () => ({
  useAccountSummary: () => ({ account: state.account, isLoading: state.accountLoading }),
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: state.getUser,
      updateUser: state.updateUser,
      resend: state.resend,
      verifyOtp: async () => ({ error: null }),
    },
  }),
}))
vi.mock('@/lib/api/user', async (orig) => ({
  ...(await orig<typeof import('@/lib/api/user')>()),
  sendTestSms: state.sendTestSms,
  updateUserPreferences: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import SettingsClient from './SettingsClient'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { APIError } from '@/lib/api/client'

const prefs = (over: Partial<UserPreferences> = {}): UserPreferences => ({
  smsNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00:00',
  quietHoursEnd: '08:00:00',
  timezone: 'America/Los_Angeles',
  nearMissEnabled: true,
  nearMissMargin: 0.15,
  smsConsentGiven: true,
  smsConsentTimestamp: '2026-08-12T22:14:00Z',
  ...over,
})
const plan = (textsIncluded = true) => ({
  plan: {
    code: textsIncluded ? 'collector' : 'app_only',
    name: textsIncluded ? 'Collector' : 'App Only',
    includedSlots: 10,
    textsIncluded,
  },
  slots: { entitled: 10, inUse: 6, free: 4, over: 0 },
})
const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'mia@old.example',
  phone: '15550142290',
  phone_confirmed_at: '2026-08-12T22:14:00Z',
  created_at: '2026-08-12T15:00:00Z',
  ...over,
})
const times = (morningCovered: boolean, eveningCovered = false): CheckTimes => ({
  timezone: 'America/Los_Angeles',
  timezoneName: 'Pacific Time',
  times: [
    {
      at: '2026-11-19T14:00:00.000Z',
      local: '06:00',
      label: '6:00 AM',
      withinQuietHours: morningCovered,
    },
    {
      at: '2026-11-19T00:00:00.000Z',
      local: '16:00',
      label: '4:00 PM',
      withinQuietHours: eveningCovered,
    },
  ],
})

beforeEach(() => {
  state.prefs = prefs()
  state.prefsError = null
  state.accountLoading = false
  state.account = plan()
  state.checkTimes = times(false)
  state.preview = undefined
  state.previewArgs = []
  state.user = user()
  state.getUser.mockReset().mockImplementation(async () => ({ data: { user: state.user } }))
  state.updateUser.mockReset().mockResolvedValue({ error: null })
  state.resend.mockReset().mockResolvedValue({ error: null })
  state.save.mockReset().mockResolvedValue({})
  state.sendTestSms.mockReset().mockResolvedValue({ phoneNumber: '+15550142290' })
})

const page = async () => {
  render(<SettingsClient />)
  await screen.findByRole('heading', { name: 'Account' })
}

describe('Settings (Story 1.104)', () => {
  it("one page of sections in the design's order; no Appearance until U-17; the plan pointer", async () => {
    await page()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'Account',
      'Plan and slots',
      'Texts',
      'Alerts',
      'Password',
      'Delete account',
    ])
    expect(screen.queryByText('Appearance')).not.toBeInTheDocument()
    expect(screen.getByText('Collector · 6 of 10 slots in use')).toBeInTheDocument()
    expect(screen.getByText('Your plan and slots are on their own page.')).toBeInTheDocument()
    const deleteLinks = screen
      .getAllByRole('link', { name: 'Delete account' })
      .map((a) => a.getAttribute('href'))
    expect(deleteLinks).toEqual(['#delete', '/settings/delete']) // the section list (desktop), then the section's own
    expect(screen.getByText('(555) 014-2290')).toBeInTheDocument()
    expect(screen.getByText('August 12, 2026')).toBeInTheDocument()
    expect(
      screen.getByText(
        /You agreed to receive texts from Grail Seeker on August 12, 2026 at 3:14 PM/
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/up to 15% over my maximum price/)).toBeInTheDocument()
  })

  it('no plan: no plan section; App Only: no text settings, only the way to plans with texts', async () => {
    state.account = { plan: null, slots: { entitled: 0, inUse: 0, free: 0, over: 0 } }
    const { unmount } = render(<SettingsClient />)
    await screen.findByRole('heading', { name: 'Account' })
    expect(screen.queryByRole('heading', { name: 'Plan and slots' })).not.toBeInTheDocument()
    unmount()

    state.account = plan(false)
    await page()
    expect(screen.getByText('App Only doesn’t include texts')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See plans with texts' })).toHaveAttribute(
      'href',
      '/plan'
    )
    expect(
      screen.queryByRole('switch', { name: 'Text me when a search finds a match' })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: 'Quiet hours' })).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Near misses' })).toBeInTheDocument()
  })

  it('a switch saves at once and says "Saved"; a failed save puts it back and says so', async () => {
    await page()
    const texts = screen.getByRole('switch', { name: 'Text me when a search finds a match' })
    fireEvent.click(texts)
    expect(state.save).toHaveBeenCalledWith({ smsNotificationsEnabled: false })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(texts).toHaveAttribute('aria-checked', 'false')

    state.save.mockRejectedValueOnce(new Error('down'))
    const near = screen.getByRole('switch', { name: 'Near misses' })
    fireEvent.click(near)
    expect(await screen.findByText('Couldn’t save that. Try again.')).toBeInTheDocument()
    expect(near).toHaveAttribute('aria-checked', 'true')
  })

  it("quiet hours: the server's check times for the hours on screen, and the amber warning when one is covered", async () => {
    state.prefs = prefs({
      quietHoursEnabled: true,
      quietHoursStart: '21:00:00',
      quietHoursEnd: '07:00:00',
    })
    state.preview = times(true)
    await page()
    expect(state.previewArgs.at(-1)).toEqual({
      quietEnabled: true,
      quietStart: '21:00',
      quietEnd: '07:00',
      timezone: 'America/Los_Angeles',
    })
    expect(
      screen.getByText('Your searches are checked at 6:00 AM and 4:00 PM Pacific Time.')
    ).toBeInTheDocument()
    expect(screen.getByText('These hours cover your morning check, at 6:00 AM')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '23:00' } })
    expect(state.previewArgs.at(-1)).toMatchObject({ quietStart: '23:00' })
    fireEvent.click(screen.getByRole('button', { name: 'Save quiet hours' }))
    expect(state.save).toHaveBeenCalledWith({
      quietHoursStart: '23:00:00',
      quietHoursEnd: '07:00:00',
      timezone: 'America/Los_Angeles',
    })
  })

  it('quiet hours off asks nothing; a cleared time asks nothing', async () => {
    await page()
    expect(state.previewArgs.every((p) => p === null)).toBe(true)
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
  })

  it('password: the current one is sent; a wrong one reads "That isn\'t your current password."', async () => {
    state.updateUser.mockResolvedValueOnce({
      error: { code: 'current_password_mismatch', message: 'raw provider text' },
    })
    await page()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Password' })).getByRole('button', {
        name: 'Change',
      })
    )
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'wrongpass' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword1' } })
    fireEvent.change(screen.getByLabelText('New password, again'), {
      target: { value: 'newpassword1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('That isn’t your current password.')).toBeInTheDocument()
    expect(state.updateUser).toHaveBeenCalledWith({
      password: 'newpassword1',
      current_password: 'wrongpass',
    })
    expect(screen.getByLabelText('Current password')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('raw provider text')).not.toBeInTheDocument()
  })

  it('password: mismatched new passwords are caught before sending; success closes the form', async () => {
    await page()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Password' })).getByRole('button', {
        name: 'Change',
      })
    )
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'oldpass12' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword1' } })
    fireEvent.change(screen.getByLabelText('New password, again'), {
      target: { value: 'newpassword2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('The new passwords don’t match.')).toBeInTheDocument()
    expect(state.updateUser).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('New password, again'), {
      target: { value: 'newpassword1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('Password changed')).toBeInTheDocument()
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument()
  })

  it('email: the link is sent, and a pending change shows both inboxes, Send it again, and no cancel', async () => {
    await page()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Account' })).getAllByRole('button', {
        name: 'Change',
      })[0]
    )
    fireEvent.change(screen.getByLabelText('New email'), { target: { value: 'mia@new.example' } })
    state.user = user({ new_email: 'mia@new.example' })
    fireEvent.click(screen.getByRole('button', { name: 'Send the link' }))
    expect(await screen.findByText('Check both inboxes')).toBeInTheDocument()
    expect(state.updateUser).toHaveBeenCalledWith(
      { email: 'mia@new.example' },
      expect.objectContaining({ emailRedirectTo: expect.stringMatching(/\/settings$/) })
    )
    expect(
      screen.getByText(/We sent a link to mia@new.example and one to mia@old.example/)
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel the change/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Send it again' }))
    await waitFor(() =>
      expect(state.resend).toHaveBeenCalledWith({ type: 'email_change', email: 'mia@new.example' })
    )
    expect(await screen.findByText('Sent')).toBeInTheDocument()
  })

  it('email: a taken address in plain words', async () => {
    state.updateUser.mockResolvedValueOnce({ error: { code: 'email_exists', message: 'raw' } })
    await page()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Account' })).getAllByRole('button', {
        name: 'Change',
      })[0]
    )
    fireEvent.change(screen.getByLabelText('New email'), { target: { value: 'taken@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send the link' }))
    expect(
      await screen.findByText('That email is already used by another account.')
    ).toBeInTheDocument()
  })

  it('phone: Change opens the code step in place, saying texts stay on the old number; Cancel closes it', async () => {
    await page()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Account' })).getAllByRole('button', {
        name: 'Change',
      })[1]
    )
    expect(screen.getByRole('heading', { name: 'Your new phone number' })).toBeInTheDocument()
    expect(
      screen.getByText('Texts keep going to (555) 014-2290 until the new number is confirmed.')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('heading', { name: 'Your new phone number' })).not.toBeInTheDocument()
  })

  it('phone: an account with no number says so, offers Add, and the test text is off', async () => {
    state.user = user({ phone: '', phone_confirmed_at: undefined })
    await page()
    expect(screen.getByText('No number yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(screen.getByText('Add a phone number above to get texts.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('test text: sent, and a refusal in plain words', async () => {
    await page()
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(
      await screen.findByText('Sent to (555) 014-2290. It should arrive within a minute.')
    ).toBeInTheDocument()
    state.sendTestSms.mockRejectedValueOnce(
      new APIError(429, 'RATE_LIMITED', 'Test SMS limit reached (3 per 24 hours).')
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(
      await screen.findByText('You’ve sent 3 test texts today. Try again tomorrow.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Test SMS limit reached/)).not.toBeInTheDocument()
  })

  it("settings that can't be read: the drawn panel with Try again, never the error's text", async () => {
    state.prefs = null
    state.prefsError = new Error('raw failure')
    render(<SettingsClient />)
    expect(await screen.findByText('We couldn’t load your settings')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    })
    expect(state.refetch).toHaveBeenCalled()
    expect(screen.queryByText('raw failure')).not.toBeInTheDocument()
  })

  // Review, 2026-11-18
  it('waits for the plan before drawing, so App Only never shows text settings for a moment', async () => {
    state.accountLoading = true
    state.account = null
    render(<SettingsClient />)
    await waitFor(() => expect(state.getUser).toHaveBeenCalled())
    expect(screen.getByText('Loading your settings…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Texts' })).not.toBeInTheDocument()
  })

  it('quiet hours: the fields open as the switch flips, before the save answers', async () => {
    let finish: () => void = () => {}
    state.save.mockImplementationOnce(() => new Promise<void>((r) => (finish = r)))
    await page()
    fireEvent.click(screen.getByRole('switch', { name: 'Quiet hours' }))
    expect(screen.getByLabelText('From')).toBeInTheDocument()
    await act(async () => finish())
  })

  it('quiet hours never saved can be saved as shown', async () => {
    state.prefs = prefs({
      quietHoursEnabled: true,
      quietHoursStart: null as unknown as string,
      quietHoursEnd: null as unknown as string,
    })
    await page()
    expect(screen.getByLabelText('From')).toHaveValue('22:00')
    expect(screen.getByRole('button', { name: 'Save quiet hours' })).toBeEnabled()
  })

  it('quiet hours: the saved check times stand in until the first preview answers', async () => {
    state.prefs = prefs({
      quietHoursEnabled: true,
      quietHoursStart: '21:00:00',
      quietHoursEnd: '07:00:00',
    })
    state.checkTimes = times(true)
    state.preview = undefined
    await page()
    expect(screen.getByText('These hours cover your morning check, at 6:00 AM')).toBeInTheDocument()
  })

  it('a phone change reads preferences again, for the new consent time', async () => {
    state.updateUser.mockResolvedValue({ error: null })
    await page()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Account' })).getAllByRole('button', {
        name: 'Change',
      })[1]
    )
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+14155551234' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('form', { name: 'Your phone' }))
    await screen.findByRole('form', { name: 'Enter the code' })
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Enter the code' }))
    await waitFor(() => expect(state.invalidate).toHaveBeenCalled())
  })

  it('a pending email can be replaced: Use a different address opens the form again', async () => {
    state.user = user({ new_email: 'mia@typo.example' })
    await page()
    fireEvent.click(screen.getByRole('button', { name: 'Use a different address' }))
    expect(screen.getByLabelText('New email')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Check both inboxes')).toBeInTheDocument()
  })

  it('a failed read of the account keeps the subscriber here; only a missing session goes to sign-in', async () => {
    state.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { name: 'AuthRetryableFetchError', status: 0 },
    })
    render(<SettingsClient />)
    expect(await screen.findByText('We couldn’t load your settings')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    })
    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
  })
})

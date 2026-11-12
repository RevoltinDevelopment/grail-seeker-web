/** Story 1.89 (U-09): the waitlist tab, in the approved words; nothing about accounts. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ join: vi.fn() }))
vi.mock('@/lib/api/waitlist', () => ({ joinWaitlist: state.join }))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { APIError } from '@/lib/api/client'
import { WAITLIST_WORDS, WaitlistJoin, joinRefusalWords } from './WaitlistJoin'

beforeEach(() => {
  state.join.mockReset()
})

async function join(email: string) {
  render(<WaitlistJoin />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.submit(screen.getByRole('form', { name: 'Join the waitlist' }))
}

describe('WaitlistJoin', () => {
  it('shows the heading, the paragraph, one email field, Join the waitlist and the fine print', () => {
    render(<WaitlistJoin />)
    expect(screen.getByRole('heading', { level: 2, name: WAITLIST_WORDS.heading })).toBeInTheDocument()
    expect(screen.getByText(WAITLIST_WORDS.paragraph)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByRole('button', { name: 'Join the waitlist' })).toBeDisabled()
    expect(screen.getByText(WAITLIST_WORDS.fine)).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).toBeNull()
  })

  it('joined: sends the trimmed address, then the status line with it, and the form goes', async () => {
    state.join.mockResolvedValue('joined')
    await join('  Ann@Example.com ')
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(state.join).toHaveBeenCalledWith('Ann@Example.com')
    expect(screen.getByRole('status')).toHaveTextContent(WAITLIST_WORDS.joined('Ann@Example.com'))
    expect(screen.queryByRole('form')).toBeNull()
  })

  it('already on the list: the place is kept, in those words', async () => {
    state.join.mockResolvedValue('already_on_list')
    await join('ann@example.com')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(WAITLIST_WORDS.already))
  })

  it.each([
    ['a bad address', new APIError(400, 'INVALID_EMAIL', 'Enter an email address.'), 'Enter an email address.'],
    ['too many tries', new APIError(429, 'RATE_LIMITED', 'Too many tries just now. Please try again in an hour.'), 'Too many tries just now. Please try again in an hour.'],
    ['the server', new APIError(500, 'DATABASE_ERROR', 'We could not save your place just now. Please try again.'), WAITLIST_WORDS.failed],
    ['an unexplained failure', new APIError(502, 'API_ERROR', 'HTTP 502'), WAITLIST_WORDS.failed],
    ['offline', new TypeError('Failed to fetch'), WAITLIST_WORDS.offline],
  ])('%s: the line under the field, and the form stays', async (what, error, words) => {
    state.join.mockRejectedValue(error)
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(what !== 'offline')
    await join('ann@example.com')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(words))
    expect(screen.getByRole('form', { name: 'Join the waitlist' })).toBeInTheDocument()
    // Only a bad address marks the field itself as wrong
    if (what === 'a bad address') expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    else expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')
    onLine.mockRestore()
  })

  it('a server that cannot be reached while the browser is online is not called offline', () => {
    expect(joinRefusalWords(new TypeError('Failed to fetch'), true)).toBe(WAITLIST_WORDS.failed)
    expect(joinRefusalWords(new TypeError('Failed to fetch'), false)).toBe(WAITLIST_WORDS.offline)
  })

  it('says nothing about accounts, whatever the answer', async () => {
    for (const result of ['joined', 'already_on_list'] as const) {
      state.join.mockResolvedValue(result)
      const { unmount, container } = render(<WaitlistJoin />)
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@example.com' } })
      fireEvent.submit(screen.getByRole('form', { name: 'Join the waitlist' }))
      await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
      expect(container.textContent?.toLowerCase()).not.toMatch(/account|password|sign up|exists/)
      unmount()
    }
  })

  it('joinRefusalWords: the server is quoted only for what it explains', () => {
    expect(joinRefusalWords(new APIError(400, 'INVALID_EMAIL', 'Enter an email address.'))).toBe('Enter an email address.')
    expect(joinRefusalWords(new APIError(500, 'DATABASE_ERROR', 'x'))).toBe(WAITLIST_WORDS.failed)
    expect(joinRefusalWords(new Error('?'))).toBe(WAITLIST_WORDS.failed)
  })
})

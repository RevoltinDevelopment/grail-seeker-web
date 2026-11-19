/**
 * Story 1.104 (U-15): Delete account, as drawn in settings-delete-account.html (answer A's confirm
 * without its billing lines, which wait for S-20). Today's delete behind it.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  searches: [] as unknown[],
  searchesLoading: false,
  searchesError: null as unknown,
  deleteAccount: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('@/hooks/useSearches', () => ({
  useSearches: () => ({
    searches: state.searches,
    isLoading: state.searchesLoading,
    error: state.searchesError,
  }),
}))
vi.mock('@/lib/api/user', () => ({ deleteAccount: state.deleteAccount }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: state.signOut } }),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import DeleteAccountClient from './DeleteAccountClient'
// eslint-disable-next-line import/order -- must follow vi.mock() above
import { APIError } from '@/lib/api/client'

const realLocation = window.location
beforeEach(() => {
  state.searches = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }]
  state.searchesLoading = false
  state.searchesError = null
  state.deleteAccount.mockReset().mockResolvedValue({ success: true })
  state.signOut.mockReset().mockResolvedValue({ error: null })
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'http://localhost/settings/delete' },
  })
})
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation })
})

describe('Delete account (Story 1.104)', () => {
  it('the drawn confirm: the searches by count, no billing lines, Keep my account back to Settings', () => {
    render(<DeleteAccountClient />)
    expect(screen.getByRole('heading', { name: 'Delete your account?' })).toBeInTheDocument()
    expect(screen.getByText('Your 6 searches stop and are deleted.')).toBeInTheDocument()
    expect(
      screen.getByText('Your alerts, their archive and your reports are deleted.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/subscription/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Receipts/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Keep my account' })).toHaveAttribute(
      'href',
      '/settings'
    )
    expect(screen.getByRole('link', { name: '← Settings' })).toHaveAttribute('href', '/settings')
  })

  it('no searches: that line is left out; one: singular', () => {
    state.searches = []
    const { unmount } = render(<DeleteAccountClient />)
    expect(screen.queryByText(/searches stop/)).not.toBeInTheDocument()
    unmount()
    state.searches = [{ id: 'a' }]
    render(<DeleteAccountClient />)
    expect(screen.getByText('Your 1 search stops and is deleted.')).toBeInTheDocument()
  })

  it("Delete waits for DELETE (any case), then deletes, signs out and goes to the sign-in page's notice", async () => {
    render(<DeleteAccountClient />)
    const button = screen.getByRole('button', { name: 'Delete my account' })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: ' delete ' },
    })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await waitFor(() => expect(window.location.href).toBe('/login?deleted=1'))
    expect(state.deleteAccount).toHaveBeenCalledTimes(1)
    expect(state.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it("a failed delete says nothing was deleted, never the server's text, and stays", async () => {
    state.deleteAccount.mockRejectedValueOnce(new APIError(500, 'DELETE_FAILED', 'raw server text'))
    render(<DeleteAccountClient />)
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t delete your account. Nothing was deleted. Try again.'
    )
    expect(screen.queryByText('raw server text')).not.toBeInTheDocument()
    expect(state.signOut).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete my account' })).toBeEnabled()
  })

  it("no answer from the server: it says it can't tell, not that nothing was deleted", async () => {
    state.deleteAccount.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<DeleteAccountClient />)
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t reach Grail Seeker, so we can’t tell whether your account was deleted.'
    )
    expect(screen.queryByText(/Nothing was deleted/)).not.toBeInTheDocument()
  })

  it('while the searches load, the count is not shown and Delete waits; unreadable, a plain line', () => {
    state.searchesLoading = true
    state.searches = []
    const { unmount } = render(<DeleteAccountClient />)
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    })
    expect(screen.getByRole('button', { name: 'Delete my account' })).toBeDisabled()
    expect(screen.queryByText(/stop and are deleted/)).not.toBeInTheDocument()
    unmount()
    state.searchesLoading = false
    state.searchesError = new Error('down')
    render(<DeleteAccountClient />)
    expect(screen.getByText('Your searches stop and are deleted.')).toBeInTheDocument()
  })
})

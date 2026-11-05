import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Header, { countLabel } from './Header'

// Story 1.82 (U-04): the header as drawn.
const state = vi.hoisted(() => ({ unseen: 0, pathname: '/searches', logout: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }))
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => state.logout }))
vi.mock('@/hooks/useUnseenAlerts', () => ({ useUnseenCount: () => state.unseen }))
const account = vi.hoisted(() => ({ value: null as unknown }))
vi.mock('@/hooks/useAccountSummary', () => ({
  useAccountSummary: () => ({ account: account.value }),
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- a stand-in for next/image in tests
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))

const user = { email: 'mary.kaplan@example.com' } as never

beforeEach(() => {
  account.value = null
  state.unseen = 0
  state.pathname = '/searches'
  state.logout.mockReset()
})

describe('Header', () => {
  it('leads to Searches from the wordmark, and never to the Dashboard', () => {
    const { container } = render(<Header user={user} />)
    expect(screen.getByText('GRAIL SEEKER').closest('a')).toHaveAttribute('href', '/searches')
    expect(container.innerHTML).not.toContain('/dashboard')
  })

  it('marks the current page, Alerts included for its sub-pages', () => {
    state.pathname = '/alerts/archive'
    render(<Header user={user} />)
    const main = screen.getAllByRole('navigation', { name: 'Main' })[0]
    expect(main.querySelector('[aria-current="page"]')).toHaveTextContent('Alerts')
  })

  it('shows no count and no dot with nothing new', () => {
    render(<Header user={user} />)
    expect(screen.queryByText(/new alert/)).toBeNull()
    expect(screen.queryByTestId('menu-dot')).toBeNull()
  })

  it('shows the count on Alerts, read in full, and the dot on the menu button, which says so', () => {
    state.unseen = 3
    render(<Header user={user} />)
    expect(screen.getAllByText('3 new alerts')[0].parentElement).toHaveTextContent('3')
    expect(screen.getByTestId('menu-dot')).toBeInTheDocument()
    // The dot itself is hidden from screen readers; the button's own name carries it.
    expect(screen.getByRole('button', { name: 'Open menu, 3 new alerts' })).toBeInTheDocument()
  })

  it('caps the shown count at 99+, and reads the real number', () => {
    expect(countLabel(99)).toBe('99')
    expect(countLabel(100)).toBe('99+')
    state.unseen = 140
    render(<Header user={user} />)
    expect(screen.getAllByText('140 new alerts')[0].parentElement).toHaveTextContent('99+')
  })

  it('opens the phone menu, an X while open, "3 new" on Alerts, and closes on Escape with focus back', () => {
    state.unseen = 3
    render(<Header user={user} />)
    const button = screen.getByRole('button', { name: 'Open menu, 3 new alerts' })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAccessibleName('Close menu')
    const menu = document.getElementById('app-menu')!
    expect(menu).toHaveTextContent('3 new')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.getElementById('app-menu')).toBeNull()
    expect(document.activeElement).toBe(button)
  })

  it('opening one menu closes the other', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.queryByRole('navigation', { name: 'Account' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    expect(document.getElementById('app-menu')).toBeNull()
  })

  it('the avatar menu holds Settings and Log out', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    const menu = screen.getByRole('navigation', { name: 'Account' })
    expect(menu).toHaveTextContent('mary.kaplan@example.com')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(state.logout).toHaveBeenCalled()
  })

  it('Story 1.85: the avatar menu leads to "Plan and slots", with the plan and the slots in use', () => {
    account.value = {
      plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
      status: 'active',
      slots: { entitled: 10, inUse: 6, free: 4, over: 0 },
    }
    render(<Header user={user} />)
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    const item = screen.getByRole('link', { name: /Plan and slots/ })
    expect(item).toHaveAttribute('href', '/plan')
    expect(item).toHaveTextContent('Plan and slotsCollector · 6 of 10')
    const menu = screen.getByRole('navigation', { name: 'Account' })
    const links = Array.from(menu.querySelectorAll('a')).map((a) => a.textContent)
    expect(links[0]).toMatch(/^Plan and slots/)
    expect(links[1]).toBe('Settings')
  })

  it('Story 1.85: no "Plan and slots" for an account with no plan', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    expect(screen.queryByRole('link', { name: /Plan and slots/ })).not.toBeInTheDocument()
  })
})

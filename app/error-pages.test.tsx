import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { config as middlewareConfig } from '@/middleware'

import AuthenticatedError from './(authenticated)/error'
import RootError from './error'
import GlobalError from './global-error'
import NotFound from './not-found'

// Story 1.105 (U-16): each error page shows the drawn words and still reports to Sentry once.
const sentry = vi.hoisted(() => ({ captureException: vi.fn() }))
vi.mock('@sentry/nextjs', () => sentry)
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
  Cinzel: () => ({ className: 'cinzel', variable: '--font-cinzel' }),
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- a stand-in for next/image in tests
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))
const session = vi.hoisted(() => ({ user: null as unknown, fail: false }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        session.fail
          ? Promise.reject(new Error('offline'))
          : Promise.resolve({ data: { user: session.user } }),
    },
  }),
}))
vi.mock('@/components/layout/Header', () => ({
  default: ({ user }: { user: { email: string } }) => <header>App header for {user.email}</header>,
}))

beforeEach(() => {
  sentry.captureException.mockReset()
  session.user = null
  session.fail = false
})

describe.each([
  ['a signed-in page', AuthenticatedError, false],
  ['outside the app', RootError, true],
  ['the root layout failing', GlobalError, true],
] as const)('the error page, %s', (_, Page, ownHeader) => {
  it('shows the drawn words and reports the error once', () => {
    const error = new Error('boom')
    // The root failure renders its own <html>; React warns about nesting it in a test container
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Page error={error} reset={() => {}} />)
    quiet.mockRestore()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(sentry.captureException).toHaveBeenCalledOnce()
    expect(sentry.captureException).toHaveBeenCalledWith(error)
    // It can't tell who is signed in, so it never offers "Sign in"
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
    // Its own header (brand only, a full page load to Searches), or the layout's
    const brand = screen.queryByText('GRAIL SEEKER')?.closest('a')
    expect(brand != null).toBe(ownHeader)
    if (brand) expect(brand).toHaveAttribute('href', '/searches')
  })
})

describe('the not-found page', () => {
  it('signed in: the app header, the drawn words, no Try again', async () => {
    session.user = { email: 'mary@example.com' }
    render(<NotFound />)
    await waitFor(() =>
      expect(screen.getByText('App header for mary@example.com')).toBeInTheDocument()
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We can’t find that page')
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('signed out: the public header with Sign in', async () => {
    render(<NotFound />)
    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument())
  })

  it('a failed session read counts as signed out', async () => {
    session.fail = true
    render(<NotFound />)
    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument())
  })

  it('has one main landmark', () => {
    render(<NotFound />)
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})

describe('the middleware', () => {
  it('runs on the legal pages, which read the session to choose their header', () => {
    expect(middlewareConfig.matcher).toEqual(
      expect.arrayContaining(['/terms', '/privacy', '/heritage-terms'])
    )
  })
})

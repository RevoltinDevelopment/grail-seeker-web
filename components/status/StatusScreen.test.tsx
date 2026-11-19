import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { countFixedColours } from '@/lib/design/fixed-colours'
import { STATUS_WORDS } from '@/lib/statusWords'

import { StatusScreen } from './StatusScreen'

// Story 1.105 (U-16): the error and not-found column, as drawn.
describe('StatusScreen', () => {
  it('an error: the drawn words, Try again, Back to Searches and the support line', () => {
    const reset = vi.fn()
    render(<StatusScreen kind="error" onRetry={reset} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong')
    expect(
      screen.getByText('Your searches and alerts are safe, and we’ve been told about it.')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Back to Searches' })).toHaveAttribute(
      'href',
      '/searches'
    )
    expect(screen.getByText(/Still having trouble\? Email/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'support@grailseeker.io' })).toHaveAttribute(
      'href',
      'mailto:support@grailseeker.io'
    )
  })

  it('not found: the drawn words and Back to Searches, no Try again, no support line', () => {
    render(<StatusScreen kind="notFound" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We can’t find that page')
    expect(
      screen.getByText('The link may be old, or the address may have a typo.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    expect(screen.queryByText(/Still having trouble/)).toBeNull()
    expect(screen.getByRole('link', { name: 'Back to Searches' })).toHaveAttribute(
      'href',
      '/searches'
    )
  })

  it('never shows the error text outside development', () => {
    const error = Object.assign(new Error('secret stack detail'), { digest: 'abc123' })
    render(<StatusScreen kind="error" onRetry={() => {}} error={error} />)
    // vitest runs with NODE_ENV "test"
    expect(screen.queryByText('secret stack detail')).toBeNull()
    expect(screen.queryByText(/abc123/)).toBeNull()
  })

  it('has no red and no fixed colours', () => {
    const { container } = render(<StatusScreen kind="error" onRetry={() => {}} />)
    expect(container.innerHTML).not.toMatch(/red-/)
    expect(countFixedColours(container.innerHTML)).toBe(0)
  })

  it('every kind has a title and a line', () => {
    for (const words of Object.values(STATUS_WORDS)) {
      expect(words.title.length).toBeGreaterThan(0)
      expect(words.body.length).toBeGreaterThan(0)
    }
  })
})

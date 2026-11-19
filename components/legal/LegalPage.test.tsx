import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PlainHeader, PublicHeader } from '@/components/layout/PublicHeader'
import { countFixedColours } from '@/lib/design/fixed-colours'

import { LegalColumn, LegalProse } from './LegalPage'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- a stand-in for next/image in tests
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}))

// Story 1.105 (U-16): the legal pages' frame, as drawn.
describe('LegalColumn', () => {
  it('signed in: "← Back to Searches", to Searches', () => {
    render(
      <LegalColumn signedIn title="Terms of Service">
        <p>Text</p>
      </LegalColumn>
    )
    expect(screen.getByRole('link', { name: '← Back to Searches' })).toHaveAttribute(
      'href',
      '/searches'
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terms of Service')
  })

  it('signed out: "← Back", to sign-in', () => {
    render(
      <LegalColumn signedIn={false} title="Privacy Policy">
        <p>Text</p>
      </LegalColumn>
    )
    expect(screen.getByRole('link', { name: '← Back' })).toHaveAttribute('href', '/login')
  })

  it('a text page is 824 px; a wide one (the Heritage terms PDF) is as wide as Searches', () => {
    const { rerender } = render(
      <LegalColumn signedIn title="Terms of Service">
        <p>Text</p>
      </LegalColumn>
    )
    expect(screen.getByRole('main').className).toContain('max-w-[824px]')
    rerender(
      <LegalColumn signedIn title="Heritage" wide>
        <p>PDF</p>
      </LegalColumn>
    )
    expect(screen.getByRole('main').className).toContain('max-w-[1200px]')
  })
})

describe('LegalProse', () => {
  it('styles the content on the tokens', () => {
    const { container } = render(
      <LegalProse>
        <h2>1. Section</h2>
        <ul>
          <li>Item</li>
        </ul>
      </LegalProse>
    )
    const section = container.querySelector('section')!
    expect(section.className).toContain('[&_h2]:font-bold')
    expect(section.className).toContain('[&_ul]:list-disc')
    expect(countFixedColours(container.innerHTML)).toBe(0)
  })
})

describe('PublicHeader', () => {
  it('the chalice and wordmark, and Sign in, both to sign-in', () => {
    render(<PublicHeader />)
    expect(screen.getByText('GRAIL SEEKER').closest('a')).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })
})

describe('PlainHeader', () => {
  it('the brand only, a full page load to Searches, no Sign in', () => {
    render(<PlainHeader />)
    expect(screen.getByText('GRAIL SEEKER').closest('a')).toHaveAttribute('href', '/searches')
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
  })
})

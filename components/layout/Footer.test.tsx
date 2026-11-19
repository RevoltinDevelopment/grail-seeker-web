import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Footer, { copyrightYears } from './Footer'

// Story 1.105 (Mahan, 2026-11-19): the footer's legal links open the app's own pages.
describe('Footer', () => {
  it('Privacy Policy and Terms of Service open the app’s own pages, in the same tab', () => {
    render(<Footer />)
    for (const [name, href] of [
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
    ]) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).not.toHaveAttribute('target')
    }
    expect(screen.getByText('Launching Q1 2027')).toBeInTheDocument()
  })

  it('copyright runs from 2025 to this year in Eastern', () => {
    expect(copyrightYears(new Date('2025-06-01T12:00:00Z'))).toBe('2025')
    expect(copyrightYears(new Date('2026-11-19T12:00:00Z'))).toBe('2025–2026')
    // 11:30 PM Eastern on Dec 31 is still the old year
    expect(copyrightYears(new Date('2027-01-01T04:30:00Z'))).toBe('2025–2026')
  })
})

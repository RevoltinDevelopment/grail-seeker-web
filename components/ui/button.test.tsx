/**
 * Story 1.16: toolchain smoke test — confirms Vitest + jsdom + React Testing
 * Library + the @/* path alias actually work end to end, against the one
 * component shadcn's own init already generated. Not meant as meaningful
 * coverage of Button itself (that's shadcn's own tested code).
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Button } from './button'

describe('Button (toolchain smoke test)', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('fires onClick', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button onClick={() => (clicked = true)}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    expect(clicked).toBe(true)
  })

  // Story 1.79: the design's buttons are 44px tall at least; the small sizes stay for
  // controls inside other controls (dialog and sheet close buttons).
  it('is 44px tall at least by default, and not at the small icon size', () => {
    render(
      <>
        <Button>Save</Button>
        <Button size="icon-sm" aria-label="Close" />
      </>
    )
    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('min-h-touch')
    expect(screen.getByRole('button', { name: 'Close' }).className).not.toContain('min-h-touch')
  })
})

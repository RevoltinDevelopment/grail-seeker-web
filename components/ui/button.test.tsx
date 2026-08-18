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
})

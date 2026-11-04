import { describe, expect, it } from 'vitest'

import { cn } from './utils'

// Story 1.79: tailwind-merge must know the design's custom sizes, or it drops them.
describe('cn with the design tokens', () => {
  it('keeps a design font size beside a text colour', () => {
    expect(cn('text-label', 'text-muted-foreground')).toBe('text-label text-muted-foreground')
    expect(cn('text-card-title', 'text-ink')).toBe('text-card-title text-ink')
  })

  it('lets a later design size replace an earlier one', () => {
    expect(cn('text-sm', 'text-page-title')).toBe('text-page-title')
    expect(cn('min-h-touch', 'min-h-0')).toBe('min-h-0')
    expect(cn('rounded-lg', 'rounded-card')).toBe('rounded-card')
  })
})

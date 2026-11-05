import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AttentionBanner } from './AttentionBanner'

// Story 1.83 (U-05): drawing a chosen banner.
describe('AttentionBanner', () => {
  it('draws the heading, words, button and days left, in its tone', () => {
    render(
      <AttentionBanner
        banner={{
          state: 5,
          tone: 'attention',
          heading: 'Choose which searches to keep',
          paragraphs: ['One.', 'Two.'],
          action: { label: 'Choose searches', href: '/plan/choose', filled: true },
          due: '7 days left',
          dismissible: false,
        }}
      />
    )
    const section = screen.getByRole('region', { name: 'Choose which searches to keep' })
    expect(section.className).toContain('bg-attention')
    expect(section).toHaveTextContent('One.Two.')
    expect(screen.getByRole('link', { name: 'Choose searches' })).toHaveAttribute(
      'href',
      '/plan/choose'
    )
    expect(screen.getByText('7 days left')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
  })

  it('only a dismissible banner can be dismissed', () => {
    const onDismiss = vi.fn()
    render(
      <AttentionBanner
        banner={{
          state: 9,
          tone: 'info',
          heading: 'You may be missing matches',
          paragraphs: ['x'],
          action: null,
          due: null,
          dismissible: true,
        }}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('the hold tone is dashed', () => {
    render(
      <AttentionBanner
        banner={{
          state: 3,
          tone: 'hold',
          heading: 'On hold',
          paragraphs: ['x'],
          action: null,
          due: null,
          dismissible: false,
        }}
      />
    )
    expect(screen.getByRole('region', { name: 'On hold' }).className).toContain('border-dashed')
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { FormNotice, SlotCount } from './SlotParts'

describe('SlotCount (Story 1.85)', () => {
  it('shows the hint alone when there is no alert', () => {
    render(<SlotCount id="c" hint="9.6 to 9.8 = 2 slots" alert={null} />)
    expect(screen.getByText('9.6 to 9.8 = 2 slots')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('draws the alert: its words, one block per slot either side of the limit, and the legend', () => {
    const { container } = render(
      <SlotCount
        id="c"
        hint={null}
        alert={{
          equation: '9.0 to 9.8 = 5 slots',
          sentence:
            'You have 4 of your 10 slots free. Choose fewer grades, or delete a search you no longer need.',
          meter: { others: 6, thisIn: 4, free: 0, over: 1, label: 'the summary' },
          thisSlots: 5,
        }}
      />
    )
    expect(screen.getByText('9.0 to 9.8 = 5 slots')).toBeInTheDocument()
    const meter = screen.getByRole('img', { name: 'the summary' })
    expect(meter.querySelectorAll('[data-seg="other"]')).toHaveLength(6)
    expect(meter.querySelectorAll('[data-seg="this"]')).toHaveLength(4)
    expect(meter.querySelectorAll('[data-seg="over"]')).toHaveLength(1)
    expect(container).toHaveTextContent('This search · 5')
    expect(container).toHaveTextContent('More than your plan · 1')
    expect(container).not.toHaveTextContent('Free ·')
  })
})

describe('FormNotice (Story 1.85)', () => {
  it('a refusal is an alert that takes focus, with its actions as links', () => {
    render(
      <FormNotice
        notice={{
          tone: 'info',
          role: 'alert',
          heading: 'Your search is not saved yet',
          paragraphs: ['Words.', 'Everything you entered is still here.'],
          actions: [{ label: 'Manage slots', href: '/plan', filled: false }],
        }}
      />
    )
    const notice = screen.getByRole('alert', { name: 'Your search is not saved yet' })
    expect(notice).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Manage slots' })).toHaveAttribute('href', '/plan')
  })

  it('a standing state is a region and leaves focus alone', () => {
    render(
      <FormNotice
        notice={{
          tone: 'hold',
          role: 'region',
          heading: 'This search is on hold',
          paragraphs: ['Words.'],
          actions: [],
        }}
      />
    )
    expect(screen.getByRole('region', { name: 'This search is on hold' })).not.toHaveFocus()
  })
})

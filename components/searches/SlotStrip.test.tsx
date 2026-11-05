import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { AccountSummary } from '@/lib/api/account'

import { SlotStrip, meterSegments, planName, slotSentence } from './SlotStrip'

// Story 1.83 (U-05): the slot strip (searches-home.html).
const base: AccountSummary = {
  plan: { code: 'collector', name: 'Collector', includedSlots: 10, textsIncluded: true },
  addonSlots: 0,
  status: 'active',
  slots: { entitled: 10, inUse: 6, free: 4, over: 0 },
  searches: [
    {
      searchId: 'a',
      slots: 3,
      firstSlot: 1,
      lastSlot: 3,
      isActive: true,
      fate: 'continues',
      fateAt: null,
    },
    {
      searchId: 'b',
      slots: 1,
      firstSlot: 4,
      lastSlot: 4,
      isActive: false,
      fate: 'continues',
      fateAt: null,
    },
    {
      searchId: 'c',
      slots: 2,
      firstSlot: 5,
      lastSlot: 6,
      isActive: true,
      fate: 'continues',
      fateAt: null,
    },
  ],
  heldSearches: [],
  change: null,
  enforcement: 'observe',
}

describe('SlotStrip', () => {
  it("one block per slot: in use, paused, free; the line at the plan's end", () => {
    expect(meterSegments(base)).toEqual({
      kinds: ['in', 'in', 'in', 'paused', 'in', 'in', 'free', 'free', 'free', 'free'],
      limitAfter: 10,
    })
    expect(slotSentence(base)).toEqual({
      text: '6 in use, 4 free.',
      strong: false,
      label: '6 of 10 slots in use, 1 of them paused.',
    })
  })

  it("over the plan: the line after the plan's slots, the rest hatched, the sentence as drawn", () => {
    const over = {
      ...base,
      plan: { ...base.plan!, name: 'Starter', includedSlots: 5 },
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
    }
    expect(meterSegments(over).kinds).toEqual(['in', 'in', 'in', 'paused', 'in', 'over'])
    render(<SlotStrip account={over} />)
    expect(screen.getByLabelText('Your slots')).toHaveTextContent('Starter plan5 slots')
    expect(screen.getByText('6 in use, 1 over your plan.').parentElement).toHaveTextContent(
      '6 in use, 1 over your plan. Nothing has been stopped.'
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      '6 slots in use. Your plan has 5. 1 over.'
    )
    // the line sits after the plan's 5 blocks, once, before the hatched one
    const order = Array.from(
      screen.getByRole('img').querySelectorAll('[data-seg], [data-testid="limit"]')
    ).map((el) => el.getAttribute('data-seg') ?? 'limit')
    expect(order).toEqual(['in', 'in', 'in', 'paused', 'in', 'limit', 'over'])
  })

  it("a lapsed account shows its plan's slots, empty, not the server's 0 (searches-pause-held.html)", () => {
    const lapsed = {
      ...base,
      status: 'lapsed',
      slots: { entitled: 0, inUse: 0, free: 0, over: 0 },
      searches: [],
      heldSearches: [
        {
          searchId: 'a',
          slots: 3,
          heldReason: 'lapse' as const,
          isActive: true,
          fate: 'held',
          fateAt: null,
        },
      ],
    }
    expect(meterSegments(lapsed).kinds).toEqual(Array(10).fill('free'))
    expect(slotSentence(lapsed).label).toBe(
      'No slots in use while your searches are on hold. Your plan has 10.'
    )
    render(<SlotStrip account={lapsed} />)
    expect(screen.getByLabelText('Your slots')).toHaveTextContent('Collector plan10 slots')
  })

  it('a confirmed downgrade names the smaller plan with its date (Mahan); after the date, the plan alone', () => {
    const pending = {
      ...base,
      slots: { entitled: 5, inUse: 6, free: 0, over: 1 },
      change: {
        kind: 'downgrade_pending' as const,
        plan: { code: 'starter', name: 'Starter', includedSlots: 5 },
        addonSlots: 0,
        slots: 5,
        effectiveAt: '2026-11-01T04:00:00Z',
        keepSearchIds: ['a'],
      },
    }
    expect(planName(pending)).toBe('Starter plan (from Nov 1)')
    render(<SlotStrip account={pending} />)
    expect(screen.getByLabelText('Your slots')).toHaveTextContent(
      'Starter plan (from Nov 1)5 slots'
    )
    expect(planName({ ...base, plan: { ...base.plan!, name: 'Starter', includedSlots: 5 } })).toBe(
      'Starter plan'
    )
  })

  it('every search on hold: none in use', () => {
    const held = {
      ...base,
      slots: { entitled: 10, inUse: 0, free: 10, over: 0 },
      searches: [],
      heldSearches: [
        {
          searchId: 'a',
          slots: 3,
          heldReason: 'lapse' as const,
          isActive: true,
          fate: 'held',
          fateAt: null,
        },
      ],
    }
    expect(slotSentence(held).text).toBe('None in use while your searches are on hold.')
  })

  it('no plan, no strip; with one, "View plan" leads to the plan page (Story 1.85)', () => {
    const { container } = render(<SlotStrip account={{ ...base, plan: null }} />)
    expect(container).toBeEmptyDOMElement()
    render(<SlotStrip account={base} />)
    expect(screen.getByRole('link', { name: 'View plan' })).toHaveAttribute('href', '/plan')
  })
})

/**
 * Story 1.35: MyComicShop added to the alerts platform filter dropdown —
 * previously subscribers had no way to filter their alert list down to
 * MyComicShop-sourced alerts at all.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AlertFilters } from './AlertFilters'

describe('AlertFilters — MyComicShop option (Story 1.35)', () => {
  it('renders a MyComicShop option in the platform dropdown, alongside eBay and Heritage', () => {
    render(
      <AlertFilters
        platform="all"
        matchType="all"
        onPlatformChange={vi.fn()}
        onMatchTypeChange={vi.fn()}
      />
    )
    const select = screen.getByLabelText('Platform') as HTMLSelectElement
    const optionValues = Array.from(select.options).map((o) => o.value)
    expect(optionValues).toEqual(['all', 'ebay', 'heritage', 'mycomicshop'])
  })

  it('selecting MyComicShop fires onPlatformChange with "mycomicshop"', async () => {
    const user = userEvent.setup()
    const onPlatformChange = vi.fn()
    render(
      <AlertFilters
        platform="all"
        matchType="all"
        onPlatformChange={onPlatformChange}
        onMatchTypeChange={vi.fn()}
      />
    )
    await user.selectOptions(screen.getByLabelText('Platform'), 'mycomicshop')
    expect(onPlatformChange).toHaveBeenCalledWith('mycomicshop')
  })

  it('eBay and Heritage selection still work (regression)', async () => {
    const user = userEvent.setup()
    const onPlatformChange = vi.fn()
    render(
      <AlertFilters
        platform="all"
        matchType="all"
        onPlatformChange={onPlatformChange}
        onMatchTypeChange={vi.fn()}
      />
    )
    await user.selectOptions(screen.getByLabelText('Platform'), 'ebay')
    expect(onPlatformChange).toHaveBeenCalledWith('ebay')
    await user.selectOptions(screen.getByLabelText('Platform'), 'heritage')
    expect(onPlatformChange).toHaveBeenCalledWith('heritage')
  })
})

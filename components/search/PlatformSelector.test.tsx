/**
 * Story 1.35: MyComicShop added as a real, selectable platform (previously
 * only eBay/Heritage existed here at all — there was no way to select
 * MyComicShop for a search, which is what let real matching searches go
 * silently unalerted before this story).
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PlatformSelector } from './PlatformSelector'

describe('PlatformSelector — MyComicShop (Story 1.35)', () => {
  it('renders a real, enabled MyComicShop checkbox', () => {
    render(<PlatformSelector platforms={['ebay', 'heritage']} onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox', { name: /MyComicShop/ })
    expect(checkbox).toBeEnabled()
    expect(checkbox).not.toBeChecked()
  })

  it('checks the box when mycomicshop is already in platforms', () => {
    render(<PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: /MyComicShop/ })).toBeChecked()
  })

  it('turning MyComicShop on calls onChange with it added, no confirmation needed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PlatformSelector platforms={['ebay', 'heritage']} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
    expect(onChange).toHaveBeenCalledWith(['ebay', 'heritage', 'mycomicshop'])
  })

  it('turning MyComicShop off requires confirmation, same as eBay/Heritage (regression)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={onChange} />
    )
    await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/turn off MyComicShop/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Turn Off' }))
    expect(onChange).toHaveBeenCalledWith(['ebay', 'heritage'])
  })

  it('the updated "coming soon" copy reflects Q4 2026', () => {
    render(<PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={vi.fn()} />)
    expect(screen.getByText(/Next 2 Marketplaces \(Coming Q4 2026\)/)).toBeInTheDocument()
  })

  it('min-one-active rule still applies when only one platform remains (regression)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PlatformSelector platforms={['mycomicshop']} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/must leave at least one platform active/i)).toBeInTheDocument()
  })
})

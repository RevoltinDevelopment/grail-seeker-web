import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '@/test-utils/renderWithProviders'
import type { Issue } from '@/types/issue.types'
import { VariantSelect } from './VariantSelect'

const marchOfComicsShape: Issue = {
  number: '8',
  title: null,
  sortCode: 8,
  plainIssueId: null, // no plain printing -- all-named-variants shape
  variants: [
    { id: 'non-ad', variantName: 'Non-Ad' },
    { id: 'sears', variantName: 'Sears Roebuck' },
  ],
  volume: null,
  noVolume: true,
  displayVolumeWithNumber: false,
  publicationYear: 1953,
}

const asmShape: Issue = {
  number: '1',
  title: 'Great Power',
  sortCode: 1,
  plainIssueId: 'primary',
  variants: [{ id: 'finch-variant', variantName: 'Finch Variant' }],
  volume: null,
  noVolume: true,
  displayVolumeWithNumber: false,
  publicationYear: 2018,
}

describe('VariantSelect', () => {
  it('defaults display to the plain printing when one exists', () => {
    renderWithProviders(<VariantSelect group={asmShape} value="primary" onChange={vi.fn()} />)
    expect(screen.getByText('Cover A (standard)')).toBeInTheDocument()
  })

  it('defaults display to "Search all variants" when no plain printing exists (March-of-Comics shape)', () => {
    renderWithProviders(
      <VariantSelect group={marchOfComicsShape} value={null} onChange={vi.fn()} />
    )
    expect(screen.getByText('Search all variants')).toBeInTheDocument()
  })

  it('always offers "Search all variants" as a choice even when a plain printing exists', async () => {
    renderWithProviders(<VariantSelect group={asmShape} value="primary" onChange={vi.fn()} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Search all variants' })).toBeInTheDocument()
  })

  it('resolves to null (never a sentinel string) when the user picks "Search all variants"', async () => {
    const onChange = vi.fn()
    renderWithProviders(<VariantSelect group={asmShape} value="primary" onChange={onChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Search all variants' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('resolves to the specific variant id when a named variant is chosen', async () => {
    const onChange = vi.fn()
    renderWithProviders(<VariantSelect group={asmShape} value="primary" onChange={onChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Finch Variant' }))
    expect(onChange).toHaveBeenCalledWith('finch-variant')
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { GradeRangeSelector } from './GradeRangeSelector'

// Invented for the test: 9.7 is on no real list, so it proves the options come from the prop.
const GRADES = [
  { value: 9.4, label: '9.4 - Near Mint' },
  { value: 9.6, label: '9.6 - NM+' },
  { value: 9.7, label: '9.7 - Test Grade' },
  { value: 9.8, label: '9.8 - NM/M' },
  { value: 10, label: '10.0 - Gem Mint' },
]

function optionTexts(name: string) {
  return Array.from((screen.getByRole('combobox', { name }) as HTMLSelectElement).options).map((o) => o.textContent)
}

describe('GradeRangeSelector (Story 1.84)', () => {
  it('lists "Any" and then the given grades with their labels, in order, on both sides', () => {
    render(<GradeRangeSelector grades={GRADES} gradeMin={null} gradeMax={null} onChange={vi.fn()} />)
    const expected = ['Any', ...GRADES.map((g) => g.label)]
    expect(optionTexts('Minimum grade')).toEqual(expected)
    expect(optionTexts('Maximum grade')).toEqual(expected)
    expect(screen.getByText('Grade')).toBeInTheDocument()
    expect(screen.getByText('Minimum')).toBeInTheDocument()
    expect(screen.getByText('Maximum')).toBeInTheDocument()
  })

  it('shows a saved whole-number grade as selected (10 matches "10.0")', () => {
    render(<GradeRangeSelector grades={GRADES} gradeMin={9.4} gradeMax={10} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Minimum grade' })).toHaveDisplayValue('9.4 - Near Mint')
    expect(screen.getByRole('combobox', { name: 'Maximum grade' })).toHaveDisplayValue('10.0 - Gem Mint')
  })

  it('code review: shows a saved grade that is not on the list for what it is, never as "Any"', () => {
    render(<GradeRangeSelector grades={GRADES} gradeMin={9.3} gradeMax={9.8} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Minimum grade' })).toHaveDisplayValue('9.3 - not a standard grade')
    expect(optionTexts('Maximum grade')).not.toContain('9.3 - not a standard grade')
  })

  it('moves the Maximum up when the Minimum passes it', () => {
    const onChange = vi.fn()
    render(<GradeRangeSelector grades={GRADES} gradeMin={9.4} gradeMax={9.6} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Minimum grade' }), { target: { value: '9.8' } })
    expect(onChange).toHaveBeenCalledWith(9.8, 9.8)
  })

  it('moves the Minimum down when the Maximum passes it', () => {
    const onChange = vi.fn()
    render(<GradeRangeSelector grades={GRADES} gradeMin={9.8} gradeMax={10} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Maximum grade' }), { target: { value: '9.6' } })
    expect(onChange).toHaveBeenCalledWith(9.6, 9.6)
  })

  it('never corrects "Any", and choosing "Any" sends null', () => {
    const onChange = vi.fn()
    render(<GradeRangeSelector grades={GRADES} gradeMin={null} gradeMax={9.6} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Minimum grade' }), { target: { value: '9.8' } })
    expect(onChange).toHaveBeenLastCalledWith(9.8, 9.8)
    fireEvent.change(screen.getByRole('combobox', { name: 'Maximum grade' }), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(null, null)
  })

  it('a new search that could not load its grades says so, with no dropdowns and Try again', () => {
    const onRetry = vi.fn()
    render(<GradeRangeSelector grades={null} failed onRetry={onRetry} gradeMin={null} gradeMax={null} onChange={vi.fn()} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('The list of grades could not be loaded')
    expect(screen.getByRole('alert')).toHaveTextContent('This search cannot be saved until they load. Nothing you entered is lost.')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('an edit that could not load its grades keeps the saved grade, with its slots', () => {
    render(
      <GradeRangeSelector
        grades={null}
        failed
        mode="edit"
        savedGradeText="9.0 to 9.4"
        savedSlots={3}
        gradeMin={9}
        gradeMax={9.4}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('9.0 to 9.4')).toBeInTheDocument()
    expect(screen.getByText('saved grade, 3 slots')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The grade cannot be changed right now. Everything else on this search can, and its grade stays as it is.'
    )
  })

  it('says "1 slot", and leaves the slots out when the search does not carry them', () => {
    const { rerender } = render(
      <GradeRangeSelector grades={null} failed mode="edit" savedGradeText="9.8" savedSlots={1} gradeMin={9.8} gradeMax={9.8} onChange={vi.fn()} />
    )
    expect(screen.getByText('saved grade, 1 slot')).toBeInTheDocument()
    rerender(<GradeRangeSelector grades={null} failed mode="edit" savedGradeText="9.8" gradeMin={9.8} gradeMax={9.8} onChange={vi.fn()} />)
    expect(screen.getByText('saved grade')).toBeInTheDocument()
  })

  it('shows "Trying again..." and cannot be pressed twice while a retry is in flight', () => {
    render(<GradeRangeSelector grades={null} failed retrying onRetry={vi.fn()} gradeMin={null} gradeMax={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Trying again...' })).toBeDisabled()
  })
})

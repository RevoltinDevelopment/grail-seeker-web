'use client'

interface GradeRangeSelectorProps {
  gradeMin: number | null
  gradeMax: number | null
  onChange: (gradeMin: number | null, gradeMax: number | null) => void
  error?: string
}

const GRADE_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 0.5, label: '0.5 - Poor' },
  { value: 1.0, label: '1.0 - Fair' },
  { value: 1.5, label: '1.5' },
  { value: 2.0, label: '2.0 - Good' },
  { value: 2.5, label: '2.5' },
  { value: 3.0, label: '3.0' },
  { value: 3.5, label: '3.5' },
  { value: 4.0, label: '4.0 - Very Good' },
  { value: 4.5, label: '4.5' },
  { value: 5.0, label: '5.0' },
  { value: 5.5, label: '5.5' },
  { value: 6.0, label: '6.0 - Fine' },
  { value: 6.5, label: '6.5' },
  { value: 7.0, label: '7.0' },
  { value: 7.5, label: '7.5' },
  { value: 8.0, label: '8.0 - Very Fine' },
  { value: 8.5, label: '8.5' },
  { value: 9.0, label: '9.0 - Near Mint' },
  { value: 9.2, label: '9.2' },
  { value: 9.4, label: '9.4' },
  { value: 9.6, label: '9.6' },
  { value: 9.8, label: '9.8' },
  { value: 10.0, label: '10.0 - Gem Mint' },
]

export function GradeRangeSelector({
  gradeMin,
  gradeMax,
  onChange,
  error,
}: GradeRangeSelectorProps) {
  // CRITICAL: Auto-correction logic per Product Owner requirements
  const handleGradeMinChange = (newMin: number | null) => {
    let adjustedMax = gradeMax

    // Only auto-correct if both values are NOT "Any" (null)
    if (newMin !== null && gradeMax !== null) {
      // If new min is greater than current max, adjust max to match
      if (newMin > gradeMax) {
        adjustedMax = newMin
      }
    }

    onChange(newMin, adjustedMax)
  }

  const handleGradeMaxChange = (newMax: number | null) => {
    let adjustedMin = gradeMin

    // Only auto-correct if both values are NOT "Any" (null)
    if (newMax !== null && gradeMin !== null) {
      // If new max is less than current min, adjust min to match
      if (newMax < gradeMin) {
        adjustedMin = newMax
      }
    }

    onChange(adjustedMin, newMax)
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-950">Grade Range</label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <select
            value={gradeMin ?? ''}
            onChange={(e) =>
              handleGradeMinChange(e.target.value === '' ? null : parseFloat(e.target.value))
            }
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue ${
              error ? 'border-error-red' : 'border-slate-300'
            }`}
          >
            {GRADE_OPTIONS.map((option) => (
              <option key={`min-${option.value}`} value={option.value ?? ''}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-600">Minimum</p>
        </div>

        <span className="pt-1 text-slate-600">to</span>

        <div className="flex-1">
          <select
            value={gradeMax ?? ''}
            onChange={(e) =>
              handleGradeMaxChange(e.target.value === '' ? null : parseFloat(e.target.value))
            }
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue ${
              error ? 'border-error-red' : 'border-slate-300'
            }`}
          >
            {GRADE_OPTIONS.map((option) => (
              <option key={`max-${option.value}`} value={option.value ?? ''}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-600">Maximum</p>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-error-red">{error}</p>}
      {!error && <p className="mt-1 text-xs text-slate-600">Select "Any" to see all grades</p>}
    </div>
  )
}

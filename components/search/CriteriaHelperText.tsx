'use client'

import { InfoIcon } from './formStyles'

interface CriteriaHelperTextProps {
  /** 'Any' means unset */
  pageQuality: string
  /** 'Any' means unset */
  gradingAuthority: string
  /** '' means unset */
  maxPrice: string
}

// "X" / "X and Y" / "X, Y, and Z"
function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/**
 * Shown when narrowing criteria are set (Session 72 review, C2 follow-up):
 * users constraining Page Quality / Grading Authority / Maximum Price should
 * understand they are trading alert volume for precision — fewer results is
 * correct behavior, not a broken search.
 */
export function CriteriaHelperText({
  pageQuality,
  gradingAuthority,
  maxPrice,
}: CriteriaHelperTextProps) {
  const set: string[] = []
  if (pageQuality !== 'Any') set.push('Page Quality')
  // Story 1.84: the field is labelled "Graded by" (Mahan, 2026-10-21)
  if (gradingAuthority !== 'Any') set.push('Graded by')
  if (maxPrice !== '') set.push('Maximum Price')

  if (set.length === 0) {
    return null
  }

  return (
    <p className="flex items-start gap-2 text-sm text-ink">
      <span className="mt-0.5 flex-none text-info-icon">
        <InfoIcon />
      </span>
      <span>Setting {joinWithAnd(set)} will give you fewer, more targeted results.</span>
    </p>
  )
}

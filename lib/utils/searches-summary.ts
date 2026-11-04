import type { GrailSearch } from '@/types/search.types'

/**
 * Story 1.82 (UX plan section 10): the line under the Searches title, which replaces the
 * Dashboard's stat cards: "6 searches: 4 running, 1 paused, 1 on hold". Parts with none are left
 * out. A held search counts as on hold whatever its own pause says.
 */
export function searchesSummary(
  searches: readonly Pick<GrailSearch, 'isActive' | 'held'>[]
): string {
  if (searches.length === 0) return 'No searches yet'
  const held = searches.filter((s) => s.held).length
  const running = searches.filter((s) => !s.held && s.isActive).length
  const paused = searches.length - held - running
  const parts = [
    running > 0 ? `${running} running` : '',
    paused > 0 ? `${paused} paused` : '',
    held > 0 ? `${held} on hold` : '',
  ].filter(Boolean)
  return `${searches.length} ${searches.length === 1 ? 'search' : 'searches'}: ${parts.join(', ')}`
}

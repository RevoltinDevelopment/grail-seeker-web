import type { GradeOption } from '@/lib/api/grades'

/**
 * Story 1.85 (S-10): what a grade range costs in search slots, for the form's hint and alert.
 *
 * The rule is the server's: one slot for each standard grade between the bounds, both included; a
 * missing bound ("Any") is the lowest or highest grade; never fewer than one. It is counted here
 * from the server's own grade list (GET /api/grades), so it cannot differ from the server's count.
 * The two copies it must equal: slotsForSearch() in the backend's src/domain/services/searchSlots.ts
 * and search_slot_count() in Migration 068. The server stays the only judge: it refuses a save
 * that does not fit, whatever this says.
 */
export function slotsForRange(
  grades: readonly GradeOption[],
  min: number | null,
  max: number | null
): number {
  if (grades.length === 0) return 1
  const lo = min ?? grades[0].value
  const hi = max ?? grades[grades.length - 1].value
  // Compared at one decimal, as the grades are written (9.4, not 9.4000000001)
  const inRange = grades.filter(
    (g) =>
      Math.round(g.value * 10) >= Math.round(lo * 10) &&
      Math.round(g.value * 10) <= Math.round(hi * 10)
  )
  return Math.max(1, inRange.length)
}

const one = (g: number) => Number(g).toFixed(1)

/**
 * The range in numbers, as the hint says it: "9.8", "9.6 to 9.8", "9.8 to 10.0" (a side left at
 * Any is the lowest or highest grade), "Every grade".
 */
export function rangeLabel(
  grades: readonly GradeOption[],
  min: number | null,
  max: number | null
): string {
  const lowest = grades[0]?.value ?? 0.5
  const highest = grades[grades.length - 1]?.value ?? 10
  const lo = min ?? lowest
  const hi = max ?? highest
  if (one(lo) === one(lowest) && one(hi) === one(highest)) return 'Every grade'
  return one(lo) === one(hi) ? one(lo) : `${one(lo)} to ${one(hi)}`
}

export const slotsWord = (n: number) => `${n} ${n === 1 ? 'slot' : 'slots'}`

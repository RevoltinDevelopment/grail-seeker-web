/**
 * Story 1.82: when a match was found, as Latest matches says it: "just now", "5 minutes ago",
 * "2 hours ago", "yesterday", then the date ("Oct 12"; with the year if not this year).
 */
export function matchTime(foundAt: string | Date, now: Date = new Date()): string {
  const at = typeof foundAt === 'string' ? new Date(foundAt) : foundAt
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000)
  if (!Number.isFinite(minutes)) return ''
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (at >= startOfToday) {
    const hours = Math.floor(minutes / 60)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }
  // The calendar day before, not 24 hours before: right on the days the clocks change.
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (at >= startOfYesterday) return 'yesterday'
  return at.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(at.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

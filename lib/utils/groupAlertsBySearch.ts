import { formatIssueNumber } from '@/lib/utils/series-formatter'
import type { Alert } from '@/types/alert.types'

export interface AlertGroup {
  id: string
  title: string
  alerts: Alert[]
}

export function groupAlertsBySearch(alerts: Alert[]): AlertGroup[] {
  const groups = new Map<string, AlertGroup>()

  for (const alert of alerts) {
    const key = alert.searchId
    if (!groups.has(key)) {
      const title = `${alert.search.series.title} ${formatIssueNumber(alert.search.issueNumber, alert.search.issueVolumeText)}`
      groups.set(key, { id: key, title, alerts: [] })
    }
    groups.get(key)!.alerts.push(alert)
  }

  return Array.from(groups.values()).sort((a, b) => a.title.localeCompare(b.title))
}

import { describe, it, expect } from 'vitest'
import type { Alert } from '@/types/alert.types'
import { groupAlertsBySearch } from './groupAlertsBySearch'

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    searchId: 'search-1',
    search: {
      series: { title: 'Blue Bolt', volume: 1 },
      issueNumber: '7',
      issueVolumeText: null,
    },
    listing: {
      title: 'Blue Bolt #7',
      price: 100,
      grade: null,
      pageQuality: null,
      gradingAuthority: null,
      url: null,
      platform: 'ebay',
      ebayItemId: null,
    },
    isDirectMatch: true,
    notificationSent: true,
    notificationSentAt: null,
    createdAt: '2026-08-21T00:00:00Z',
    listingStatus: 'active',
    archivedAt: null,
    archiveReason: null,
    ...overrides,
  }
}

describe('groupAlertsBySearch', () => {
  // Bug found live (2026-08-21, Blue Bolt Vol. 8 #7): group titles were built
  // from series.title + issueNumber alone, dropping the volume for a
  // volume-scoped-numbering series -- same root cause as IssueSelector's own
  // resolved-chip bug and search card titles, closed the same way.
  it('includes the volume in the group title when issueVolumeText is set', () => {
    const alert = makeAlert({
      search: { series: { title: 'Blue Bolt', volume: 1 }, issueNumber: '7', issueVolumeText: '8' },
    })

    const groups = groupAlertsBySearch([alert])

    expect(groups).toHaveLength(1)
    expect(groups[0].title).toBe('Blue Bolt Vol. 8 #7')
  })

  it('omits the volume prefix when issueVolumeText is null, unchanged from before', () => {
    const alert = makeAlert()

    const groups = groupAlertsBySearch([alert])

    expect(groups[0].title).toBe('Blue Bolt #7')
  })

  it('groups multiple alerts for the same search together', () => {
    const alertA = makeAlert({ id: 'alert-1' })
    const alertB = makeAlert({ id: 'alert-2' })

    const groups = groupAlertsBySearch([alertA, alertB])

    expect(groups).toHaveLength(1)
    expect(groups[0].alerts).toHaveLength(2)
  })
})

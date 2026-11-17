import type { Alert } from '@/types/alert.types'

/** Story 1.96: an active alert for tests; an eBay match within the price, texted, not yet seen. */
export function makeAlert(over: Omit<Partial<Alert>, 'listing'> & { listing?: Partial<Alert['listing']> } = {}): Alert {
  const { listing, ...rest } = over
  return {
    id: 'a1',
    searchId: 's1',
    search: { series: { title: 'Werewolf by Night', volume: 1 }, issueNumber: '32', issueVolumeText: null, maxPrice: 6000 },
    listing: {
      title: 'Werewolf by Night #32 CGC 9.6, 1st appearance of Moon Knight',
      price: 5400,
      grade: 9.6,
      pageQuality: null,
      gradingAuthority: 'cgc',
      url: 'https://example.test/item',
      platform: 'ebay',
      ebayItemId: '1',
      ...listing,
    },
    isDirectMatch: true,
    nearMiss: null,
    seenAt: null,
    notificationSent: true,
    notificationSentAt: null,
    createdAt: new Date(2026, 10, 16, 10, 0).toISOString(),
    ...rest,
  }
}

/**
 * eBay Partner Network Campaign URL Builder
 *
 * Wraps eBay item URLs with affiliate tracking for the eBay Partner Network.
 *
 * @see https://developer.ebay.com/api-docs/buy/static/ref-buy-browse-link.html
 */

/**
 * Builds an eBay Partner Network campaign tracking URL
 *
 * @param itemId - eBay item ID (e.g., "267476377265")
 * @param campaignId - Your eBay Partner Network campaign ID (default from env)
 * @returns Full eBay Rover URL with campaign tracking
 *
 * @example
 * buildEbayCampaignUrl("267476377265")
 * // Returns: https://rover.ebay.com/rover/1/711-53200-19255-0/1?ff3=4&pub=5339123882&toolid=10001&campid=5339123882&customid=&mpre=https://www.ebay.com/itm/267476377265
 */
export function buildEbayCampaignUrl(
  itemId: string,
  campaignId?: string
): string {
  const campaign = campaignId || process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID

  if (!campaign) {
    // Fallback to direct URL if no campaign ID configured
    console.warn('eBay campaign ID not configured, using direct link')
    return `https://www.ebay.com/itm/${itemId}`
  }

  // Use eBay Partner Network link with proper mkevt parameter
  // Format based on eBay's current affiliate link structure
  const itemUrl = `https://www.ebay.com/itm/${itemId}`

  // Add EPN tracking parameters to direct item URL
  // mkcid=1 means "affiliate link"
  // mkrid is the market/routing ID for US (711-53200-19255-0)
  // campid is your campaign ID
  // mkevt=1 means "item page view"
  return `${itemUrl}?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${campaign}&customid=&toolid=10001&mkevt=1`
}

/**
 * Builds an eBay search URL with campaign tracking
 *
 * @param searchQuery - eBay search query
 * @param campaignId - Your eBay Partner Network campaign ID
 * @returns eBay search URL with campaign tracking
 *
 * @example
 * buildEbaySearchUrl("Amazing Spider-Man 129 CGC")
 */
export function buildEbaySearchUrl(
  searchQuery: string,
  campaignId?: string
): string {
  const campaign = campaignId || process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID

  if (!campaign) {
    // Fallback to direct URL if no campaign ID configured
    return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`
  }

  const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`
  const roverBaseUrl = 'https://rover.ebay.com/rover/1/711-53200-19255-0/1'

  // Build query parameters manually to avoid double-encoding the mpre URL
  const params = [
    'ff3=4',
    `pub=${campaign}`,
    'toolid=10001',
    `campid=${campaign}`,
    'customid=',
    `mpre=${searchUrl}`,
  ].join('&')

  return `${roverBaseUrl}?${params}`
}

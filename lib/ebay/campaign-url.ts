/**
 * eBay Partner Network Campaign URL Builder
 *
 * Wraps eBay item URLs with affiliate tracking for the eBay Partner Network.
 *
 * @see https://developer.ebay.com/api-docs/buy/static/ref-buy-browse-link.html
 */

/**
 * Extract numeric item ID from various eBay ID formats
 *
 * Handles:
 * - Pure numeric: "366083225850"
 * - v1 format: "v1|276614478282|0" (eBay Browse API format)
 *
 * @param ebayItemId - eBay item ID in any format
 * @returns Numeric item ID or null if invalid
 */
function extractItemId(ebayItemId: string): string | null {
  if (!ebayItemId) {
    return null
  }

  // Check if it's v1|...|0 format (eBay Browse API format)
  if (ebayItemId.startsWith('v1|')) {
    const parts = ebayItemId.split('|')
    if (parts.length >= 2) {
      return parts[1] // Extract middle part (numeric ID)
    }
  }

  // Check if it's pure numeric
  if (/^\d+$/.test(ebayItemId)) {
    return ebayItemId
  }

  // Try to extract numeric portion as fallback
  const numericMatch = ebayItemId.match(/\d+/)
  return numericMatch ? numericMatch[0] : null
}

/**
 * Builds an eBay Partner Network campaign tracking URL
 *
 * @param itemId - eBay item ID (e.g., "267476377265" or "v1|267476377265|0")
 * @param campaignId - Your eBay Partner Network campaign ID (default from env)
 * @returns eBay item URL with campaign tracking query parameters
 *
 * @example
 * buildEbayCampaignUrl("267476377265")
 * // Returns: https://www.ebay.com/itm/267476377265?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339123882&customid=&toolid=10001&mkevt=1
 *
 * @note Backend equivalent exists at src/infrastructure/utils/EbayCampaignUrlBuilder.ts
 *       Both implementations generate identical URLs for consistency.
 */
export function buildEbayCampaignUrl(itemId: string, campaignId?: string): string {
  // Extract numeric ID from v1|...|0 format if needed
  const numericId = extractItemId(itemId)

  if (!numericId) {
    console.error(`Invalid eBay item ID: ${itemId}`)
    // Fallback - use as-is (will likely fail but at least it's a link)
    return `https://www.ebay.com/itm/${itemId}`
  }

  const campaign = campaignId || process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID

  if (!campaign) {
    // Fallback to direct URL if no campaign ID configured
    console.warn('eBay campaign ID not configured, using direct link')
    return `https://www.ebay.com/itm/${numericId}`
  }

  // Use eBay Partner Network link with proper mkevt parameter
  // Format based on eBay's current affiliate link structure
  const itemUrl = `https://www.ebay.com/itm/${numericId}`

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
export function buildEbaySearchUrl(searchQuery: string, campaignId?: string): string {
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

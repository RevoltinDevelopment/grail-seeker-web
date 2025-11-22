import type { Alert } from '@/types/alert.types'
import { buildEbayCampaignUrl } from '@/lib/ebay/campaign-url'

interface AlertCardProps {
  alert: Alert
}

export function AlertCard({ alert }: AlertCardProps) {
  // Build eBay campaign tracking URL if we have an eBay item ID
  const listingUrl =
    alert.listing.platform === 'ebay' && alert.listing.ebayItemId
      ? buildEbayCampaignUrl(alert.listing.ebayItemId)
      : alert.listing.url

  return (
    <div
      className={`rounded-lg border border-l-4 border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${
        alert.isDirectMatch ? 'border-l-success-green' : 'border-l-warning-amber'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">{alert.isDirectMatch ? '🎯' : '💎'}</span>
            <h3 className="text-xl font-semibold">
              {alert.search.series.title} #{alert.search.issueNumber}
            </h3>
          </div>

          <p className="mb-4 text-sm text-slate-600">{alert.listing.title}</p>

          <div className="mb-4 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Price:</span>
              <span className="text-xl font-bold text-collector-navy">
                ${alert.listing.price.toLocaleString()}
              </span>
            </div>
            {alert.listing.grade && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Grade:</span>
                <span className="text-lg font-semibold">{alert.listing.grade}</span>
              </div>
            )}
            {alert.listing.gradingAuthority && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Graded by:</span>
                <span className="text-lg font-semibold uppercase">
                  {alert.listing.gradingAuthority}
                </span>
              </div>
            )}
            {alert.listing.pageQuality && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Pages:</span>
                <span className="text-lg font-semibold">{alert.listing.pageQuality}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {alert.isDirectMatch ? (
              <span className="inline-flex items-center rounded-full bg-success-green px-3 py-1 text-xs font-semibold text-white">
                ✓ Direct Match
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-warning-amber px-3 py-1 text-xs font-semibold text-white">
                ⚠️ Near Miss: Price
              </span>
            )}
            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {alert.listing.platform.toUpperCase()}
            </span>
            {alert.notificationSent && (
              <span className="whitespace-nowrap text-xs text-slate-500">📱 SMS sent</span>
            )}
            <span className="whitespace-nowrap text-xs text-slate-500">
              {new Date(alert.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {listingUrl && (
          <a
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-md bg-collector-blue px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:ml-4"
          >
            View on eBay →
          </a>
        )}
      </div>
    </div>
  )
}

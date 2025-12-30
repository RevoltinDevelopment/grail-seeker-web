'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buildEbayCampaignUrl } from '@/lib/ebay/campaign-url'
import { alertsAPI } from '@/lib/api/alerts'
import { useToast } from '@/contexts/ToastContext'
import type { Alert } from '@/types/alert.types'

interface AlertCardProps {
  alert: Alert
  isArchived?: boolean
}

export function AlertCard({ alert, isArchived = false }: AlertCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const archiveMutation = useMutation({
    mutationFn: () => alertsAPI.archive(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] })
      showToast('Alert Dismissed', 'Alert moved to archive', 'success', 3000)
      setShowMenu(false)
    },
    onError: (error: any) => {
      showToast('Error', error.message || 'Failed to archive alert', 'error', 5000)
    },
  })

  const handleDismiss = () => {
    if (confirm('Move this alert to archive?')) {
      archiveMutation.mutate()
    }
    setShowMenu(false)
  }

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
            {/* Dismiss Button (Active Alerts Only) */}
            {!isArchived && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Alert options"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 z-10 min-w-[160px] rounded-md border border-slate-200 bg-white shadow-lg">
                    <button
                      onClick={handleDismiss}
                      disabled={archiveMutation.isPending}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {archiveMutation.isPending ? 'Dismissing...' : '🗑️ Dismiss'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Archive Badge (Archived Alerts Only) */}
          {isArchived && (alert as any).archivedAt && (
            <div className="mb-3 text-sm text-slate-500">
              <span className="font-medium">Archived:</span>{' '}
              {new Date((alert as any).archivedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {(alert as any).archiveReason && (
                <span>
                  {' • '}
                  <span className="capitalize">
                    {((alert as any).archiveReason as string).replace(/_/g, ' ')}
                  </span>
                </span>
              )}
            </div>
          )}

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
            className={`whitespace-nowrap rounded-md px-6 py-3 text-center text-sm font-semibold transition-colors sm:ml-4 ${
              isArchived
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed opacity-75'
                : 'bg-collector-blue text-white hover:bg-blue-800'
            }`}
          >
            View on eBay{isArchived ? ' (Listing Ended)' : ' →'}
          </a>
        )}
      </div>
    </div>
  )
}

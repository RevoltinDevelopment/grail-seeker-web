'use client'

import { useState } from 'react'

import { PLATFORM_LABELS, ACTIVE_PLATFORMS } from '@/lib/constants/platforms'

interface PlatformSelectorProps {
  platforms: string[]
  onChange: (platforms: string[]) => void
  /** Form-level validation error from the parent (e.g. on submit) */
  error?: string
}

/**
 * Search Platforms section shared by Create New Search and Edit Search.
 *
 * Unchecking a platform requires inline confirmation (review C1 — reduced
 * coverage should be a deliberate choice), and the last active platform can
 * never be unchecked (min-one rule, mirrored by API validation and the
 * Migration 038 CHECK constraint).
 */
export function PlatformSelector({ platforms, onChange, error }: PlatformSelectorProps) {
  // Platform awaiting uncheck confirmation
  const [pendingOff, setPendingOff] = useState<string | null>(null)
  const [minOneError, setMinOneError] = useState(false)

  const handleToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      if (platforms.length === 1) {
        setMinOneError(true)
        return
      }
      setMinOneError(false)
      setPendingOff(platform)
    } else {
      setMinOneError(false)
      setPendingOff(null)
      onChange([...platforms, platform])
    }
  }

  const confirmTurnOff = () => {
    if (pendingOff) {
      onChange(platforms.filter((p) => p !== pendingOff))
      setPendingOff(null)
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold text-slate-950">Search Platforms</h3>
      <p className="mb-4 text-sm text-slate-600">
        No extra cost - all platforms included in your subscription
      </p>

      <div className="space-y-3">
        {ACTIVE_PLATFORMS.map((platform) => (
          <label key={platform} className="flex items-center">
            <input
              type="checkbox"
              checked={platforms.includes(platform)}
              onChange={() => handleToggle(platform)}
              className="h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-collector-blue"
            />
            <span className="ml-2 text-sm">{PLATFORM_LABELS[platform]} (Active)</span>
          </label>
        ))}

        <label className="flex items-center opacity-50">
          <input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300" />
          <span className="ml-2 text-sm">Next 2 Marketplaces (Coming Q4 2026)</span>
        </label>
      </div>

      {pendingOff && (
        <div className="mt-3 rounded-md border border-amber-400 bg-amber-50 p-3">
          <p className="mb-2 text-sm font-medium text-amber-800">
            Are you sure you want to turn off {PLATFORM_LABELS[pendingOff]} for this search? This
            may reduce your chances of finding your book.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmTurnOff}
              className="flex-1 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Turn Off
            </button>
            <button
              type="button"
              onClick={() => setPendingOff(null)}
              className="flex-1 rounded-md border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Keep On
            </button>
          </div>
        </div>
      )}

      {minOneError && (
        <p className="mt-2 text-xs text-error-red">
          You must leave at least one platform active to run a search.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-error-red">{error}</p>}

      <p className="mt-3 text-xs text-info-blue">
        ℹ️ More platforms = more opportunities. No extra cost!
      </p>
    </div>
  )
}

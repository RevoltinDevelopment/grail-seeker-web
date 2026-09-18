'use client'

import { useEffect, useRef, useState } from 'react'

import { usePlatforms } from '@/hooks/usePlatforms'

interface PlatformSelectorProps {
  platforms: string[]
  onChange: (platforms: string[]) => void
  /** Form-level validation error from the parent (e.g. on submit) */
  error?: string
}

type PendingConfirmation =
  | { kind: 'core'; slug: string; label: string }
  | { kind: 'group'; label: string; count: number }
  | { kind: 'indie'; slug: string; label: string }

/**
 * Search Platforms section shared by Create New Search and Edit Search.
 *
 * Story 1.49: platforms now come from the live `marketplace_platform_registry`
 * (via usePlatforms()) instead of the hardcoded ACTIVE_PLATFORMS/PLATFORM_LABELS
 * constants. Core platforms (registry group "Core") keep their exact existing
 * behavior -- confirmation on uncheck, min-one rule (now global across every
 * group, not just Core), no visual change. A second registry group (today:
 * "Independent Shops", zero live rows) renders as a collapsible
 * disclosure with a tri-state group checkbox; when no non-Core group exists
 * yet, a quiet "More marketplaces coming soon" placeholder shows instead --
 * see the story's Verified #15 for why a bare empty state would have been a
 * real regression against the previous hardcoded placeholder.
 *
 * Design source: docs/bmad-output/planning-artifacts/ux-design-independent-shops-platform-selector.md
 */
export function PlatformSelector({ platforms, onChange, error }: PlatformSelectorProps) {
  const { groups, displayNameFor, error: platformsError } = usePlatforms()

  const [expanded, setExpanded] = useState(false)
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const [suppressChecked, setSuppressChecked] = useState(false)
  const [suppressWarn, setSuppressWarn] = useState(false)
  const [minOneError, setMinOneError] = useState(false)

  const coreGroup = groups.find((g) => g.label === 'Core')
  const indieGroupRaw = groups.find((g) => g.label !== 'Core')
  const corePlatforms = coreGroup?.platforms ?? []
  // Code review fix: a registry group that exists but has zero platforms in
  // it (e.g. every independent shop temporarily deactivated) must fall back
  // to the coming-soon placeholder, same as no group at all -- matches
  // SearchesClient.tsx's identical guard on its own aggregate pill.
  const indieGroup = indieGroupRaw && indieGroupRaw.platforms.length > 0 ? indieGroupRaw : undefined
  const indiePlatforms = indieGroup?.platforms ?? []
  const indieSlugs = indiePlatforms.map((p) => p.slug)
  const activeIndieCount = indiePlatforms.filter((p) => platforms.includes(p.slug)).length

  // Code review fix: one shared predicate for the min-one-active rule
  // instead of three differently-worded expressions of the same invariant
  // -- true if removing every slug in `toRemove` would leave zero platforms
  // active across every group, not just the one being toggled.
  const wouldLeaveNoneActive = (toRemove: string[]): boolean =>
    platforms.filter((p) => !toRemove.includes(p)).length === 0

  const groupState: 'checked' | 'unchecked' | 'indeterminate' =
    indiePlatforms.length === 0 || activeIndieCount === 0
      ? 'unchecked'
      : activeIndieCount === indiePlatforms.length
        ? 'checked'
        : 'indeterminate'

  const groupCheckboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (groupCheckboxRef.current) {
      groupCheckboxRef.current.indeterminate = groupState === 'indeterminate'
    }
  }, [groupState])

  const showMinOneError = () => {
    setMinOneError(true)
  }

  const handleCoreToggle = (slug: string, label: string) => {
    if (platforms.includes(slug)) {
      if (wouldLeaveNoneActive([slug])) {
        showMinOneError()
        return
      }
      setMinOneError(false)
      setPending({ kind: 'core', slug, label })
    } else {
      setMinOneError(false)
      setPending(null)
      onChange([...platforms, slug])
    }
  }

  const handleIndieToggle = (slug: string, label: string) => {
    if (platforms.includes(slug)) {
      if (wouldLeaveNoneActive([slug])) {
        showMinOneError()
        return
      }
      setMinOneError(false)
      if (suppressWarn) {
        onChange(platforms.filter((p) => p !== slug))
      } else {
        setSuppressChecked(false)
        setPending({ kind: 'indie', slug, label })
      }
    } else {
      setMinOneError(false)
      setPending(null)
      const next = [...platforms, slug]
      onChange(next)
      // Reset condition: turning this store back on brought every
      // independent store back to active -- the suppression earns a clean slate.
      if (indieSlugs.every((s) => next.includes(s))) {
        setSuppressWarn(false)
      }
    }
  }

  const handleGroupToggle = () => {
    if (groupState === 'checked' || groupState === 'indeterminate') {
      // Global min-one rule: bulk-turning off the whole group must not be
      // able to zero out every active platform, the same guard each
      // individual checkbox already enforces.
      if (wouldLeaveNoneActive(indieSlugs)) {
        showMinOneError()
        return
      }
      setMinOneError(false)
      setPending({ kind: 'group', label: indieGroup?.label ?? 'Independent Shops', count: indiePlatforms.length })
    } else {
      setMinOneError(false)
      setPending(null)
      const next = [...platforms.filter((p) => !indieSlugs.includes(p)), ...indieSlugs]
      onChange(next)
      setSuppressWarn(false)
    }
  }

  const confirmTurnOff = () => {
    if (!pending) return
    if (pending.kind === 'core') {
      onChange(platforms.filter((p) => p !== pending.slug))
    } else if (pending.kind === 'group') {
      onChange(platforms.filter((p) => !indieSlugs.includes(p)))
    } else {
      onChange(platforms.filter((p) => p !== pending.slug))
      if (suppressChecked) {
        setSuppressWarn(true)
      }
    }
    setPending(null)
  }

  const cancelConfirmation = () => {
    setPending(null)
  }

  const confirmationText = (): string => {
    if (!pending) return ''
    if (pending.kind === 'group') {
      return `Turn off all ${pending.count} ${pending.label} for this search? This may reduce your chances of finding your book.`
    }
    return `Are you sure you want to turn off ${pending.label} for this search? This may reduce your chances of finding your book.`
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold text-slate-950">Search Platforms</h3>
      <p className="mb-4 text-sm text-slate-600">
        No extra cost - all platforms included in your subscription
      </p>

      {platformsError && (
        <p className="mb-3 text-sm text-error-red">
          Couldn&apos;t load platforms right now. Please refresh the page and try again.
        </p>
      )}

      <div className="space-y-3">
        {corePlatforms.map((p) => (
          <label key={p.slug} className="flex items-center">
            <input
              type="checkbox"
              checked={platforms.includes(p.slug)}
              onChange={() => handleCoreToggle(p.slug, displayNameFor(p.slug))}
              className="h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-collector-blue"
            />
            <span className="ml-2 text-sm">{p.displayName} (Active)</span>
          </label>
        ))}

        {indieGroup ? (
          <div>
            <div className="-mx-2 flex min-h-[44px] items-center gap-2 rounded-md px-2 hover:bg-slate-50">
              <input
                ref={groupCheckboxRef}
                type="checkbox"
                checked={groupState === 'checked'}
                onChange={handleGroupToggle}
                aria-label={`Toggle all ${indieGroup.label}`}
                aria-checked={groupState === 'indeterminate' ? 'mixed' : groupState === 'checked'}
                className="h-[17px] w-[17px] flex-shrink-0 rounded border-slate-300 text-collector-blue focus:ring-collector-blue"
              />
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="flex min-h-[44px] flex-1 items-center justify-between rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-collector-blue"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-700">{indieGroup.label}</span>
                  <span className="text-sm text-slate-600">({indiePlatforms.length})</span>
                </span>
                <svg
                  className={`h-4 w-4 flex-shrink-0 text-slate-600 transition-transform duration-150 ${
                    expanded ? '' : '-rotate-90'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {expanded && (
              <div className="ml-6 mt-2 space-y-2.5 border-l-2 border-slate-200 pl-4">
                {indiePlatforms.map((p) => (
                  <label key={p.slug} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={platforms.includes(p.slug)}
                      onChange={() => handleIndieToggle(p.slug, displayNameFor(p.slug))}
                      className="h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-collector-blue"
                    />
                    <span className="ml-2 text-sm">{p.displayName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <label className="flex items-center opacity-50">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300" />
            <span className="ml-2 text-sm">More marketplaces coming soon</span>
          </label>
        )}
      </div>

      {pending && (
        <div className="mt-3 rounded-md border border-amber-400 bg-amber-50 p-3">
          <p className="mb-2 text-sm font-medium text-amber-800">{confirmationText()}</p>
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
              onClick={cancelConfirmation}
              className="flex-1 rounded-md border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Keep On
            </button>
          </div>
          {pending.kind === 'indie' && (
            <div className="mt-3 flex items-start gap-2 border-t border-amber-200 pt-3">
              <input
                id="suppress-indie-warn"
                type="checkbox"
                checked={suppressChecked}
                onChange={(e) => setSuppressChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-collector-blue"
              />
              <label htmlFor="suppress-indie-warn" className="text-xs text-amber-800">
                Do not warn for independent stores
              </label>
            </div>
          )}
        </div>
      )}

      {minOneError && (
        <p className="mt-2 text-xs text-error-red">
          You must leave at least one platform active to run a search.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-error-red">{error}</p>}
    </div>
  )
}

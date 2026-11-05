'use client'

import { useEffect, useRef, useState } from 'react'

import { usePlatforms } from '@/hooks/usePlatforms'
import { marketplaceLabel, NAME_SHOPS_BELOW } from '@/lib/marketplaceNames'

import { BUTTON_OUTLINE, BUTTON_PRIMARY, CHECKBOX, DisclosureTriangle } from './formStyles'

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
  // Story 1.84: the subscriber's name for a marketplace ("Heritage Auctions"), as on the search card
  const nameFor = (slug: string) => marketplaceLabel(slug, displayNameFor(slug))

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
  const groupShops = indiePlatforms.length >= NAME_SHOPS_BELOW
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
      <h2 className="text-[17px] font-bold text-ink">Search Platforms</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        No extra cost - all platforms included in your subscription
      </p>

      {platformsError && (
        <p className="mt-3 text-sm text-danger">
          Couldn&apos;t load platforms right now. Please refresh the page and try again.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-1">
        {corePlatforms.map((p) => (
          <label key={p.slug} className="flex min-h-touch items-center gap-2.5 text-[15px] text-ink">
            <input
              type="checkbox"
              checked={platforms.includes(p.slug)}
              onChange={() => handleCoreToggle(p.slug, nameFor(p.slug))}
              className={CHECKBOX}
            />
            {nameFor(p.slug)}
          </label>
        ))}

        {/* Mahan, 2026-11-05: below five shops each is listed on its own, as the search card names them;
            from five, the Independent Shops group gathers them */}
        {indieGroup &&
          !groupShops &&
          indiePlatforms.map((p) => (
            <label key={p.slug} className="flex min-h-touch items-center gap-2.5 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={platforms.includes(p.slug)}
                onChange={() => handleIndieToggle(p.slug, nameFor(p.slug))}
                className={CHECKBOX}
              />
              {p.displayName}
            </label>
          ))}

        {indieGroup && groupShops && (
          <div>
            <div className="flex min-h-touch items-center gap-2.5">
              <input
                ref={groupCheckboxRef}
                type="checkbox"
                checked={groupState === 'checked'}
                onChange={handleGroupToggle}
                aria-label={`Toggle all ${indieGroup.label}`}
                aria-checked={groupState === 'indeterminate' ? 'mixed' : groupState === 'checked'}
                className={CHECKBOX}
              />
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls="independent-shops"
                className="flex min-h-touch flex-1 items-center justify-between gap-2 rounded pr-2 text-left text-[15px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>
                  {indieGroup.label} <span className="text-muted-foreground">({indiePlatforms.length})</span>
                </span>
                <DisclosureTriangle open={expanded} />
              </button>
            </div>

            {expanded && (
              <div id="independent-shops" className="mb-1 ml-[9px] flex flex-col border-l-2 border-line pl-5">
                {indiePlatforms.map((p) => (
                  <label key={p.slug} className="flex min-h-touch items-center gap-2.5 text-[15px] text-ink">
                    <input
                      type="checkbox"
                      checked={platforms.includes(p.slug)}
                      onChange={() => handleIndieToggle(p.slug, nameFor(p.slug))}
                      className={CHECKBOX}
                    />
                    {p.displayName}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Story 1.84: always last, as drawn (search-form.js), whether or not a shop is live */}
        <label className="flex min-h-touch items-center gap-2.5 text-[15px] text-muted-foreground">
          {/* Greyed, so it reads as a box nobody can tick (Mahan, 2026-11-05) */}
          <input
            type="checkbox"
            disabled
            className="h-5 w-5 flex-none cursor-not-allowed appearance-none rounded-[4px] border-[1.5px] border-line-strong bg-chip"
          />
          More marketplaces coming soon
        </label>
      </div>

      {pending && (
        <div className="mt-3 rounded-[10px] border border-attention-line bg-attention p-3">
          <p className="mb-2 text-sm font-medium text-attention-ink">{confirmationText()}</p>
          <div className="flex gap-2">
            <button type="button" onClick={confirmTurnOff} className={`${BUTTON_PRIMARY} flex-1 text-sm`}>
              Turn Off
            </button>
            <button type="button" onClick={cancelConfirmation} className={`${BUTTON_OUTLINE} flex-1 text-sm`}>
              Keep On
            </button>
          </div>
          {pending.kind === 'indie' && (
            <div className="mt-3 flex items-start gap-2 border-t border-attention-line pt-3">
              <input
                id="suppress-indie-warn"
                type="checkbox"
                checked={suppressChecked}
                onChange={(e) => setSuppressChecked(e.target.checked)}
                className={`${CHECKBOX} mt-0.5`}
              />
              <label htmlFor="suppress-indie-warn" className="text-[13px] text-attention-ink">
                Do not warn for independent stores
              </label>
            </div>
          )}
        </div>
      )}

      {minOneError && (
        <p className="mt-2 text-[13px] text-danger">
          You must leave at least one platform active to run a search.
        </p>
      )}

      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </div>
  )
}

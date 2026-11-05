'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

import { AttentionBanner } from '@/components/searches/AttentionBanner'
import { LatestMatches } from '@/components/searches/LatestMatches'
import { SearchCard } from '@/components/searches/SearchCard'
import { SlotStrip } from '@/components/searches/SlotStrip'
import { useToast } from '@/contexts/ToastContext'
import { useAccountSummary } from '@/hooks/useAccountSummary'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useSearches } from '@/hooks/useSearches'
import { APIError } from '@/lib/api/client'
import { chooseBanner } from '@/lib/attention'
import { searchesSummary } from '@/lib/utils/searches-summary'

// The marketplace nudge's dismissal lasts the browser session, as it did on the Dashboard.
const NUDGE_DISMISS_KEY = 'platform-nudge-dismissed'

/** Pause met a hold (Story 1.83, AC 4; searches-pause-held.html). */
export function refusedPauseWords(
  heldReason: unknown,
  action: 'Pause' | 'Resume' = 'Pause'
): string {
  const lead = `Not ${action === 'Pause' ? 'paused' : 'resumed'}. This search went on hold before you pressed ${action}`
  // Only a lapse holds every search; any other or unknown reason says only this one (review).
  return heldReason === 'lapse' ? `${lead}, with every other search.` : `${lead}.`
}

/**
 * Searches, the app's home (Story 1.82), with Story 1.83's parts (searches-home.html): one
 * attention banner, the title with New search, the slot strip, then Latest matches beside the
 * cards from 1,000 pixels and above them below that.
 */
export default function SearchesClient() {
  const { searches, isLoading, error, deleteSearch, updateSearchStatus } = useSearches()
  const { account, isLoading: accountLoading, error: accountError } = useAccountSummary()
  const { groups, defaultEnabledSlugs } = usePlatforms()
  const indieGroup = groups.find((g) => g.label !== 'Core')
  const independentShops = indieGroup
    ? {
        label: 'Independent shops',
        shops: indieGroup.platforms.map((p) => ({ slug: p.slug, name: p.displayName })),
      }
    : null
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [refused, setRefused] = useState<Record<string, string>>({})
  const [nudgeDismissed, setNudgeDismissed] = useState(true) // hidden until read, so it never flashes
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    setNudgeDismissed(sessionStorage.getItem(NUDGE_DISMISS_KEY) === 'true')
  }, [])

  // The new-match toast (Story 1.82): Latest matches' realtime subscription raises 'new-alert'.
  useEffect(() => {
    const onNewAlert = () =>
      showToast(
        'New match found',
        'A new match has been found for one of your searches. Check your alerts to see details.',
        'success',
        8000
      )
    window.addEventListener('new-alert', onNewAlert)
    return () => window.removeEventListener('new-alert', onNewAlert)
  }, [showToast])

  const handleDelete = async (id: string) => {
    await deleteSearch.mutateAsync(id)
    setDeleteConfirmId(null)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    setRefused((r) => Object.fromEntries(Object.entries(r).filter(([key]) => key !== id)))
    try {
      await updateSearchStatus.mutateAsync({ id, isActive: !isActive })
    } catch (e) {
      if (e instanceof APIError && e.code === 'SEARCH_HELD') {
        setRefused((r) => ({
          ...r,
          [id]: refusedPauseWords(e.body?.heldReason, isActive ? 'Pause' : 'Resume'),
        }))
        // The list was out of date: read it again, so the card shows the hold (review).
        queryClient.invalidateQueries({ queryKey: ['searches'] })
        queryClient.invalidateQueries({ queryKey: ['account-summary'] })
        return
      }
      // A refusal the server explains (a 4xx) is shown in its words; anything else asks to retry.
      const explained =
        e instanceof APIError && e.status >= 400 && e.status < 500 && e.status !== 401
      showToast(
        'Not saved',
        explained ? e.message : 'That change could not be saved. Try again.',
        'error',
        6000
      )
    }
  }

  // A refused line goes once its search is no longer held (a pick, a payment released it).
  useEffect(() => {
    setRefused((r) => {
      const keep = Object.entries(r).filter(([id]) => searches.some((s) => s.id === id && s.held))
      return keep.length === Object.keys(r).length ? r : Object.fromEntries(keep)
    })
  }, [searches])

  const dismissNudge = () => {
    sessionStorage.setItem(NUDGE_DISMISS_KEY, 'true')
    setNudgeDismissed(true)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 tablet:px-8">
        <div className="py-12 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading searches...</p>
        </div>
      </div>
    )
  }

  // The banner waits for the account, so a lower state never flashes before the right one (review).
  const banner =
    error || accountLoading
      ? null
      : chooseBanner({ account, searches, defaultEnabledSlugs, nudgeDismissed })
  // New search can't be used while the server enforces the limit and the account is over it, or
  // while every search is on hold (as drawn); at 'observe' the server would accept the save.
  const enforced = account?.enforcement === 'enforce'
  const over = enforced && (account?.slots.over ?? 0) > 0
  // A lapsed account cannot add searches (searches-pause-held.html), whatever the switch says.
  const lapsed = account?.status === 'lapsed'
  const allHeld = searches.length > 0 && searches.every((s) => s.held)
  const newSearchBlocked = over || lapsed || (enforced && allHeld)

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      {banner && (
        <AttentionBanner
          banner={banner}
          onDismiss={banner.dismissible ? dismissNudge : undefined}
        />
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
            Searches
          </h1>
          {searches.length > 0 && (
            <p className="mt-1 text-[15px] text-muted-foreground">{searchesSummary(searches)}</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5 tablet:items-end tablet:text-right">
          {newSearchBlocked ? (
            <button
              type="button"
              disabled
              aria-describedby={over ? 'new-search-why' : undefined}
              className="inline-flex min-h-touch cursor-not-allowed items-center gap-2 rounded-button border-[1.5px] border-dashed border-line-strong bg-background px-[18px] text-[15px] font-semibold text-muted-foreground"
            >
              <PlusIcon />
              New search
            </button>
          ) : (
            <Link
              href="/searches/new"
              className="inline-flex min-h-touch items-center gap-2 rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline"
            >
              <PlusIcon />
              New search
            </Link>
          )}
          {over && account && (
            <p id="new-search-why" className="max-w-[300px] text-sm text-muted-foreground">
              You can add a search once your searches fit your {account.slots.entitled} slots.
            </p>
          )}
        </div>
      </div>

      {account && <SlotStrip account={account} />}
      {accountError && !account && (
        <p
          className="rounded-card border border-line bg-surface px-5 py-4 text-[15px] text-ink"
          role="alert"
        >
          Your plan and slots could not be loaded. Refresh the page to try again.
        </p>
      )}

      <div className="grid gap-5 desktop:grid-cols-[minmax(0,1fr)_300px] desktop:items-start">
        <LatestMatches className="desktop:col-start-2 desktop:row-start-1" />

        <section
          id="your-searches"
          className="desktop:col-start-1 desktop:row-start-1"
          aria-labelledby="your-searches-h"
        >
          <h2 id="your-searches-h" className="sr-only">
            Your searches
          </h2>

          {/* A failed load says so; it must never look like an account with no searches */}
          {error && (
            <p
              className="rounded-card border border-line bg-surface px-5 py-4 text-[15px] text-ink"
              role="alert"
            >
              Your searches could not be loaded. Refresh the page to try again.
            </p>
          )}

          {/* Empty state, in Mahan's words (2026-11-04) */}
          {!error && searches.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-10 text-center">
              <h3 className="text-[19px] font-bold text-ink">Start your first search</h3>
              <p className="max-w-[460px] text-[15px] text-muted-foreground">
                Create your first grail search to start monitoring.
              </p>
              <Link
                href="/searches/new"
                className="inline-flex min-h-touch items-center rounded-button bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline"
              >
                Create Search →
              </Link>
            </div>
          )}

          {searches.length > 0 && (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {searches.map((search) => (
                <SearchCard
                  key={search.id}
                  search={search}
                  independentShops={independentShops}
                  toggling={
                    updateSearchStatus.isPending && updateSearchStatus.variables?.id === search.id
                  }
                  refused={refused[search.id] ?? null}
                  confirmingDelete={deleteConfirmId === search.id}
                  deleting={deleteSearch.isPending}
                  onToggle={() => handleToggle(search.id, search.isActive)}
                  onAskDelete={() => setDeleteConfirmId(search.id)}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                  onDelete={() => handleDelete(search.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { independentShopsOf, SearchCard } from '@/components/searches/SearchCard'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useSearches } from '@/hooks/useSearches'
import { PAGE_HREF } from '@/lib/built-pages'
import type { FormNoticeModel } from '@/lib/formSlots'
import { formatIssueNumber, formatSeriesShort } from '@/lib/utils/series-formatter'
import type { GrailSearch } from '@/types/search.types'

import { SearchFormPage } from './SearchFormLayout'
import { FormNotice } from './SlotParts'

/**
 * Story 1.85 (S-10): a held search's page (search-form-held.html, mockup 8). Nothing in the app
 * links to the edit form of a held search but the card's View, so this is what the edit route
 * shows for one: the search, read-only, as its held card with Delete, under the notice. It also
 * follows an Update Search that met SEARCH_HELD, when the search went on hold while the form was
 * open ("Your changes were not saved").
 *
 * A lapse's cause comes with billing (S-21): until then its words say only what is known, as the
 * search card does (Story 1.83, decision 4). The failed-payment words wait for S-21.
 */
export function heldNotice(
  reason: 'lapse' | 'downgrade' | null,
  notSaved: boolean
): FormNoticeModel {
  const viewPlan = { label: 'View plan', href: PAGE_HREF.plan, filled: false }
  // AC 7: after SEARCH_HELD only the heading changes; the page that follows is the same
  const heading = notSaved ? 'Your changes were not saved' : 'This search is on hold'
  const role = notSaved ? 'alert' : 'region'
  const paragraphs =
    reason === 'downgrade'
      ? [
          'It does not fit your current plan, so it cannot be changed while it is on hold. It comes back if you move to a plan with more slots.',
          'Nothing has been deleted, and its alerts are kept.',
        ]
      : reason === 'lapse'
        ? [
            'Every search is on hold while your subscription is not active. It starts again, just as you left it, when it is active again. Until then it can be viewed or deleted, but not changed.',
          ]
        : // Code review: a hold whose reason the server did not give says only what is known
          ['It cannot be changed while it is on hold. It can be viewed or deleted.']
  return { tone: 'hold', role, heading, paragraphs, actions: [viewPlan] }
}

export function HeldSearchView({
  search,
  reason,
  notSaved,
}: {
  search: GrailSearch
  reason: 'lapse' | 'downgrade' | null
  /** Update Search met SEARCH_HELD */
  notSaved: boolean
}) {
  const router = useRouter()
  const { deleteSearch } = useSearches()
  const { groups } = usePlatforms()
  const [confirming, setConfirming] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const title = `${search.series.title} ${formatIssueNumber(search.issueNumber, search.issueVolumeText)}`

  const handleDelete = async () => {
    setDeleteFailed(false)
    try {
      await deleteSearch.mutateAsync(search.id)
      router.push('/searches')
    } catch {
      setDeleteFailed(true)
    }
  }

  return (
    <SearchFormPage title={title} lede={formatSeriesShort(search.series)}>
      <FormNotice notice={heldNotice(reason, notSaved)} />
      {deleteFailed && (
        <p role="alert" className="text-[15px] font-semibold text-danger">
          The search could not be deleted. Try again.
        </p>
      )}
      <SearchCard
        search={{ ...search, held: true, heldReason: reason ?? search.heldReason }}
        independentShops={independentShopsOf(groups)}
        toggling={false}
        refused={null}
        confirmingDelete={confirming}
        deleting={deleteSearch.isPending}
        onToggle={() => {}}
        onAskDelete={() => setConfirming(true)}
        onCancelDelete={() => setConfirming(false)}
        onDelete={() => void handleDelete()}
        hideView
      />
    </SearchFormPage>
  )
}

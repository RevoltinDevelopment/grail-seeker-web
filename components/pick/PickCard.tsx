'use client'

import { useState } from 'react'

import type { GradeOption } from '@/lib/api/grades'
import type { FateKind } from '@/lib/pickScreen'
import { slotsForRange } from '@/lib/slots'

/**
 * Story 1.86 (S-12): one search on the pick screen (pick-screen.js card(); grail-seeker.css .card,
 * .card.is-kept, .card-top, .card-meta, .state-line, .too-big, .fate, .narrow-box, .pick-act).
 * Keep, Narrow grades (searches of more than one grade, not held) and Delete.
 */

export interface PickCardModel {
  id: string
  title: string
  series: string
  slots: number
  /** "Grade 9.0 to 9.4 · CGC · up to $4,500" */
  meta: string
  paused: string | null
  held: string | null
  tooBig: boolean
  /** It can be narrowed on this screen (running, more than one grade) */
  canBeNarrowed: boolean
  fate: { kind: FateKind; text: string }
  /** "Grades narrowed to 9.2 to 9.4. Saved." after a narrowing */
  savedLine: string | null
  /** The search's grades, for Narrow grades; null when it cannot be narrowed */
  range: { min: number; max: number } | null
  isHeld: boolean
}

const BTN =
  'inline-flex min-h-touch items-center justify-center gap-2 whitespace-nowrap rounded-button border-[1.5px] px-[18px] text-[15px] font-semibold'
const OUTLINE = `${BTN} border-line-strong bg-surface text-ink hover:bg-chip`
const PRIMARY = `${BTN} border-transparent bg-primary text-primary-foreground`
const QUIET = `${BTN} border-transparent bg-transparent text-danger disabled:opacity-60`
const OFF = `${BTN} cursor-not-allowed border-dashed border-line-strong bg-background text-muted-foreground`

const Icon = ({
  d,
  fill = false,
  size = 16,
}: {
  d: React.ReactNode
  fill?: boolean
  size?: number
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
)
const CHECK = <path d="M5 12.5l4.5 4.5L19 7.5" />
const FATE_ICON: Record<FateKind, React.ReactNode> = {
  continues: <Icon d={CHECK} />,
  stops: <Icon fill d={<rect x="6" y="6" width="12" height="12" rx="2" />} />,
  returns: (
    <Icon
      d={
        <>
          <path d="M4 12a8 8 0 1 0 2.5-5.8" />
          <path d="M4 4v4.5h4.5" />
        </>
      }
    />
  ),
  held: (
    <Icon
      d={
        <>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      }
    />
  ),
  undecided: (
    <Icon
      d={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      }
    />
  ),
  unknown: <Icon d={<path d="M7 12h10" />} />,
}
const FATE_COLOUR: Record<FateKind, string> = {
  continues: 'text-primary',
  stops: 'text-over',
  returns: 'text-link',
  held: 'text-hold-line',
  undecided: '',
  unknown: '',
}

const one = (g: number) => Number(g).toFixed(1)
const words = (a: number, b: number) => (one(a) === one(b) ? one(a) : `${one(a)} to ${one(b)}`)

export function PickCard({
  card,
  kept,
  confirmed,
  cap,
  keptSlots,
  grades,
  confirmingDelete,
  deleting,
  onKeep,
  locked = false,
  onSaveGrades,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  card: PickCardModel
  kept: boolean
  confirmed: boolean
  cap: number
  keptSlots: number
  grades: readonly GradeOption[] | null
  confirmingDelete: boolean
  deleting: boolean
  onKeep: () => void
  /** Confirm is on its way: the choice cannot change under it (code review) */
  locked?: boolean
  /** Saves the search at once; resolves when saved, rejects when not */
  onSaveGrades: (min: number, max: number, text: string) => Promise<void>
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<[number, number] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const n = card.slots
  const showKept = kept && !confirmed
  const canNarrow = !confirmed && !card.isHeld && n > 1 && !!card.range && !!grades
  const open = canNarrow && draft !== null

  // Only grades already in the search: the picker can only narrow (Mahan, 2026-10-20)
  const inSearch = (grades ?? []).filter(
    (g) =>
      card.range &&
      Math.round(g.value * 10) >= Math.round(card.range.min * 10) &&
      Math.round(g.value * 10) <= Math.round(card.range.max * 10)
  )

  return (
    <article
      aria-label={card.title}
      className={`flex flex-col gap-3.5 overflow-hidden rounded-card ${
        showKept
          ? 'border-2 border-kept-line bg-kept p-[19px]'
          : 'border border-line bg-surface p-5 shadow-sm'
      }`}
      data-kept={showKept ? 'true' : 'false'}
    >
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-card-title font-bold leading-[1.3] text-ink">{card.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{card.series}</p>
        </div>
        <p className="whitespace-nowrap text-right text-[13px] leading-[1.2] text-muted-foreground">
          <b className="block text-[22px] leading-[1.1] text-ink">{n}</b>
          {n === 1 ? 'slot' : 'slots'}
        </p>
      </div>
      <p className="text-sm text-ink">{card.meta}</p>
      {card.paused && (
        <p className="flex items-start gap-2 text-sm font-semibold text-ink">
          <span className="mt-[3px] flex-none">
            <Icon
              fill
              size={14}
              d={
                <>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </>
              }
            />
          </span>
          <span>{card.paused}</span>
        </p>
      )}
      {card.held && (
        <p className="flex items-start gap-2 self-start rounded-md border border-dashed border-hold-line bg-hold px-2.5 py-1 text-sm font-semibold text-hold-ink">
          <span className="mt-[3px] flex-none">{FATE_ICON.held}</span>
          <span>{card.held}</span>
        </p>
      )}
      {card.tooBig && !confirmed && (
        <p className="text-sm text-ink">
          {/* Code review: "narrow its grades" only where it can be narrowed */}
          {card.canBeNarrowed
            ? 'This search alone uses more slots than your plan has. To keep it, narrow its grades.'
            : 'This search alone uses more slots than your plan has.'}
        </p>
      )}
      <p
        className={`flex items-start gap-2 text-[15px] ${card.fate.kind === 'undecided' ? 'font-medium text-muted-foreground' : 'font-semibold text-ink'}`}
        data-fate={card.fate.kind}
      >
        <span className={`mt-[3px] flex-none ${FATE_COLOUR[card.fate.kind]}`}>
          {FATE_ICON[card.fate.kind]}
        </span>
        <span>{card.fate.text}</span>
      </p>
      {card.savedLine && !open && (
        <p role="status" className="flex items-start gap-1.5 text-sm font-semibold text-ink">
          <span className="mt-0.5 flex-none text-primary">{FATE_ICON.continues}</span>
          <span>{card.savedLine}</span>
        </p>
      )}

      {open && draft && (
        <NarrowBox
          title={card.title}
          slots={n}
          kept={kept}
          cap={cap}
          keptSlots={keptSlots}
          grades={grades!}
          inSearch={inSearch}
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          saveFailed={saveFailed}
          onCancel={() => {
            setDraft(null)
            setSaveFailed(false)
          }}
          onSave={async () => {
            setSaving(true)
            setSaveFailed(false)
            try {
              await onSaveGrades(draft[0], draft[1], words(draft[0], draft[1]))
              setDraft(null)
            } catch {
              setSaveFailed(true)
            } finally {
              setSaving(false)
            }
          }}
        />
      )}

      {confirmingDelete ? (
        <div
          className="mt-auto flex flex-col gap-2"
          role="group"
          aria-label={`Delete ${card.title}?`}
        >
          <p className="text-sm font-semibold text-ink">Delete this search?</p>
          <div className="flex gap-2">
            <button type="button" className={QUIET} onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button type="button" className={OUTLINE} onClick={onCancelDelete}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap gap-2">
          {!confirmed && (
            <button
              type="button"
              aria-pressed={showKept}
              // Code review: the spoken name starts with the visible words (WCAG 2.5.3)
              aria-label={`${showKept ? 'Keeping' : card.isHeld ? 'Bring it back' : 'Keep this search'}, ${card.title}`}
              onClick={onKeep}
              disabled={locked}
              className={`flex-auto ${showKept ? `${BTN} border-primary bg-primary text-primary-foreground` : OUTLINE}`}
            >
              {showKept ? (
                <>
                  <Icon d={CHECK} />
                  Keeping
                </>
              ) : card.isHeld ? (
                'Bring it back'
              ) : (
                'Keep this search'
              )}
            </button>
          )}
          {canNarrow && !open && (
            <button
              type="button"
              aria-label={`Narrow the grades of ${card.title}`}
              className={OUTLINE}
              onClick={() => card.range && setDraft([card.range.min, card.range.max])}
            >
              Narrow grades
            </button>
          )}
          <button
            type="button"
            className={QUIET}
            aria-label={`Delete ${card.title}`}
            onClick={onAskDelete}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

function NarrowBox({
  title,
  slots,
  kept,
  cap,
  keptSlots,
  grades,
  inSearch,
  draft,
  setDraft,
  saving,
  saveFailed,
  onCancel,
  onSave,
}: {
  title: string
  slots: number
  kept: boolean
  cap: number
  keptSlots: number
  grades: readonly GradeOption[]
  inSearch: readonly GradeOption[]
  draft: [number, number]
  setDraft: (d: [number, number]) => void
  saving: boolean
  saveFailed: boolean
  onCancel: () => void
  onSave: () => void
}) {
  const dn = slotsForRange(grades, draft[0], draft[1])
  const same = dn === slots
  const cost = same
    ? 'Choose a narrower range to use fewer slots.'
    : `Uses ${dn} ${dn === 1 ? 'slot' : 'slots'} instead of ${slots}.${kept ? ` Your choice would then use ${keptSlots - slots + dn} of ${cap} slots.` : ''}`
  const SELECT =
    'min-h-touch min-w-[120px] rounded-button border-[1.5px] border-line-strong bg-surface px-3 text-base font-medium text-ink'
  const toOptions = inSearch.filter((g) => Math.round(g.value * 10) >= Math.round(draft[0] * 10))
  return (
    <div
      role="group"
      aria-label={`Narrow the grades of ${title}`}
      className="flex flex-col gap-2.5 rounded-[10px] border-[1.5px] border-line-strong bg-surface px-3.5 py-3"
    >
      <p className="text-[15px] font-bold text-ink">Narrow the grades</p>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-muted-foreground">
          <span>From</span>
          <select
            className={SELECT}
            value={one(draft[0])}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              setDraft([v, Math.max(v, draft[1])])
            }}
          >
            {inSearch.map((g) => (
              <option key={g.value} value={one(g.value)}>
                {one(g.value)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-muted-foreground">
          <span>To</span>
          <select
            className={SELECT}
            value={one(draft[1])}
            onChange={(e) => setDraft([draft[0], parseFloat(e.target.value)])}
          >
            {toOptions.map((g) => (
              <option key={g.value} value={one(g.value)}>
                {one(g.value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-[15px] font-bold text-ink" aria-live="polite">
        {cost}
      </p>
      <p className="text-sm text-muted-foreground">
        Saving changes this search now: from the next check it looks only for these grades. Its
        alerts are kept.
      </p>
      {saveFailed && (
        <p role="alert" className="text-sm font-semibold text-danger">
          The grades could not be saved. Try again.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-disabled={same || saving || undefined}
          onClick={() => {
            if (!same && !saving) onSave()
          }}
          className={same ? OFF : PRIMARY}
        >
          {saving ? 'Saving...' : 'Save grades'}
        </button>
        <button type="button" className={OUTLINE} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

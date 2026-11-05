/**
 * Story 1.84 (S-04): the search form's look, from the approved design (docs/ux/mockups/grail-seeker.css,
 * the .of-* rules), on the tokens. Shared by both form pages and the components in this folder.
 */

/** .of-lbl */
export const FIELD_LABEL = 'mb-2 block text-[15px] font-semibold text-ink'
/** .of-in: every field and dropdown is one height (Mahan, 2026-10-21) */
export const FIELD =
  'block h-12 w-full rounded-button border-[1.5px] border-line-strong bg-surface px-3.5 text-body font-medium text-ink placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'
/** select.of-in: the browser's own arrow is replaced by the design's chevron */
export const SELECT = `${FIELD} cursor-pointer appearance-none pr-[42px]`
/** .of-hint */
export const FIELD_HINT = 'mt-1.5 text-[13px] text-muted-foreground'
/** An error under a field */
export const FIELD_ERROR = 'mt-1.5 text-[13px] text-danger'
/** .btn base */
const BUTTON =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-button border-[1.5px] px-[18px] text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
/** .btn-primary */
export const BUTTON_PRIMARY = `${BUTTON} border-transparent bg-primary text-primary-foreground hover:bg-primary/90`
/** .btn-outline */
export const BUTTON_OUTLINE = `${BUTTON} border-line-strong bg-surface text-ink hover:bg-chip`
/** A checkbox (.of-plat input) */
export const CHECKBOX = 'h-5 w-5 flex-none accent-primary'

/** The design's chevron (search-form.js I.chev) */
export function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** The design's back arrow (I.back) */
export function BackArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

/** The design's small check (I.checkSm) */
export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

/** The design's warning triangle (I.warn) */
export function WarnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.5" />
    </svg>
  )
}

/** The design's small information mark (I.infoSm) */
export function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </svg>
  )
}

/** The design's disclosure triangle (I.tri): right when closed, down when open */
export function DisclosureTriangle({ open }: { open: boolean }) {
  return (
    <span className={`inline-grid text-muted-foreground transition-transform duration-150 ${open ? 'rotate-90' : ''}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5l10 7-10 7z" />
      </svg>
    </span>
  )
}

/** .sel-wrap: a dropdown with the design's chevron */
export function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative block">
      {children}
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        <ChevronIcon />
      </span>
    </span>
  )
}

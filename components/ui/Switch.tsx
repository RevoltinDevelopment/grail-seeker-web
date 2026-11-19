'use client'

/**
 * Story 1.104: an on/off switch, as drawn (`.switch` in grail-seeker.css): a button with
 * role="switch", named by its row's title, a 52 × 44 touch area, on the tokens.
 */
export function Switch({
  checked,
  onChange,
  labelledBy,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  /** The id of the row's title, which names the switch. */
  labelledBy: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group relative h-11 w-[52px] flex-none cursor-pointer rounded-[15px] border-0 bg-transparent p-0 focus-visible:outline-none disabled:cursor-wait"
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-[7px] box-border h-[30px] w-[52px] rounded-[15px] border-2 transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 ${
          checked ? 'border-primary bg-primary' : 'border-muted-foreground bg-surface'
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute left-[5px] top-3 h-5 w-5 rounded-[10px] transition-transform motion-reduce:transition-none ${
          checked ? 'translate-x-[22px] bg-primary-foreground' : 'bg-muted-foreground'
        }`}
      />
    </button>
  )
}

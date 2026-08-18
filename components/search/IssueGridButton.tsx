import { cn } from '@/lib/utils'
import type { Issue } from '@/types/issue.types'

interface IssueGridButtonProps {
  issue: Issue
  selected: boolean
  onSelect: (issue: Issue) => void
}

// Fixed-width, five-across grid cell for series without meaningful title
// data (ux-design-specification.md, Issue Grid & Bucket Sizing). aria-label
// carries number + title even though only the number renders visually --
// the group can still carry a title on a per-row basis in a grid-mode
// series (rare, but real per Story 1.15's own findings), so don't drop it.
export function IssueGridButton({ issue, selected, onSelect }: IssueGridButtonProps) {
  const label = issue.title ? `Issue ${issue.number}, ${issue.title}` : `Issue ${issue.number}`

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onSelect(issue)}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium transition-colors',
        selected
          ? 'border-collector-blue bg-collector-blue text-white'
          : 'border-slate-300 bg-white text-slate-950 hover:border-collector-blue hover:text-collector-blue'
      )}
    >
      {issue.number}
    </button>
  )
}

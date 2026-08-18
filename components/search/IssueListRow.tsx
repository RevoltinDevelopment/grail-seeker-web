import { cn } from '@/lib/utils'
import type { Issue } from '@/types/issue.types'

interface IssueListRowProps {
  issue: Issue
  selected: boolean
  onSelect: (issue: Issue) => void
}

// Full-width, one-per-row for series with meaningful title data. Dash-
// separated label ("1 – Little Joe") binds number and title into one
// composite rather than reading as a ranked list (Design Direction
// Decision, ux-design-specification.md). Renders "Issue #{number}" when
// this specific row's title is blank -- the grid/list choice is series-
// level, never per-issue, so a titled series can still have untitled rows.
export function IssueListRow({ issue, selected, onSelect }: IssueListRowProps) {
  const label = issue.title ? `${issue.number} – ${issue.title}` : `Issue #${issue.number}`

  return (
    <button
      type="button"
      aria-label={
        issue.title ? `Issue ${issue.number}, ${issue.title}` : `Issue ${issue.number}`
      }
      aria-pressed={selected}
      onClick={() => onSelect(issue)}
      className={cn(
        'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
        selected
          ? 'border-collector-blue bg-collector-blue/5 text-collector-blue'
          : 'border-transparent text-slate-950 hover:bg-slate-50'
      )}
    >
      {label}
    </button>
  )
}

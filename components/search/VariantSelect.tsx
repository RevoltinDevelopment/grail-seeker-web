import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Issue } from '@/types/issue.types'

// Sentinel Select value for "Search all variants" -- Radix Select doesn't
// allow an empty-string item value, and the real resolved state (issueId:
// null) isn't itself a valid option value.
const SEARCH_ALL_VARIANTS = '__search_all_variants__'

interface VariantSelectProps {
  group: Issue
  /** Current issueId: the plain row's id, a named variant's id, or null for "search all variants". */
  value: string | null
  onChange: (issueId: string | null) => void
}

// Corrected design (this session's design conversation, superseding the UX
// spec's shorter "standard/primary cover always listed first" description):
// defaults to the plain printing ("Cover A") when one exists; defaults to
// an explicit "Search all variants" option when it doesn't (~77% of real
// multi-printing groups have no plain option to default to). "Search all
// variants" is always an available choice regardless -- it's not just the
// no-plain fallback, it's also for the minority of collectors who
// deliberately want every printing, not just the standard one.
export function VariantSelect({ group, value, onChange }: VariantSelectProps) {
  const selectValue = value === null ? SEARCH_ALL_VARIANTS : value

  return (
    <Select
      value={selectValue}
      onValueChange={(v) => onChange(v === SEARCH_ALL_VARIANTS ? null : v)}
    >
      <SelectTrigger aria-label="Variant" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {group.plainIssueId && (
          <SelectItem value={group.plainIssueId}>Cover A (standard)</SelectItem>
        )}
        {group.variants.map((variant) => (
          <SelectItem key={variant.id} value={variant.id}>
            {variant.variantName}
          </SelectItem>
        ))}
        <SelectItem value={SEARCH_ALL_VARIANTS}>Search all variants</SelectItem>
      </SelectContent>
    </Select>
  )
}

import { cn } from '@/lib/utils'
import type { IssueVolume } from '@/types/issue.types'

interface VolumeBucketNavProps {
  hasMultipleVolumes: boolean
  volumes: IssueVolume[]
  selectedVolumeIndex: number
  selectedBucketIndex: number
  onSelectVolume: (index: number) => void
  onSelectBucket: (index: number) => void
}

// Chip-based hierarchical drill-down. Volume chips render only when
// hasMultipleVolumes is true (a field read directly off the API response,
// not derived from volumes.length -- Story 1.15's own design decision).
// Bucket chips render only for the currently-selected volume, and only
// when that volume's own hasBuckets is true (per-volume, not series-wide --
// a Judge-style series can have some small volumes that don't need bucket
// sub-navigation alongside larger ones that do).
export function VolumeBucketNav({
  hasMultipleVolumes,
  volumes,
  selectedVolumeIndex,
  selectedBucketIndex,
  onSelectVolume,
  onSelectBucket,
}: VolumeBucketNavProps) {
  const selectedVolume = volumes[selectedVolumeIndex]

  if (!hasMultipleVolumes && !selectedVolume?.hasBuckets) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {hasMultipleVolumes && (
        <div role="tablist" aria-label="Volume" className="flex flex-wrap gap-1">
          {volumes.map((v, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedVolumeIndex}
              onClick={() => onSelectVolume(i)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium',
                i === selectedVolumeIndex
                  ? 'border-collector-blue bg-collector-blue text-white'
                  : 'border-slate-300 text-slate-950 hover:border-collector-blue'
              )}
            >
              {v.volume === null ? 'Vol.' : `Vol. ${v.volume}`}
            </button>
          ))}
        </div>
      )}
      {selectedVolume?.hasBuckets && (
        <div role="tablist" aria-label="Range" className="flex flex-wrap gap-1">
          {selectedVolume.buckets.map((b, i) => {
            const first = b.issues[0]
            const last = b.issues[b.issues.length - 1]
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === selectedBucketIndex}
                onClick={() => onSelectBucket(i)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  i === selectedBucketIndex
                    ? 'border-collector-blue bg-collector-blue text-white'
                    : 'border-slate-300 text-slate-950 hover:border-collector-blue'
                )}
              >
                {first && last ? `${first.number}–${last.number}` : ''}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

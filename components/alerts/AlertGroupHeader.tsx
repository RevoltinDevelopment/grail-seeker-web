'use client'

interface AlertGroupHeaderProps {
  title: string
  alertCount: number
  isCollapsed: boolean
  onToggle: () => void
}

export function AlertGroupHeader({
  title,
  alertCount,
  isCollapsed,
  onToggle,
}: AlertGroupHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-left transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="rounded-full bg-collector-blue px-2 py-0.5 text-xs font-semibold text-white">
          {alertCount}
        </span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`flex-shrink-0 text-slate-500 transition-transform duration-200 ${
          isCollapsed ? '-rotate-90' : ''
        }`}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

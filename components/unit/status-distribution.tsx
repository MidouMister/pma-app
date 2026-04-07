import { cn } from "@/lib/utils"

const STATUS_CONFIG = [
  {
    key: "New",
    label: "Nouveau",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "InProgress",
    label: "En cours",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "Pause",
    label: "En pause",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "Complete",
    label: "Terminé",
    dot: "bg-gray-500",
    bar: "bg-gray-500",
    bg: "bg-gray-500/10",
    text: "text-gray-600 dark:text-gray-400",
  },
]

interface StatusDistributionProps {
  counts: Record<string, number>
  total: number
}

export function StatusDistribution({ counts, total }: StatusDistributionProps) {
  return (
    <div className="flex flex-col gap-3">
      {STATUS_CONFIG.map(({ key, label, dot, bar, bg: _bg, text }) => {
        const count = counts[key] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0

        return (
          <div key={key} className="flex items-center gap-3">
            {/* Dot + label */}
            <div className="flex w-24 shrink-0 items-center gap-2">
              <span className={cn("size-2 rounded-full", dot)} />
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    bar
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Count + pct */}
            <div className="flex w-16 shrink-0 items-center justify-end gap-1.5">
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {count}
              </span>
              <span
                className={cn("text-[10px] font-medium tabular-nums", text)}
              >
                {pct}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  variant?: "page" | "table" | "form" | "cards"
  rows?: number
  columns?: number
  hasHeader?: boolean
  className?: string
}

export function LoadingSkeleton({
  variant = "page",
  rows = 5,
  columns = 4,
  hasHeader = true,
  className,
}: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <div className={cn("w-full space-y-3 p-4", className)}>
        {hasHeader && (
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-[180px]" />
              <Skeleton className="h-4 w-[260px]" />
            </div>
            <Skeleton className="h-9 w-[120px] rounded-md" />
          </div>
        )}
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (variant === "form") {
    return (
      <div className={cn("mx-auto max-w-xl space-y-6 p-4", className)}>
        <div className="space-y-2">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-9 w-[80px] rounded-md" />
          <Skeleton className="h-9 w-[100px] rounded-md" />
        </div>
      </div>
    )
  }

  if (variant === "cards") {
    return (
      <div className={cn("w-full space-y-6 p-4", className)}>
        {hasHeader && (
          <div className="space-y-2">
            <Skeleton className="h-7 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        )}
        <div
          className={cn(
            "grid gap-4",
            columns === 2 && "md:grid-cols-2",
            columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "md:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Default: page variant
  return (
    <div className={cn("w-full space-y-6 p-4", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-9 w-[120px] rounded-md" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

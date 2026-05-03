import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2">
        <Skeleton className="h-9 w-[220px]" />
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-9 w-[200px]" />
      </div>

      {/* Board columns skeleton */}
      <div className="grid auto-cols-fr grid-flow-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-md border bg-secondary p-3"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

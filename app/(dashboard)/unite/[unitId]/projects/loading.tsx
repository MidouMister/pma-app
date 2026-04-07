import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Premium Header Skeleton */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-5" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-lg border">
        {/* Header */}
        <div className="flex h-10 items-center gap-4 border-b bg-muted/50 px-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28 ml-auto" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-16 items-center gap-4 border-b px-4 last:border-b-0">
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-20" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="size-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

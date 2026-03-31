import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSkeleton({
  rows = 5,
  hasHeader = true,
}: {
  rows?: number
  hasHeader?: boolean
}) {
  return (
    <div className="space-y-4 w-full h-full p-4">
      {hasHeader && (
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      
      <div className="space-y-2 mt-8">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

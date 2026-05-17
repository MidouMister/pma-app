import { PageHeader } from "@/components/shared/page-header"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Notifications"
        description="Consultez et gérez vos notifications"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {/* Tabs skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Action button skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>

        {/* Notification cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
            <Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="mt-1 size-4 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

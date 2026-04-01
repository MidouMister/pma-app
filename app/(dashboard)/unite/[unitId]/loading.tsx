import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"

export default function UnitDashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Tableau de bord"
        description="Chargement des données..."
      />

      {/* KPI Skeleton Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Recent Projects Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <div className="rounded-lg border">
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Activity Placeholder Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}

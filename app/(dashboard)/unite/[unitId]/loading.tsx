import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

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
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-9 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="flex h-10 items-center border-b px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 flex-1" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-4 border-b px-4 last:border-b-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Placeholder Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Skeleton className="mb-3 size-12 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-64" />
        </CardContent>
      </Card>
    </div>
  )
}

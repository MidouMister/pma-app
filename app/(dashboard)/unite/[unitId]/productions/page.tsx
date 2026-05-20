import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Factory } from "lucide-react"
import { getCurrentUser, getUnitProductionOverview } from "@/lib/queries"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { UnitProductionPlanner } from "@/components/production/unit-production-planner"

export default async function ProductionsPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params

  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user || !user.companyId) redirect("/onboarding")

  if (user.role === "USER") redirect(`/unite/${unitId}`)

  const phases = await getUnitProductionOverview(unitId, user.companyId)
  const hasAnyData = phases.length > 0

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { name: true },
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Planificateur de Production"
        description="Gérez et suivez le plan prévisionnel de production pour l'ensemble des projets de votre unité."
      />

      {!hasAnyData ? (
        <EmptyState
          title="Aucune donnée de production"
          description="Créez d'abord des projets et des phases pour utiliser le planificateur de production."
          icon={<Factory className="size-6" />}
        />
      ) : (
        <UnitProductionPlanner
          unitId={unitId}
          phases={phases}
          canEdit={user.role === "OWNER" || user.role === "ADMIN"}
          companyName={user.company?.name || "Entreprise"}
          unitName={unit?.name || "Unité"}
        />
      )}
    </div>
  )
}

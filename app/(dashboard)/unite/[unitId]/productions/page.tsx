import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { AlertTriangle, Banknote, Factory } from "lucide-react"
import { getCurrentUser, getUnitProductionOverview } from "@/lib/queries"
import { formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatCard } from "@/components/shared/stat-card"
import { ProductionsTable } from "@/components/production/production-table"
import type { PhaseOverviewRow } from "@/components/production/production-table"

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

  const THRESHOLD_PERCENT = user.company?.productionAlertThreshold ?? 80

  const overviewData: PhaseOverviewRow[] = phases.map((phase) => {
    const product = phase.Product
    const productions = product?.Productions ?? []
    const plannedTaux = product?.taux ?? 0
    const plannedMontant = product?.montantProd ?? 0
    const avgActualTaux =
      productions.length > 0
        ? Math.round(
            (productions.reduce((sum, p) => sum + p.taux, 0) /
              productions.length) *
              100
          ) / 100
        : 0
    const latestProduction = productions[0] ?? null
    const actualMontant = latestProduction?.mntProd ?? 0
    const ecart = Math.round((avgActualTaux - plannedTaux) * 100) / 100
    const isUnderperforming =
      !!product &&
      !!latestProduction &&
      latestProduction.taux < product.taux * (THRESHOLD_PERCENT / 100)

    return {
      phaseId: phase.id,
      phaseName: phase.name,
      projectId: phase.Project.id,
      projectName: phase.Project.name,
      plannedTaux,
      plannedMontant,
      avgActualTaux,
      actualMontant,
      ecart,
      isUnderperforming,
    }
  })

  const totalPlanned = overviewData.reduce(
    (sum, o) => sum + o.plannedMontant,
    0
  )
  const totalActual = overviewData.reduce((sum, o) => sum + o.actualMontant, 0)
  const underperformingCount = overviewData.filter(
    (o) => o.isUnderperforming
  ).length

  const projects = [
    ...new Map(phases.map((p) => [p.Project.id, p.Project.name])).entries(),
  ].map(([id, name]) => ({ id, name }))

  const hasAnyData = overviewData.length > 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Production"
        description="Suivi de production de votre unité"
      />

      {!hasAnyData ? (
        <EmptyState
          title="Aucune donnée de production"
          description="Les données de production apparaîtront ici une fois que des produits et des relevés de production auront été créés."
          icon={<Factory className="size-6" />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Montant global prévu"
              value={formatCurrency(totalPlanned)}
              icon={<Factory className="size-4" />}
              accent="primary"
            />
            <StatCard
              label="Montant global réalisé"
              value={formatCurrency(totalActual)}
              icon={<Banknote className="size-4" />}
              accent="violet"
            />
            <StatCard
              label="Phases sous-performantes"
              value={underperformingCount}
              icon={<AlertTriangle className="size-4" />}
              accent={underperformingCount > 0 ? "warning" : "success"}
              description={
                underperformingCount > 0
                  ? `Seuil : ${THRESHOLD_PERCENT}% du taux planifié`
                  : undefined
              }
            />
          </div>

          <ProductionsTable
            data={overviewData}
            projects={projects}
            threshold={THRESHOLD_PERCENT}
          />
        </>
      )}
    </div>
  )
}

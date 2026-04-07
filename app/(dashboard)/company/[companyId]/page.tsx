import Link from "next/link"
import { redirect } from "next/navigation"
import { Building2, FolderKanban, Users, Banknote, Activity, Plus, Settings, UserPlus } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { getCompanyDashboard } from "@/lib/queries"
import { formatCurrency } from "@/lib/format"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { StatCard } from "@/components/shared/stat-card"
import { UnitCard } from "@/components/company/unit-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function CompanyDashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const company = await getCompanyDashboard(companyId)

  if (!company) {
    redirect("/onboarding")
  }

  const totalUnits = company.units.length
  const totalProjects = company.Project.length
  const totalMembers = company.users.length
  const totalContractValue = company.Project.reduce(
    (sum: number, project: { montantTTC: number }) => sum + project.montantTTC,
    0
  )
  const activeProjects = company.Project.filter(
    (project: { status: string }) => project.status === "InProgress"
  ).length

  const unitsOverview = company.units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    adminName: unit.admin?.name ?? null,
    projectCount: unit.projects.length,
    memberCount: unit.members.length,
    totalProjects,
  }))

  // Get top 3 most recent projects across all units
  const recentProjects = company.Project
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3)

  const initials = company.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Premium Header */}
      <DashboardHeader
        title={company.name}
        subtitle="Tableau de bord de votre entreprise"
        icon={initials}
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/company/${companyId}/units`}>
              <Plus className="size-4" />
              Nouvelle unité
            </Link>
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Unités"
          value={totalUnits}
          icon={<Building2 className="size-4" />}
          accent="primary"
          description={totalUnits === 0 ? "Aucune unité configurée" : undefined}
        />
        <StatCard
          label="Projets"
          value={totalProjects}
          icon={<FolderKanban className="size-4" />}
          accent="violet"
          description={`${activeProjects} en cours`}
        />
        <StatCard
          label="Membres"
          value={totalMembers}
          icon={<Users className="size-4" />}
          href={`/company/${companyId}/users`}
        />
        <StatCard
          label="Valeur contrats"
          value={formatCurrency(totalContractValue)}
          icon={<Banknote className="size-4" />}
          accent="success"
        />
        <StatCard
          label="Projets actifs"
          value={activeProjects}
          icon={<Activity className="size-4" />}
          accent={activeProjects > 0 ? "success" : "warning"}
          description={activeProjects === 0 ? "Aucun projet en cours" : undefined}
        />
      </div>

      {/* Unit Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu des unités</CardTitle>
          <CardDescription>
            {totalUnits} unité{totalUnits !== 1 ? "s" : ""} configurée{totalUnits !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unitsOverview.length === 0 ? (
            <EmptyState
              title="Aucune unité"
              description="Créez votre première unité pour commencer à organiser vos projets."
              action={{
                label: "Créer une unité",
                href: `/company/${companyId}/units`,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unitsOverview.map((unit, index) => (
                <UnitCard key={unit.id} unit={unit} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom: Quick Actions + Recent Projects */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
                <Link href={`/company/${companyId}/units`}>
                  <Plus className="size-5 text-primary" />
                  <span className="text-xs font-medium">Créer une unité</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
                <Link href={`/company/${companyId}/users`}>
                  <UserPlus className="size-5 text-primary" />
                  <span className="text-xs font-medium">Gérer l&apos;équipe</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
                <Link href={`/company/${companyId}/settings`}>
                  <Settings className="size-5 text-primary" />
                  <span className="text-xs font-medium">Paramètres</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
                <Link href={`/company/${companyId}/settings/billing`}>
                  <Banknote className="size-5 text-primary" />
                  <span className="text-xs font-medium">Facturation</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Derniers projets</CardTitle>
              <CardDescription>Les 3 projets les plus récents</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href={`/company/${companyId}`}>
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun projet créé pour le moment.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/unite/${project.unitId}/projects/${project.id}`}
                    className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {project.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {project.status === "InProgress" ? "En cours" : project.status === "Complete" ? "Terminé" : project.status === "Pause" ? "En pause" : "Nouveau"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(project.montantTTC)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

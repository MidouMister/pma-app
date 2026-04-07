import Link from "next/link"
import { redirect } from "next/navigation"
import { FolderKanban, Users, Banknote, Activity, Plus, UserPlus, UsersRound } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { getUnitDashboard, getCurrentUser, getCompanyById } from "@/lib/queries"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusDistribution } from "@/components/unit/status-distribution"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STATUS_LABELS: Record<string, string> = {
  New: "Nouveau",
  InProgress: "En cours",
  Pause: "En pause",
  Complete: "Terminé",
}

const STATUS_DOT_COLORS: Record<string, string> = {
  New: "bg-blue-500",
  InProgress: "bg-emerald-500",
  Pause: "bg-amber-500",
  Complete: "bg-gray-500",
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  New: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  InProgress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Pause: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
}

export default async function UnitDashboardPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()
  if (!user || !user.companyId) {
    redirect("/onboarding")
  }

  const { unit, projects, kpiData } = await getUnitDashboard(
    unitId,
    user.companyId
  )

  if (!unit) {
    redirect("/dashboard")
  }

  // Get company name for breadcrumb
  const company = await getCompanyById(user.companyId)

  const totalContractValue = kpiData.reduce((sum, p) => sum + p.montantTTC, 0)
  const activeProjects = kpiData.filter((p) => p.status === "InProgress").length
  const totalProjects = kpiData.length

  // Status counts
  const statusCounts: Record<string, number> = {}
  kpiData.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
  })

  const unitInitials = unit.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Premium Header */}
      <DashboardHeader
        title={unit.name}
        subtitle={`${company?.name ?? "Entreprise"} · Vue d'ensemble de l'unité`}
        icon={unitInitials}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/unite/${unitId}/members`}>
                <UsersRound className="size-4" />
                <span className="hidden sm:inline">Membres</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/unite/${unitId}/projects`}>
                <Plus className="size-4" />
                Nouveau projet
              </Link>
            </Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projets"
          value={unit._count.projects}
          icon={<FolderKanban className="size-4" />}
          accent="primary"
          description={`${totalProjects - activeProjects} en attente`}
        />
        <StatCard
          label="Projets actifs"
          value={activeProjects}
          icon={<Activity className="size-4" />}
          accent={activeProjects > 0 ? "success" : "warning"}
        />
        <StatCard
          label="Membres"
          value={unit._count.members}
          icon={<Users className="size-4" />}
          href={`/unite/${unitId}/members`}
        />
        <StatCard
          label="Valeur contrats"
          value={formatCurrency(totalContractValue)}
          icon={<Banknote className="size-4" />}
          accent="violet"
        />
      </div>

      {/* Status Distribution + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
            <CardDescription>
              Distribution des {totalProjects} projets par état d&apos;avancement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistribution counts={statusCounts} total={totalProjects} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href={`/unite/${unitId}/projects`}>
                  <FolderKanban className="size-4 text-primary" />
                  Voir les projets
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href={`/unite/${unitId}/clients`}>
                  <Users className="size-4 text-primary" />
                  Voir les clients
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href={`/unite/${unitId}/members`}>
                  <UserPlus className="size-4 text-primary" />
                  Inviter un membre
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href={`/unite/${unitId}/settings`}>
                  <Banknote className="size-4 text-primary" />
                  Paramètres unité
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Projets récents</CardTitle>
            <CardDescription>
              Les {Math.min(projects.length, 5)} derniers projets créés
            </CardDescription>
          </div>
          {projects.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href={`/unite/${unitId}/projects`}>
                Voir tous
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <EmptyState
              title="Aucun projet"
              description="Créez votre premier projet pour commencer à suivre votre activité."
              action={{
                label: "Créer un projet",
                href: `/unite/${unitId}/projects`,
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((project) => {
                const statusLabel = STATUS_LABELS[project.status] ?? project.status
                const dotColor = STATUS_DOT_COLORS[project.status] ?? "bg-muted-foreground"
                const badgeStyle = STATUS_BADGE_STYLES[project.status] ?? ""

                return (
                  <Link
                    key={project.id}
                    href={`/unite/${unit.id}/projects/${project.id}`}
                    className="group flex flex-col gap-2 rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      {/* Status dot */}
                      <span className={cn("size-2.5 shrink-0 rounded-full", dotColor)} />

                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {project.name}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono uppercase">{project.code}</span>
                          {project.Client && (
                            <span>· {project.Client.name}</span>
                          )}
                          <span>· {formatDate(project.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:shrink-0">
                      <Badge variant="secondary" className={cn("text-xs font-medium", badgeStyle)}>
                        {statusLabel}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(project.montantTTC)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Placeholder */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Activity className="size-6 text-primary" />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Activité récente</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Les journaux d&apos;activité seront disponibles dans une prochaine mise à jour.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

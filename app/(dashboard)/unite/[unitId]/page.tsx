import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  FolderKanban,
  Activity,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { STATUS_COLORS } from "@/lib/constants"

interface UnitDashboardPageProps {
  params: Promise<{ unitId: string }>
}

const statusLabels: Record<string, string> = {
  New: "Nouveau",
  InProgress: "En cours",
  Pause: "En pause",
  Complete: "Terminé",
}

export default async function UnitDashboardPage({
  params,
}: UnitDashboardPageProps) {
  const { unitId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, companyId: true, unitId: true },
  })

  if (!user || !user.companyId) {
    redirect("/onboarding")
  }

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
    select: { id: true, name: true, logo: true },
  })

  if (!unit) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Unité introuvable"
          description="Cette unité n'existe pas ou vous n'y avez pas accès."
        />
      </div>
    )
  }

  const isAdmin = user.role === "ADMIN" && user.unitId === unitId
  const isOwner = user.role === "OWNER"

  if (!isAdmin && !isOwner) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour accéder à cette unité."
        />
      </div>
    )
  }

  const [
    totalProjects,
    activeProjects,
    teamSize,
    totalContractValue,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count({
      where: { unitId, companyId: user.companyId },
    }),
    prisma.project.count({
      where: { unitId, companyId: user.companyId, status: "InProgress" },
    }),
    prisma.user.count({
      where: { unitId, companyId: user.companyId },
    }),
    prisma.project.aggregate({
      where: { unitId, companyId: user.companyId },
      _sum: { montantTTC: true },
    }),
    prisma.project.findMany({
      where: { unitId, companyId: user.companyId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        montantTTC: true,
        Client: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const kpiCards = [
    {
      title: "Nombre de projets",
      value: totalProjects.toString(),
      icon: FolderKanban,
    },
    {
      title: "Projets actifs",
      value: activeProjects.toString(),
      icon: Activity,
    },
    {
      title: "Taille de l'équipe",
      value: teamSize.toString(),
      icon: Users,
    },
    {
      title: "Valeur contractuelle TTC",
      value: formatCurrency(totalContractValue._sum.montantTTC ?? 0),
      icon: TrendingUp,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord — {unit.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de votre unité et de ses projets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projets récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <EmptyState
              title="Aucun projet"
              description="Commencez par créer votre premier projet pour suivre son avancement."
              action={{
                label: "Créer un projet",
                href: `/unite/${unitId}/projects`,
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/unite/${unitId}/projects/${project.id}`}
                  className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-medium">{project.name}</span>
                    <Badge
                      className={cn(
                        "text-xs",
                        STATUS_COLORS[
                          project.status as keyof typeof STATUS_COLORS
                        ]
                      )}
                    >
                      {statusLabels[project.status] ?? project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{project.Client?.name ?? "—"}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(project.montantTTC)}
                    </span>
                    <ArrowRight className="size-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Activité à venir"
            description="Le journal d'activité sera disponible prochainement. Vous pourrez suivre toutes les actions réalisées dans votre unité."
          />
        </CardContent>
      </Card>
    </div>
  )
}

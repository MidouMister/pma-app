import Link from "next/link"
import { redirect } from "next/navigation"
import { FolderKanban, Users, Banknote, Activity } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: "default" | "primary" | "success" | "warning"
}

function KpiCard({ label, value, icon, accent = "default" }: KpiCardProps) {
  const accentClasses: Record<string, string> = {
    default: "bg-muted/50",
    primary: "bg-primary/5",
    success: "bg-emerald-500/5",
    warning: "bg-amber-500/5",
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={cn("rounded-lg p-2", accentClasses[accent])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

const STATUS_LABELS: Record<string, string> = {
  New: "Nouveau",
  InProgress: "En cours",
  Pause: "En pause",
  Complete: "Terminé",
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "InProgress":
      return "default"
    case "Complete":
      return "secondary"
    case "Pause":
      return "outline"
    default:
      return "outline"
  }
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

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user || !user.companyId) {
    redirect("/onboarding")
  }

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
    include: {
      _count: {
        select: { projects: true, members: true },
      },
    },
  })

  if (!unit) {
    redirect("/dashboard")
  }

  const projects = await prisma.project.findMany({
    where: { unitId: unit.id, companyId: user.companyId },
    include: { Client: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const allProjects = await prisma.project.findMany({
    where: { unitId: unit.id, companyId: user.companyId },
    select: { montantTTC: true, status: true },
  })

  const totalContractValue = allProjects.reduce(
    (sum, p) => sum + p.montantTTC,
    0
  )

  const activeProjects = allProjects.filter(
    (p) => p.status === "InProgress"
  ).length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={unit.name}
        description="Vue d'ensemble de votre unité"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Projets"
          value={unit._count.projects}
          icon={<FolderKanban className="size-4" />}
          accent="primary"
        />
        <KpiCard
          label="Projets actifs"
          value={activeProjects}
          icon={<Activity className="size-4" />}
          accent={activeProjects > 0 ? "success" : "warning"}
        />
        <KpiCard
          label="Membres"
          value={unit._count.members}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Valeur contrats"
          value={formatCurrency(totalContractValue)}
          icon={<Banknote className="size-4" />}
          accent="success"
        />
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projets récents</CardTitle>
          <CardDescription>
            Les {Math.min(projects.length, 5)} derniers projets créés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <EmptyState
              title="Aucun projet"
              description="Créez votre premier projet pour commencer."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead className="text-right">Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link
                          href={`/unite/${unit.id}/projects/${project.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {project.code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.Client?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {STATUS_LABELS[project.status] ?? project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(project.montantTTC)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <Activity className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Bientôt disponible</p>
              <p className="text-sm text-muted-foreground">
                Les journaux d&apos;activité seront disponibles prochainement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

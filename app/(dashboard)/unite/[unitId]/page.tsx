import Link from "next/link"
import { redirect } from "next/navigation"
import { FolderKanban, Users, Banknote, Activity } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/format"
import { STATUS_COLORS } from "@/lib/constants"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
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
        title={`Tableau de bord — ${unit.name}`}
        description="Vue d'ensemble de votre unité"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Projets"
          value={unit._count.projects}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <KpiCard
          label="Projets actifs"
          value={activeProjects}
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          label="Membres"
          value={unit._count.members}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Valeur totale des contrats"
          value={formatCurrency(totalContractValue)}
          icon={<Banknote className="h-4 w-4" />}
        />
      </div>

      {/* Recent Projects */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Projets récents</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun projet pour le moment.
          </p>
        ) : (
          <div className="rounded-lg border">
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
                    <TableCell className="text-muted-foreground">
                      {project.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.Client?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          STATUS_COLORS[
                            project.status as keyof typeof STATUS_COLORS
                          ]
                        }
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
      </div>

      {/* Recent Activity Placeholder */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Activité récente</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Les journaux d&apos;activité seront disponibles prochainement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

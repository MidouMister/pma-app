import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Building2,
  FolderKanban,
  Users,
  Banknote,
  Activity,
  ArrowRight,
} from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface UnitCardProps {
  unit: {
    id: string
    name: string
    adminName: string | null
    projectCount: number
    memberCount: number
  }
}

function UnitCard({ unit }: UnitCardProps) {
  return (
    <Link
      href={`/unite/${unit.id}`}
      className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {unit.name}
        </h3>
        <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          <span>
            {unit.memberCount} membre{unit.memberCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FolderKanban className="size-3.5" />
          <span>
            {unit.projectCount} projet{unit.projectCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {unit.adminName ? (
        <p className="text-xs text-muted-foreground">
          Admin : {unit.adminName}
        </p>
      ) : (
        <Badge variant="outline" className="w-fit text-xs">
          Aucun admin assigné
        </Badge>
      )}
    </Link>
  )
}

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

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      units: {
        include: {
          admin: true,
          projects: true,
          members: true,
        },
      },
      Project: {
        select: {
          id: true,
          montantTTC: true,
          status: true,
        },
      },
      users: {
        select: {
          id: true,
        },
      },
    },
  })

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
  }))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={company.name}
        description="Tableau de bord de votre entreprise"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Unités"
          value={totalUnits}
          icon={<Building2 className="size-4" />}
          accent="primary"
        />
        <KpiCard
          label="Projets"
          value={totalProjects}
          icon={<FolderKanban className="size-4" />}
        />
        <KpiCard
          label="Membres"
          value={totalMembers}
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Valeur contrats"
          value={formatCurrency(totalContractValue)}
          icon={<Banknote className="size-4" />}
          accent="success"
        />
        <KpiCard
          label="Projets actifs"
          value={activeProjects}
          icon={<Activity className="size-4" />}
          accent={activeProjects > 0 ? "success" : "warning"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu des unités</CardTitle>
        </CardHeader>
        <CardContent>
          {unitsOverview.length === 0 ? (
            <EmptyState
              title="Aucune unité"
              description="Créez votre première unité depuis la page de gestion des unités."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unitsOverview.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

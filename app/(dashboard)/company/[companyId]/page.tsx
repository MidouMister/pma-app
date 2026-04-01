import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Building2,
  FolderKanban,
  Users,
  Banknote,
  Activity,
} from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface UnitOverviewProps {
  id: string
  name: string
  adminName: string | null
  projectCount: number
  memberCount: number
}

function UnitRow({ unit }: { unit: UnitOverviewProps }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
      <Link
        href={`/unite/${unit.id}`}
        className="font-medium text-foreground hover:underline"
      >
        {unit.name}
      </Link>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="min-w-[100px]">
          {unit.adminName || <Badge variant="secondary">Aucun admin</Badge>}
        </span>
        <span className="min-w-[80px] text-center">
          {unit.projectCount} projet{unit.projectCount !== 1 ? "s" : ""}
        </span>
        <span className="min-w-[80px] text-center">
          {unit.memberCount} membre{unit.memberCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
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

  const unitsOverview: UnitOverviewProps[] = company.units.map((unit) => ({
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
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Projets"
          value={totalProjects}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <KpiCard
          label="Membres"
          value={totalMembers}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Valeur totale des contrats"
          value={formatCurrency(totalContractValue)}
          icon={<Banknote className="h-4 w-4" />}
        />
        <KpiCard
          label="Projets actifs"
          value={activeProjects}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Aperçu des unités</h2>
        {unitsOverview.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune unité configurée pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 px-4 text-sm font-medium text-muted-foreground">
              <span>Nom</span>
              <div className="flex items-center gap-4">
                <span className="min-w-[100px]">Admin</span>
                <span className="min-w-[80px] text-center">Projets</span>
                <span className="min-w-[80px] text-center">Membres</span>
              </div>
            </div>
            {unitsOverview.map((unit) => (
              <UnitRow key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

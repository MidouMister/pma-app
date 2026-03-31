import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  Building2,
  FolderKanban,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"

interface CompanyDashboardPageProps {
  params: Promise<{ companyId: string }>
}

export default async function CompanyDashboardPage({
  params,
}: CompanyDashboardPageProps) {
  const { companyId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, companyId: true },
  })

  if (!user || user.role !== "OWNER" || user.companyId !== companyId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord."
        />
      </div>
    )
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  })

  if (!company) {
    redirect("/onboarding")
  }

  const [
    units,
    totalProjects,
    totalMembers,
    totalContractValue,
    activeProjects,
  ] = await Promise.all([
    prisma.unit.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        logo: true,
        admin: { select: { name: true } },
        _count: { select: { projects: true, members: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.project.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId } }),
    prisma.project.aggregate({
      where: { companyId },
      _sum: { montantTTC: true },
    }),
    prisma.project.count({
      where: { companyId, status: "InProgress" },
    }),
  ])

  const kpiCards = [
    {
      title: "Total Unités",
      value: units.length.toString(),
      icon: Building2,
    },
    {
      title: "Projets Totaux",
      value: totalProjects.toString(),
      icon: FolderKanban,
    },
    {
      title: "Membres Totaux",
      value: totalMembers.toString(),
      icon: Users,
    },
    {
      title: "Valeur Contractuelle TTC",
      value: formatCurrency(totalContractValue._sum.montantTTC ?? 0),
      icon: TrendingUp,
    },
    {
      title: "Projets Actifs",
      value: activeProjects.toString(),
      icon: Activity,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord — {company.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de votre entreprise et de ses unités.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          <CardTitle className="text-lg">Aperçu des Unités</CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <EmptyState
              title="Aucune unité"
              description="Commencez par créer votre première unité pour gérer vos projets."
              action={{
                label: "Créer une unité",
                href: `/company/${companyId}/units`,
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {units.map((unit) => (
                <Link
                  key={unit.id}
                  href={`/unite/${unit.id}`}
                  className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      {unit.logo ? (
                        <AvatarImage src={unit.logo} alt={unit.name} />
                      ) : (
                        <AvatarFallback>
                          {unit.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{unit.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {unit.admin?.name ?? "Aucun administrateur assigné"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>
                      {unit._count.projects} projet
                      {unit._count.projects !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {unit._count.members} membre
                      {unit._count.members !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

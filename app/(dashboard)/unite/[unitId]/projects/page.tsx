import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import { getScopedProjects, getUnitById, getUnitClients } from "@/lib/queries"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ProjectList } from "./project-list"
import { ProjectDialog } from "@/components/project/project-dialog"

interface ProjectsPageProps {
  params: Promise<{ unitId: string }>
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect("/company/onboarding")
  }

  const { unitId } = await params

  if (!user.companyId) {
    redirect("/onboarding")
  }

  const [unit, projects, clients] = await Promise.all([
    getUnitById(unitId),
    getScopedProjects(user.companyId, unitId, user.id, user.role),
    getUnitClients(unitId),
  ])

  if (!unit || unit.companyId !== user.companyId) {
    redirect("/dashboard")
  }

  const canCreate = user.role === "OWNER" || user.role === "ADMIN"

  const projectRows = projects.map((p) => {
    const totalProdAmount = p.phases.reduce((sum, ph) => {
      const prodAmount =
        ph.Product?.montantProd ?? (ph.progress / 100) * ph.montantHT
      return sum + prodAmount
    }, 0)
    const progress =
      p.montantHT > 0 ? Math.round((totalProdAmount / p.montantHT) * 100) : 0

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      type: p.type,
      status: p.status,
      signe: p.signe,
      montantHT: p.montantHT,
      montantTTC: p.montantTTC,
      delaiMonths: p.delaiMonths,
      delaiDays: p.delaiDays,
      ods: p.ods,
      clientId: p.clientId,
      clientName: p.Client?.name ?? null,
      progress,
      unitId,
      rawProject: p,
    }
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Premium Header */}
      <header className="relative rounded-xl border bg-card">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <div>
              <div className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link
                  href={`/unite/${unitId}`}
                  className="transition-colors hover:text-foreground"
                >
                  {unit.name}
                </Link>
                <ChevronRight className="size-3" />
                <span>Projets</span>
              </div>
              <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                Projets
                <Badge variant="secondary" className="font-mono text-xs">
                  {projects.length}
                </Badge>
              </h1>
            </div>
          </div>
          {canCreate && (
            <ProjectDialog
              unitId={unitId}
              companyId={user.companyId!}
              clients={clients}
            />
          )}
        </div>
      </header>

      {/* Data Table */}
      <ProjectList
        projects={projectRows}
        unitId={unitId}
        companyId={user.companyId!}
        canEdit={canCreate}
        clients={clients}
      />
    </div>
  )
}

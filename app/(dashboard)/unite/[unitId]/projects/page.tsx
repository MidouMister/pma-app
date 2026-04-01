import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProjectList } from "@/components/project/project-list"
import { ProjectDialog } from "@/components/project/project-dialog"
import { PageHeader } from "@/components/shared/page-header"

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

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
  })

  if (!unit) {
    redirect("/dashboard")
  }

  // RBAC filtering (PROJ-08)
  let projectsWhere: {
    companyId: string
    archived: boolean
    unitId?: string
    team?: { members: { some: { userId: string } } }
  } = {
    companyId: user.companyId,
    archived: false,
  }

  if (user.role === "ADMIN") {
    projectsWhere.unitId = unitId
  } else if (user.role === "USER") {
    // USERs see only assigned projects
    projectsWhere = {
      ...projectsWhere,
      unitId,
      team: { members: { some: { userId: user.id } } },
    }
  }
  // OWNER sees all projects in company (across all units)

  const projects = await prisma.project.findMany({
    where: projectsWhere,
    orderBy: { createdAt: "desc" },
  })

  const clients = await prisma.client.findMany({
    where: { unitId, companyId: user.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  const simpleProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    type: p.type,
    montantHT: p.montantHT,
    montantTTC: p.montantTTC,
    ods: p.ods,
    delaiMonths: p.delaiMonths,
    delaiDays: p.delaiDays,
    status: p.status,
    signe: p.signe,
    clientId: p.clientId,
    client: clientMap.get(p.clientId),
    phases: [] as Array<{ montantHT: number; progress: number }>,
  }))

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Projets"
        description="Gérez vos projets et leur progression"
      />

      <div className="mt-6">
        {user.role === "OWNER" || user.role === "ADMIN" ? (
          <div className="mb-4 flex justify-end">
            <ProjectDialog
              unitId={unitId}
              companyId={user.companyId!}
              clients={clients}
            />
          </div>
        ) : null}

        <ProjectList
          projects={simpleProjects}
          unitId={unitId}
          companyId={user.companyId!}
          userRole={user.role as "OWNER" | "ADMIN" | "USER"}
        />
      </div>
    </div>
  )
}

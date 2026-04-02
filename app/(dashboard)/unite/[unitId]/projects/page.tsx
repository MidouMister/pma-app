import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import { getScopedProjects, getUnitById, getUnitClients } from "@/lib/queries"
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

  const [unit, projects, clients] = await Promise.all([
    getUnitById(unitId),
    getScopedProjects(user.companyId, unitId, user.id, user.role),
    getUnitClients(unitId),
  ])

  if (!unit || unit.companyId !== user.companyId) {
    redirect("/dashboard")
  }



  const simpleProjects = projects.map((p) => ({
    ...p,
    client: p.Client,
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

import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import {
  getProjectById,
  getProjectDocuments,
  isProjectMember,
} from "@/lib/queries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { ProjectOverview } from "@/components/project/project-overview"
import { ProjectGanttPlaceholder } from "@/components/project/project-gantt-placeholder"
import { ProjectProductionPlaceholder } from "@/components/project/project-production-placeholder"
import { ProjectTasksPlaceholder } from "@/components/project/project-tasks-placeholder"
import { ProjectTimeTrackingPlaceholder } from "@/components/project/project-time-tracking-placeholder"
import { ProjectDocuments } from "@/components/project/project-documents"

interface ProjectDetailPageProps {
  params: Promise<{ unitId: string; projectId: string }>
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect("/company/onboarding")
  }

  const { unitId, projectId } = await params

  if (!user.companyId) {
    redirect("/onboarding")
  }

  const project = await getProjectById(projectId)

  if (!project || project.companyId !== user.companyId) {
    redirect(`/unite/${unitId}/projects`)
  }

  if (user.role === "USER") {
    const isMember = await isProjectMember(projectId, user.id)
    if (!isMember) {
      redirect(`/unite/${unitId}/projects`)
    }
  }

  const documents = await getProjectDocuments(projectId)

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title={project.name}
        description={`${project.code} - ${project.type}`}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="timetracking">Suivi du temps</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview
            project={project as never}
            userRole={user.role as "OWNER" | "ADMIN" | "USER"}
          />
        </TabsContent>

        <TabsContent value="gantt">
          <ProjectGanttPlaceholder projectId={project.id} />
        </TabsContent>

        <TabsContent value="production">
          <ProjectProductionPlaceholder projectId={project.id} />
        </TabsContent>

        <TabsContent value="tasks">
          <ProjectTasksPlaceholder projectId={project.id} />
        </TabsContent>

        <TabsContent value="timetracking">
          <ProjectTimeTrackingPlaceholder projectId={project.id} />
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments
            projectId={project.id}
            companyId={user.companyId!}
            initialDocuments={documents ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

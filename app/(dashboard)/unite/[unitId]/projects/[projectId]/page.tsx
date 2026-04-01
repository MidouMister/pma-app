import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: user.companyId },
    include: {
      phases: {
        include: {
          SubPhases: true,
        },
        orderBy: { startDate: "asc" },
      },
      team: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
    },
  } as never)

  if (!project) {
    redirect(`/unite/${unitId}/projects`)
  }

  if (user.role === "USER") {
    const isTeamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: { projectId },
      },
    })
    if (!isTeamMember) {
      redirect(`/unite/${unitId}/projects`)
    }
  }

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
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

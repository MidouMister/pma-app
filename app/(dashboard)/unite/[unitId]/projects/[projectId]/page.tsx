import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import {
  getProjectById,
  getProjectDocuments,
  getGanttData,
  getProjectTeam,
  isProjectMember,
} from "@/lib/queries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { ProjectOverview } from "@/components/project/project-overview"
import { ProjectGantt } from "@/components/project/project-gantt"
import { ProductionTab } from "@/components/project/production/production-tab"
import { ProjectTasksPlaceholder } from "@/components/project/project-tasks-placeholder"
import { TimeTrackingTab } from "@/components/project/time-tracking/time-tracking-tab"
import { ProjectDocuments } from "@/components/project/project-documents"
import { PhaseList } from "@/components/project/phase-list"
import { EmptyState } from "@/components/shared/empty-state"
import { PackageOpen } from "lucide-react"

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
  const { phases, markers } = await getGanttData(projectId)
  const teamMembers = await getProjectTeam(projectId)
  const mappedTeamMembers = teamMembers.map((tm) => ({
    id: tm.user.id,
    name: tm.user.name,
    avatarUrl: tm.user.avatarUrl,
  }))

  const canEdit = user.role === "OWNER" || user.role === "ADMIN"

  return (
    <div className="container mx-auto px-2 py-6">
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
          <div className="space-y-6">
            <ProjectOverview
              project={project as never}
              userRole={user.role as "OWNER" | "ADMIN" | "USER"}
            />
            <PhaseList
              projectId={project.id}
              projectMontantHT={project.montantHT}
              projectODS={project.ods}
              phases={phases}
              userRole={user.role as "OWNER" | "ADMIN" | "USER"}
            />
          </div>
        </TabsContent>

        <TabsContent value="gantt">
          <ProjectGantt
            phases={phases}
            markers={markers.map((m) => ({
              ...m,
              className: m.className ?? undefined,
            }))}
            canEdit={canEdit}
            projectId={projectId}
            unitId={unitId}
            projectMontantHT={project.montantHT}
            projectODS={project.ods}
          />
        </TabsContent>

        <TabsContent value="production">
          <div className="space-y-6">
            {project.phases && project.phases.length > 0 ? (
              project.phases.map((phase) => (
                <ProductionTab
                  key={phase.id}
                  projectId={project.id}
                  phaseId={phase.id}
                  phaseMontantHT={phase.montantHT}
                  canEdit={canEdit}
                  productionAlertThreshold={
                    user.company?.productionAlertThreshold ?? 80
                  }
                />
              ))
            ) : (
              <EmptyState
                title="Aucune phase"
                description="Créez d'abord des phases pour pouvoir suivre la production."
                icon={<PackageOpen className="size-6" />}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <ProjectTasksPlaceholder projectId={project.id} />
        </TabsContent>

        <TabsContent value="timetracking">
          <TimeTrackingTab
            projectId={project.id}
            projectName={project.name}
            canEdit={canEdit}
            userId={user.id}
            teamMembers={mappedTeamMembers}
          />
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

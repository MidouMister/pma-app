import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import {
  getProjectById,
  getProjectDocuments,
  getGanttData,
  getProjectTeam,
  isProjectMember,
  getUnitLanes,
  getUnitTasks,
  getScopedProjects,
  getUnitMembers,
  getUnitTags,
} from "@/lib/queries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { ProjectOverview } from "@/components/project/project-overview"
import { ProjectGantt } from "@/components/project/project-gantt"
import { ProductionTab } from "@/components/project/production/production-tab"
import { UnitKanban } from "@/components/kanban/unit-kanban"
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

  // Fetch Kanban data for the tasks tab
  const [lanes, tasks, scopedProjects, unitMembers, tags] = await Promise.all([
    getUnitLanes(unitId, user.companyId!),
    getUnitTasks(unitId, user.companyId!),
    getScopedProjects(user.companyId!, unitId, user.id, user.role),
    getUnitMembers(unitId, user.companyId!),
    getUnitTags(unitId, user.companyId!),
  ])

  const currentUser = {
    id: user.id,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  }

  // Map lanes
  const kanbanLanes = lanes.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
  }))

  const teamMembersMapped = unitMembers.map((m) => ({
    id: m.id,
    name: m.name,
  }))

  const availableTags = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }))

  // Map projects for Kanban filter + task dialog
  const dialogProjects = scopedProjects.map((p) => ({
    id: p.id,
    name: p.name,
    phases: p.phases.map((ph) => ({
      id: ph.id,
      name: ph.name,
      SubPhases: ph.SubPhases.map((sp) => ({ id: sp.id, name: sp.name })),
    })),
  }))

  // Map tasks
  const kanbanTasks = tasks.map((t) => ({
    id: t.id,
    name: t.title,
    column: t.laneId ?? kanbanLanes[0]?.id ?? "",
    title: t.title,
    description: t.description,
    laneId: t.laneId,
    laneName: kanbanLanes.find((l) => l.id === t.laneId)?.name ?? null,
    complete: t.complete,
    dueDate: t.dueDate,
    startDate: t.startDate ?? null,
    assignedUserId: t.assignedUserId,
    assignedUserName: t.Assigned?.name ?? null,
    assignedUserAvatar: t.Assigned?.avatarUrl ?? null,
    tagIds: t.Tags.map((tag) => tag.id),
    tagNames: t.Tags.map((tag) => tag.name),
    tagColors: t.Tags.map((tag) => tag.color),
    order: t.order,
    projectId: t.projectId,
    projectName: scopedProjects.find((p) => p.id === t.projectId)?.name ?? "",
    phaseName: t.Phase?.name ?? null,
    subPhaseName: t.subPhase?.name ?? null,
    phaseId: t.phaseId ?? null,
    subPhaseId: t.subPhaseId ?? null,
    commentCount: t._count?.TaskComment ?? 0,
  }))

  // Map projects for filter
  const kanbanProjects = scopedProjects.map((p) => ({
    id: p.id,
    name: p.name,
  }))

  // Map phases for filter
  const kanbanPhases = scopedProjects.flatMap((p) =>
    p.phases.map((ph) => ({
      id: ph.id,
      name: ph.name,
      projectId: p.id,
    }))
  )

  // Map subPhases for filter
  const kanbanSubPhases = scopedProjects.flatMap((p) =>
    p.phases.flatMap((ph) =>
      ph.SubPhases.map((sp) => ({
        id: sp.id,
        name: sp.name,
        phaseId: ph.id,
      }))
    )
  )

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
                  phaseName={phase.name}
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
          <UnitKanban
            lanes={kanbanLanes}
            tasks={kanbanTasks}
            projects={kanbanProjects}
            phases={kanbanPhases}
            subPhases={kanbanSubPhases}
            unitId={unitId}
            companyId={user.companyId!}
            canEdit={canEdit}
            teamMembers={teamMembersMapped}
            currentUser={currentUser}
            dialogProjects={dialogProjects}
            availableTags={availableTags}
            defaultProjectFilter={projectId}
          />
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

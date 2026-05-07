import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import {
  getUnitLanes,
  getUnitTasks,
  getScopedProjects,
  getUnitMembers,
  getUnitTags,
} from "@/lib/queries"
import { PageHeader } from "@/components/shared/page-header"
import { UnitKanban } from "@/components/kanban/unit-kanban"
import { EmptyState } from "@/components/shared/empty-state"
import { LaneDialog } from "@/components/kanban/lane-dialog"

export default async function TasksPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params

  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user || !user.companyId) redirect("/onboarding")

  const canEdit = user.role === "OWNER" || user.role === "ADMIN"

  const currentUser = {
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  }

  const [lanes, tasks, projects, teamMembers, tags] = await Promise.all([
    getUnitLanes(unitId),
    getUnitTasks(unitId),
    getScopedProjects(user.companyId, unitId, user.id, user.role),
    getUnitMembers(unitId),
    getUnitTags(unitId),
  ])

  // Map lanes
  const kanbanLanes = lanes.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
  }))

  const teamMembersMapped = teamMembers.map((m) => ({
    id: m.id,
    name: m.name,
  }))

  const availableTags = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }))

  const dialogProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    phases: p.phases.map((ph) => ({
      id: ph.id,
      name: ph.name,
      SubPhases: ph.SubPhases.map((sp) => ({ id: sp.id, name: sp.name })),
    })),
  }))

  // If no lanes exist, show empty state with a prompt to create the first column
  if (lanes.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <PageHeader
          title="Tâches"
          description="Tableau Kanban de votre unité"
        />
        <EmptyState
          title="Aucune colonne"
          description="Créez votre première colonne pour commencer à organiser vos tâches."
        />
        {canEdit && (
          <div className="-mt-4 flex justify-center">
            <LaneDialog unitId={unitId} />
          </div>
        )}
      </div>
    )
  }

  // Map tasks to Kanban format
  const kanbanTasks = tasks.map((t) => ({
    id: t.id,
    name: t.title,
    column: t.laneId ?? lanes[0]?.id ?? "",
    title: t.title,
    description: t.description,
    laneId: t.laneId,
    laneName: lanes.find((l) => l.id === t.laneId)?.name ?? null,
    complete: t.complete,
    dueDate: t.dueDate,
    startDate: t.startDate ?? null,
    assignedUserId: t.assignedUserId,
    assignedUserName: t.Assigned?.name ?? null,
    assignedUserAvatar: t.Assigned?.avatarUrl ?? null,
    tagIds: t.Tags.map((tag) => tag.id),
    tagNames: t.Tags.map((tag) => tag.name),
    tagColors: t.Tags.map((tag) => tag.color),
    projectId: t.projectId,
    projectName: projects.find((p) => p.id === t.projectId)?.name ?? "",
    phaseName: t.Phase?.name ?? null,
    subPhaseName: t.subPhase?.name ?? null,
    phaseId: t.phaseId ?? null,
    subPhaseId: t.subPhaseId ?? null,
  }))

  // Map projects for filter
  const kanbanProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
  }))

  // Map phases for filter
  const kanbanPhases = projects.flatMap((p) =>
    p.phases.map((ph) => ({
      id: ph.id,
      name: ph.name,
      projectId: p.id,
    }))
  )

  // Map subPhases for filter
  const kanbanSubPhases = projects.flatMap((p) =>
    p.phases.flatMap((ph) =>
      ph.SubPhases.map((sp) => ({
        id: sp.id,
        name: sp.name,
        phaseId: ph.id,
      }))
    )
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader title="Tâches" description="Tableau Kanban de votre unité" />

      <UnitKanban
        lanes={kanbanLanes}
        tasks={kanbanTasks}
        projects={kanbanProjects}
        phases={kanbanPhases}
        subPhases={kanbanSubPhases}
        unitId={unitId}
        companyId={user.companyId}
        canEdit={canEdit}
        teamMembers={teamMembersMapped}
        currentUser={currentUser}
        dialogProjects={dialogProjects}
        availableTags={availableTags}
      />
    </div>
  )
}

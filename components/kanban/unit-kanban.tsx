"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, isPast, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  type DragEndEvent,
} from "@/components/kibo-ui/kanban"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { moveTask, completeTask } from "@/actions/task"
import { cn } from "@/lib/utils"
import { AlertTriangle, Calendar, CheckCircle2, User } from "lucide-react"

import { TaskDetailSheet } from "./task-detail-sheet"

interface KanbanTask {
  id: string
  name: string
  column: string // maps to laneId for kibo-ui
  title: string
  description: string | null
  laneId: string | null
  complete: boolean
  dueDate: Date | null
  assignedUserName: string | null
  assignedUserAvatar: string | null
  tagNames: string[]
  tagColors: string[]
  projectId: string
  projectName: string
  phaseName: string | null
  subPhaseName: string | null
  [key: string]: unknown
}

interface KanbanLane {
  id: string
  name: string
  color: string | null
  [key: string]: unknown
}

interface KanbanProject {
  id: string
  name: string
}

interface KanbanPhase {
  id: string
  name: string
  projectId: string
}

interface KanbanSubPhase {
  id: string
  name: string
  phaseId: string
}

interface UnitKanbanProps {
  lanes: KanbanLane[]
  tasks: KanbanTask[]
  projects: KanbanProject[]
  phases: KanbanPhase[]
  subPhases: KanbanSubPhase[]
  unitId: string
  canEdit: boolean
}

export function UnitKanban({
  lanes,
  tasks,
  projects,
  phases,
  subPhases,
  unitId,
  canEdit,
}: UnitKanbanProps) {
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  const [projectFilter, setProjectFilter] = useState("all")
  const [phaseFilter, setPhaseFilter] = useState("all")
  const [subPhaseFilter, setSubPhaseFilter] = useState("all")

  // Filter tasks based on cascading filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (projectFilter !== "all") {
      result = result.filter((t) => t.projectId === projectFilter)
    }
    if (phaseFilter !== "all") {
      const phase = phases.find((p) => p.id === phaseFilter)
      if (phase) {
        result = result.filter((t) => t.phaseName === phase.name)
      }
    }
    if (subPhaseFilter !== "all") {
      const subPhase = subPhases.find((sp) => sp.id === subPhaseFilter)
      if (subPhase) {
        result = result.filter((t) => t.subPhaseName === subPhase.name)
      }
    }

    return result
  }, [tasks, projectFilter, phaseFilter, subPhaseFilter, phases, subPhases])

  // Available phases based on project filter
  const availablePhases = useMemo(() => {
    if (projectFilter === "all") return phases
    return phases.filter((p) => p.projectId === projectFilter)
  }, [phases, projectFilter])

  // Available sub-phases based on phase filter
  const availableSubPhases = useMemo(() => {
    if (phaseFilter === "all") return subPhases
    return subPhases.filter((sp) => sp.phaseId === phaseFilter)
  }, [subPhases, phaseFilter])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || !canEdit) return

      const taskId = active.id as string
      const overId = over.id as string

      // Check if dropped on a lane (column)
      const targetLane = lanes.find((l) => l.id === overId)
      if (!targetLane) return

      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.laneId === targetLane.id) return

      const result = await moveTask(taskId, targetLane.id, 0)
      if (result.success) {
        toast.success("Tâche déplacée")
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors du déplacement")
      }
    },
    [canEdit, lanes, tasks, router]
  )

  const handleComplete = useCallback(
    async (taskId: string) => {
      const result = await completeTask(taskId)
      if (result.success) {
        toast.success("Tâche mise à jour")
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    },
    [router]
  )

  const resetFilters = () => {
    setProjectFilter("all")
    setPhaseFilter("all")
    setSubPhaseFilter("all")
  }

  const hasActiveFilters =
    projectFilter !== "all" || phaseFilter !== "all" || subPhaseFilter !== "all"

  return (
    <div className="flex flex-col gap-4">
      {/* Cascading Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={projectFilter}
          onValueChange={(v) => {
            setProjectFilter(v)
            setPhaseFilter("all")
            setSubPhaseFilter("all")
          }}
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={phaseFilter}
          onValueChange={(v) => {
            setPhaseFilter(v)
            setSubPhaseFilter("all")
          }}
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Toutes les phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les phases</SelectItem>
            {availablePhases.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subPhaseFilter} onValueChange={setSubPhaseFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Toutes les sous-phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sous-phases</SelectItem>
            {availableSubPhases.map((sp) => (
              <SelectItem key={sp.id} value={sp.id}>
                {sp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <KanbanProvider
          id={`kanban-${unitId}`}
          data={filteredTasks}
          columns={lanes}
          onDragEnd={handleDragEnd}
          className="min-w-max"
        >
          {(column) => {
            const colName = column.name as string
            return (
              <KanbanBoard key={column.id} id={column.id}>
                <KanbanHeader className="flex items-center justify-between">
                  <span>{colName}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {filteredTasks.filter((t) => t.column === column.id).length}
                  </Badge>
                </KanbanHeader>
                <KanbanCards id={column.id}>
                  {(item) => {
                    const task = item as KanbanTask
                    const dueDate = task.dueDate as Date | null
                    const isOverdue =
                      dueDate &&
                      isPast(dueDate) &&
                      !task.complete &&
                      !isToday(dueDate)
                    return (
                      <KanbanCard
                        key={task.id}
                        id={task.id}
                        name={task.name}
                        column={task.column}
                        onClick={() => setSelectedTask(task)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-2">
                          <p className="text-sm leading-snug font-medium">
                            {task.title}
                          </p>

                          {/* Tags */}
                          {task.tagNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tagNames.map((tag: string, i: number) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px]"
                                  style={{
                                    backgroundColor: task.tagColors[i] + "20",
                                    color: task.tagColors[i],
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Footer: assignee + due date */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="size-3" />
                              <span className="max-w-[80px] truncate">
                                {task.assignedUserName ?? "Non assigné"}
                              </span>
                            </div>
                            {dueDate && (
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  isOverdue
                                    ? "font-medium text-destructive"
                                    : "text-muted-foreground"
                                )}
                              >
                                <Calendar className="size-3" />
                                <span>
                                  {format(dueDate, "d MMM", {
                                    locale: fr,
                                  })}
                                </span>
                                {isOverdue && (
                                  <AlertTriangle className="size-3 text-destructive" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Complete toggle */}
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleComplete(task.id)
                              }}
                              className={cn(
                                "flex items-center gap-1.5 text-xs transition-colors",
                                task.complete
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <CheckCircle2 className="size-3.5" />
                              {task.complete ? "Terminée" : "Marquer terminée"}
                            </button>
                          )}
                        </div>
                      </KanbanCard>
                    )
                  }}
                </KanbanCards>
              </KanbanBoard>
            )
          }}
        </KanbanProvider>
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        canEdit={canEdit}
      />
    </div>
  )
}

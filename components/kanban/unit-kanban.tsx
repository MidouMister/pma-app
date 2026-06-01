"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  Filter,
  FolderKanban,
  Layers,
  LayoutGrid,
  List,
  ListTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  KanbanProvider,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  type DragEndEvent,
} from "@/components/kibo-ui/kanban"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { completeTask, deleteTask, moveTask } from "@/actions/task"
import { deleteLane } from "@/actions/lane"

import { TaskCard } from "./task-card"
import { LaneDialog } from "./lane-dialog"
import { TaskDetailModal } from "./task-detail-modal"
import { TaskTable } from "./task-table"
import { TaskDialog } from "./task-dialog"

interface KanbanTask {
  id: string
  name: string
  column: string
  title: string
  description: string | null
  laneId: string | null
  complete: boolean
  dueDate: Date | null
  startDate: Date | null
  assignedUserId: string | null
  assignedUserName: string | null
  assignedUserAvatar: string | null
  tagIds: string[]
  tagNames: string[]
  tagColors: string[]
  commentCount: number
  order: number
  projectId: string
  projectName: string
  phaseName: string | null
  subPhaseName: string | null
  phaseId: string | null
  subPhaseId: string | null
}

interface KanbanLane {
  id: string
  name: string
  color: string | null
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

interface TeamMember {
  id: string
  name: string
}

interface CurrentUser {
  id: string
  name: string | null
  avatarUrl: string | null
}

interface UnitKanbanProps {
  lanes: KanbanLane[]
  tasks: KanbanTask[]
  projects: KanbanProject[]
  phases: KanbanPhase[]
  subPhases: KanbanSubPhase[]
  unitId: string
  companyId: string
  canEdit: boolean
  teamMembers: TeamMember[]
  currentUser: CurrentUser
  dialogProjects: Array<{
    id: string
    name: string
    phases: Array<{
      id: string
      name: string
      SubPhases: Array<{ id: string; name: string }>
    }>
  }>
  availableTags: Array<{ id: string; name: string; color: string }>
  defaultProjectFilter?: string
}

export function UnitKanban({
  lanes,
  tasks,
  projects,
  phases,
  subPhases,
  unitId,
  companyId,
  canEdit,
  teamMembers,
  currentUser,
  dialogProjects,
  availableTags,
  defaultProjectFilter,
}: UnitKanbanProps) {
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  const [projectFilter, setProjectFilter] = useState(
    defaultProjectFilter ?? "all"
  )
  const [phaseFilter, setPhaseFilter] = useState("all")
  const [subPhaseFilter, setSubPhaseFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDialogLaneId, setTaskDialogLaneId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)
  const [laneDialogOpen, setLaneDialogOpen] = useState(false)
  const [editingLane, setEditingLane] = useState<KanbanLane | null>(null)
  const [projectComboboxOpen, setProjectComboboxOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

  const filteredTasks = useMemo(() => {
    let result = [...tasks]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q))
    }
    if (projectFilter !== "all") {
      result = result.filter((t) => t.projectId === projectFilter)
    }
    if (phaseFilter !== "all") {
      result = result.filter((t) => t.phaseId === phaseFilter)
    }
    if (subPhaseFilter !== "all") {
      result = result.filter((t) => t.subPhaseId === subPhaseFilter)
    }
    return result
  }, [tasks, projectFilter, phaseFilter, subPhaseFilter, searchQuery])

  const tableTasks = useMemo(
    () =>
      filteredTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        complete: t.complete,
        laneId: t.laneId,
        laneName: lanes.find((l) => l.id === t.laneId)?.name ?? null,
        assignedUserId: t.assignedUserId,
        assignedUserName: t.assignedUserName,
        assignedUserAvatar: t.assignedUserAvatar,
        dueDate: t.dueDate,
        startDate: t.startDate,
        projectId: t.projectId,
        projectName: t.projectName,
        phaseName: t.phaseName,
        subPhaseName: t.subPhaseName,
        tagNames: t.tagNames,
        tagColors: t.tagColors,
        commentCount: t.commentCount,
      })),
    [filteredTasks, lanes]
  )

  const availablePhases = useMemo(() => {
    if (projectFilter === "all") return phases
    return phases.filter((p) => p.projectId === projectFilter)
  }, [phases, projectFilter])

  const availableSubPhases = useMemo(() => {
    if (phaseFilter === "all") return subPhases
    return subPhases.filter((sp) => sp.phaseId === phaseFilter)
  }, [subPhases, phaseFilter])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const taskId = active.id as string
      const draggedTask = tasks.find((t) => t.id === taskId)
      if (!draggedTask) return

      // Allow OWNER/ADMIN (canEdit) or USER dragging their own assigned task
      const canDrag =
        canEdit ||
        (currentUser.id && draggedTask.assignedUserId === currentUser.id)
      if (!canDrag) return

      // Resolve the target lane: over.id may be a lane ID or a task ID
      let targetLane = lanes.find((l) => l.id === over.id)
      if (!targetLane) {
        // Dropped on a task card — find which lane that task belongs to
        const overTask = tasks.find((t) => t.id === over.id)
        if (overTask?.laneId) {
          targetLane = lanes.find((l) => l.id === overTask.laneId)
        }
      }
      if (!targetLane) return

      // Skip if the task is already in the target lane
      if (draggedTask.laneId === targetLane.id) return

      // Calculate dynamic order: place at the end of the target lane
      const tasksInTargetLane = tasks.filter((t) => t.laneId === targetLane!.id)
      const maxOrder =
        tasksInTargetLane.length > 0
          ? Math.max(...tasksInTargetLane.map((t) => t.order ?? 0))
          : 0
      const newOrder = maxOrder + 1

      const result = await moveTask(taskId, targetLane.id, newOrder)
      if (result.success) {
        toast.success("Tâche déplacée")
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors du déplacement")
      }
    },
    [canEdit, currentUser.id, lanes, tasks, router]
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

  const handleEdit = useCallback((task: KanbanTask) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (taskId: string) => {
      const result = await deleteTask(taskId)
      if (result.success) {
        toast.success("Tâche supprimée")
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression")
      }
    },
    [router]
  )

  const handleDetailEdit = useCallback(() => {
    if (!selectedTask) return
    setEditingTask(selectedTask)
    setTaskDialogOpen(true)
    setSelectedTask(null)
  }, [selectedTask])

  const resetFilters = () => {
    if (!defaultProjectFilter) setProjectFilter("all")
    setPhaseFilter("all")
    setSubPhaseFilter("all")
    setSearchQuery("")
  }

  const filterCount = [
    ...(defaultProjectFilter ? [] : [projectFilter]),
    phaseFilter,
    subPhaseFilter,
    searchQuery,
  ].filter((f) => f !== "all" && f !== "").length

  const hasActiveFilters = filterCount > 0

  const openLaneEdit = (lane: KanbanLane) => {
    setEditingLane(lane)
    setLaneDialogOpen(true)
  }

  const handleDeleteLane = async (laneId: string) => {
    const result = await deleteLane(laneId)
    if (result.success) {
      toast.success("Colonne supprimée")
      router.refresh()
    } else {
      toast.error(result.error ?? "Erreur")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
        {/* Search — always visible */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-[220px] rounded-lg pl-9"
            aria-label="Rechercher une tâche"
          />
        </div>

        {/* Desktop selects — hidden on mobile */}
        <div className="hidden items-center gap-2 lg:flex">
          {!defaultProjectFilter && (
            <>
              {/* Project Combobox — searchable, handles long names */}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Popover
                    open={projectComboboxOpen}
                    onOpenChange={setProjectComboboxOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={projectComboboxOpen}
                        aria-label="Filtrer par projet"
                        className="h-9 w-[200px] justify-between gap-1 px-3 font-normal hover:bg-muted/40"
                      >
                        <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left text-xs">
                          {projectFilter === "all"
                            ? "Tous les projets"
                            : (projects.find((p) => p.id === projectFilter)
                                ?.name ?? "Projet")}
                        </span>
                        <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un projet..." />
                        <CommandList>
                          <CommandEmpty>Aucun projet trouvé</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="Tous les projets"
                              onSelect={() => {
                                setProjectFilter("all")
                                setPhaseFilter("all")
                                setSubPhaseFilter("all")
                                setProjectComboboxOpen(false)
                              }}
                              data-checked={projectFilter === "all"}
                            >
                              Tous les projets
                            </CommandItem>
                            {projects.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  setProjectFilter(p.id)
                                  setPhaseFilter("all")
                                  setSubPhaseFilter("all")
                                  setProjectComboboxOpen(false)
                                }}
                                data-checked={projectFilter === p.id}
                              >
                                <span className="wrap-break-word whitespace-normal">
                                  {p.name}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                {projectFilter !== "all" && (
                  <TooltipContent side="bottom" className="max-w-[400px]">
                    {projects.find((p) => p.id === projectFilter)?.name ?? ""}
                  </TooltipContent>
                )}
              </Tooltip>
            </>
          )}

          <div className="relative">
            <Layers className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Select
              value={phaseFilter}
              onValueChange={(v) => {
                setPhaseFilter(v)
                setSubPhaseFilter("all")
              }}
            >
              <SelectTrigger className="h-9 w-[200px] border-0 bg-transparent pl-9 hover:bg-muted/40">
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
          </div>

          <div className="relative">
            <ListTree className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Select value={subPhaseFilter} onValueChange={setSubPhaseFilter}>
              <SelectTrigger className="h-9 w-[200px] border-0 bg-transparent pl-9 hover:bg-muted/40">
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
          </div>
        </div>

        {/* Mobile filter popover */}
        <div className="lg:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                aria-label="Ouvrir les filtres"
              >
                <Filter className="size-3.5" />
                Filtres
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 min-w-4 px-1 text-[10px]"
                  >
                    {filterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-4">
              <div className="flex flex-col gap-3">
                {!defaultProjectFilter && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Projet
                    </Label>
                    <Select
                      value={projectFilter}
                      onValueChange={(v) => {
                        setProjectFilter(v)
                        setPhaseFilter("all")
                        setSubPhaseFilter("all")
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Tous les projets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les projets</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="max-w-[220px] truncate">
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Phase</Label>
                  <Select
                    value={phaseFilter}
                    onValueChange={(v) => {
                      setPhaseFilter(v)
                      setSubPhaseFilter("all")
                    }}
                  >
                    <SelectTrigger className="mt-1 h-9">
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
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Sous-phase
                  </Label>
                  <Select
                    value={subPhaseFilter}
                    onValueChange={setSubPhaseFilter}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Toutes les sous-phases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Toutes les sous-phases
                      </SelectItem>
                      {availableSubPhases.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filters + actions — ml-auto pushes to right */}
        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <Badge
                variant="secondary"
                className="h-6 gap-1 text-xs"
                aria-live="polite"
              >
                <Filter className="size-3" />
                {filterCount} filtre{filterCount > 1 ? "s" : ""}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 gap-1 text-xs"
                aria-label="Réinitialiser les filtres"
              >
                <X className="size-3" />
                Réinitialiser
              </Button>
            </>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-7 px-2"
              aria-label="Vue Kanban"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-7 px-2"
              aria-label="Vue tableau"
            >
              <List className="size-3.5" />
            </Button>
          </div>

          {canEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingLane(null)
                setLaneDialogOpen(true)
              }}
              className="h-9 shadow-sm"
              aria-label="Ajouter une colonne"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Colonne</span>
            </Button>
          )}
        </div>
      </div>

      {viewMode === "kanban" && (
        <div className="flex grow overflow-x-auto overflow-y-hidden pb-4">
          <KanbanProvider
            id={`kanban-${unitId}`}
            data={filteredTasks as (KanbanTask & Record<string, unknown>)[]}
            columns={lanes as (KanbanLane & Record<string, unknown>)[]}
            onDragEnd={handleDragEnd}
            className="flex h-full w-full gap-2 px-4"
          >
            {(column) => {
              const lane = column as unknown as KanbanLane
              const laneTasks = filteredTasks.filter(
                (t) => t.laneId === lane.id
              )

              return (
                <KanbanBoard
                  key={lane.id}
                  id={lane.id}
                  className="group w-[300px] shrink-0 overflow-visible rounded-xl border-2"
                >
                  <KanbanHeader className="flex items-center justify-between border-b bg-transparent px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: lane.color ?? "#94a3b8" }}
                      />
                      <h3 className="text-sm font-semibold tracking-tight">
                        {lane.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1 text-[10px]"
                      >
                        {laneTasks.length}
                      </Badge>
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Options de colonne"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openLaneEdit(lane)}>
                            <Pencil className="mr-2 size-3.5" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteLane(lane.id)}
                          >
                            <Trash2 className="mr-2 size-3.5" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </KanbanHeader>

                  <KanbanCards id={lane.id} className="mt-2 space-y-2">
                    {(item) => {
                      const task = item as unknown as KanbanTask
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          canEdit={canEdit}
                          onComplete={handleComplete}
                          onClick={() => setSelectedTask(task)}
                          onEdit={canEdit ? () => handleEdit(task) : undefined}
                          onDelete={
                            canEdit ? () => handleDelete(task.id) : undefined
                          }
                        />
                      )
                    }}
                  </KanbanCards>

                  {canEdit && (
                    <div className="p-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-xs shadow-sm"
                        onClick={() => {
                          setTaskDialogLaneId(lane.id)
                          setTaskDialogOpen(true)
                        }}
                        aria-label="Ajouter une tâche dans cette colonne"
                      >
                        <Plus className="size-4" />
                        <span>Ajouter une tâche</span>
                      </Button>
                    </div>
                  )}
                </KanbanBoard>
              )
            }}
          </KanbanProvider>
        </div>
      )}

      {viewMode === "table" && (
        <TaskTable
          tasks={tableTasks}
          lanes={lanes}
          canEdit={canEdit}
          onEdit={
            canEdit
              ? (task) => {
                  const t = filteredTasks.find((f) => f.id === task.id)
                  if (t) handleEdit(t)
                }
              : undefined
          }
          onDelete={canEdit ? handleDelete : undefined}
          onComplete={canEdit ? handleComplete : undefined}
          onRowClick={(task) => {
            const fullTask = filteredTasks.find((t) => t.id === task.id)
            if (fullTask) setSelectedTask(fullTask)
          }}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={
          selectedTask
            ? {
                id: selectedTask.id,
                title: selectedTask.title,
                description: selectedTask.description,
                complete: selectedTask.complete,
                laneId: selectedTask.laneId,
                laneName:
                  lanes.find((l) => l.id === selectedTask.laneId)?.name ?? null,
                assignedUserId: selectedTask.assignedUserId ?? null,
                assignedUserName: selectedTask.assignedUserName,
                assignedUserAvatar: selectedTask.assignedUserAvatar,
                dueDate: selectedTask.dueDate,
                startDate: selectedTask.startDate,
                projectId: selectedTask.projectId,
                projectName: selectedTask.projectName,
                phaseName: selectedTask.phaseName,
                subPhaseName: selectedTask.subPhaseName,
                tagNames: selectedTask.tagNames,
                tagColors: selectedTask.tagColors,
                commentCount: selectedTask.commentCount,
              }
            : null
        }
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        canEdit={canEdit}
        lanes={lanes}
        currentUser={currentUser}
        onEdit={canEdit ? handleDetailEdit : undefined}
        onTaskUpdated={() => router.refresh()}
      />

      {/* Lane Dialog (for context menu edit) */}
      {canEdit && (
        <LaneDialog
          key={editingLane?.id ?? "create"}
          unitId={unitId}
          lane={
            editingLane
              ? {
                  id: editingLane.id,
                  name: editingLane.name as string,
                  color: editingLane.color,
                }
              : undefined
          }
          open={laneDialogOpen}
          onOpenChange={(v) => {
            setLaneDialogOpen(v)
            if (!v) setEditingLane(null)
          }}
          onSuccess={() => {
            setEditingLane(null)
            setLaneDialogOpen(false)
            router.refresh()
          }}
        />
      )}

      {/* Task Dialog (for quick add and edit) */}
      {canEdit && (
        <TaskDialog
          key={editingTask?.id ?? `create-${taskDialogLaneId ?? "none"}`}
          task={
            editingTask
              ? {
                  id: editingTask.id,
                  title: editingTask.title,
                  description: editingTask.description,
                  projectId: editingTask.projectId,
                  phaseId: editingTask.phaseId,
                  subPhaseId: editingTask.subPhaseId,
                  laneId: editingTask.laneId,
                  assignedUserId: editingTask.assignedUserId,
                  dueDate: editingTask.dueDate,
                  startDate: editingTask.startDate,
                  Tags: editingTask.tagIds.map((id, i) => ({
                    id,
                    name: editingTask.tagNames[i] ?? "",
                    color: editingTask.tagColors[i] ?? "#6b7280",
                  })),
                }
              : undefined
          }
          unitId={unitId}
          companyId={companyId}
          projects={dialogProjects}
          lanes={lanes}
          teamMembers={teamMembers}
          availableTags={availableTags}
          open={taskDialogOpen}
          onOpenChange={(v) => {
            setTaskDialogOpen(v)
            if (!v) {
              setTaskDialogLaneId(null)
              setEditingTask(null)
            }
          }}
          laneId={taskDialogLaneId ?? undefined}
          defaultProjectId={
            !editingTask && projectFilter !== "all" ? projectFilter : undefined
          }
          defaultPhaseId={
            !editingTask && phaseFilter !== "all" ? phaseFilter : undefined
          }
          defaultSubPhaseId={
            !editingTask && subPhaseFilter !== "all"
              ? subPhaseFilter
              : undefined
          }
          onSuccess={() => {
            setTaskDialogOpen(false)
            setTaskDialogLaneId(null)
            setEditingTask(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

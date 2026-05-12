"use client"

import {
  useCallback,
  useState,
  useTransition,
  useMemo,
  useOptimistic,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updatePhase, deletePhase } from "@/actions/phase"
import { updateSubPhase, deleteSubPhase } from "@/actions/subphase"
import { deleteGanttMarker } from "@/actions/gantt-marker"
import {
  GanttProvider,
  GanttSidebar,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureItem,
  GanttMarker,
  GanttToday,
  GanttContext,
  GanttCreateMarkerTrigger,
  type GanttFeature,
  type GanttStatus,
  type Range,
} from "@/components/kibo-ui/gantt"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { PhaseDialog } from "@/components/project/phase-dialog"
import { SubPhaseDialog } from "@/components/project/subphase-dialog"
import { GanttMarkerDialog } from "@/components/gantt/gantt-marker-dialog"
import {
  ChevronRight,
  ChevronDown,
  ListTodo,
  FolderKanban,
  Pencil,
  Trash2,
  Eye,
  Plus,
  Search,
  RotateCcw,
  Layers,
  Minus,
  Flag,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"

const STATUS_MAP: Record<string, GanttStatus> = {
  New: {
    id: "new",
    name: "Nouveau",
    color: "hsl(239 84% 67%)",
  },
  InProgress: {
    id: "in-progress",
    name: "En cours",
    color: "hsl(160 84% 39%)",
  },
  Pause: {
    id: "pause",
    name: "En pause",
    color: "hsl(38 92% 50%)",
  },
  Complete: {
    id: "complete",
    name: "Terminé",
    color: "hsl(215 20% 65%)",
  },
  SubPhaseTodo: {
    id: "sub-todo",
    name: "À faire",
    color: "hsl(255 80% 70%)", // Distinct Violet/Indigo
  },
  SubPhaseDone: {
    id: "sub-done",
    name: "Terminé",
    color: "hsl(180 80% 45%)", // Distinct Cyan
  },
}

interface PhaseData {
  id: string
  name: string
  code: string
  startDate: Date | null
  endDate: Date | null
  status: string
  progress: number
  montantHT: number
  duration: number | null
  obs: string | null
  SubPhases: {
    id: string
    name: string
    code: string
    startDate: Date | null
    endDate: Date | null
    status: string
    progress: number
  }[]
}

interface MarkerData {
  id: string
  label: string
  date: Date
  className?: string
}

interface ProjectGanttProps {
  phases: PhaseData[]
  markers: MarkerData[]
  canEdit: boolean
  projectId: string
  unitId: string
  projectMontantHT: number
  projectODS: Date | null
}

interface GanttPhaseFeature extends GanttFeature {
  code: string
  montantHT: number
  progress: number
  isSubPhase: boolean
  parentPhaseId: string | null
  subPhaseCount: number
}

export function ProjectGantt({
  phases,
  markers,
  canEdit,
  projectId,

  projectMontantHT,
  projectODS,
}: ProjectGanttProps) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [range, setRange] = useState<Range>("monthly")
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(100)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Dialog states
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<{
    id: string
    name: string
    code: string
    montantHT: number
    startDate: Date | null
    endDate: Date | null
    status: string
    obs: string | null
    progress: number
  } | null>(null)

  const [subPhaseDialogOpen, setSubPhaseDialogOpen] = useState(false)
  const [editingSubPhase, setEditingSubPhase] = useState<{
    id: string
    name: string
    code: string
    status: string
    progress: number
    startDate: Date | null
    endDate: Date | null
  } | null>(null)
  const [subPhaseParentId, setSubPhaseParentId] = useState<string | null>(null)

  const [markerDialogOpen, setMarkerDialogOpen] = useState(false)
  const [editingMarker, setEditingMarker] = useState<{
    id: string
    label: string
    date: Date
    className?: string | null
  } | null>(null)

  // Delete confirmation state
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null)
  const [deletingSubPhaseId, setDeletingSubPhaseId] = useState<string | null>(
    null
  )
  const [deletingMarkerId, setDeletingMarkerId] = useState<string | null>(null)

  const togglePhaseExpansion = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }, [])

  const ganttFeatures: GanttPhaseFeature[] = useMemo(() => {
    const items: GanttPhaseFeature[] = []

    for (const phase of phases) {
      if (!phase.startDate || !phase.endDate) continue

      const status = STATUS_MAP[phase.status] ?? STATUS_MAP.New

      // Phase row
      items.push({
        id: phase.id,
        name: phase.name,
        startAt: phase.startDate,
        endAt: phase.endDate,
        status,
        code: phase.code,
        montantHT: phase.montantHT,
        progress: phase.progress,
        isSubPhase: false,
        parentPhaseId: null,
        subPhaseCount: phase.SubPhases.length,
      })

      // SubPhase rows (only if parent is expanded)
      if (expandedPhases.has(phase.id)) {
        for (const sub of phase.SubPhases) {
          if (!sub.startDate || !sub.endDate) continue

          const subStatus =
            sub.status === "COMPLETED"
              ? STATUS_MAP.SubPhaseDone
              : STATUS_MAP.SubPhaseTodo

          items.push({
            id: sub.id,
            name: sub.name,
            startAt: sub.startDate,
            endAt: sub.endDate,
            status: subStatus,
            code: sub.code,
            montantHT: 0,
            progress: sub.progress,
            isSubPhase: true,
            parentPhaseId: phase.id,
            subPhaseCount: 0,
          })
        }
      }
    }

    return items
  }, [phases, expandedPhases])

  // Optimistic updates
  const [optimisticFeatures, addOptimisticFeature] = useOptimistic(
    ganttFeatures,
    (
      state: GanttPhaseFeature[],
      action:
        | { type: "move"; id: string; startAt: Date; endAt: Date | null }
        | { type: "toggleStatus"; id: string; status: string }
    ) => {
      return state.map((f) => {
        if (f.id !== action.id) return f
        if (action.type === "move") {
          return {
            ...f,
            startAt: action.startAt,
            endAt: action.endAt ?? f.endAt,
          }
        }
        if (action.type === "toggleStatus") {
          const newStatusKey =
            action.status === "COMPLETED" ? "Complete" : "New"
          return {
            ...f,
            status: STATUS_MAP[newStatusKey] ?? STATUS_MAP.New,
          }
        }
        return f
      })
    }
  )

  // Filtered features for search + status filter
  const filteredFeatures = useMemo(() => {
    let items = optimisticFeatures

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      items = items.filter((f) => f.status.id === statusFilter)
    }

    return items
  }, [optimisticFeatures, searchQuery, statusFilter])

  // Handle drag-to-reschedule for both phases and subphases
  const handleMove = (id: string, startAt: Date, endAt: Date | null) => {
    if (!canEdit) return

    const isSubPhase = phases.some((p) =>
      p.SubPhases.some((sp) => sp.id === id)
    )

    startTransition(async () => {
      // Apply optimistic update inside transition (required by useOptimistic)
      addOptimisticFeature({ type: "move", id, startAt, endAt })

      if (isSubPhase) {
        const result = await updateSubPhase({
          id,
          startDate: startAt,
          endDate: endAt,
        })
        if (result.success) {
          toast.success("Sous-phase mise à jour avec succès")
          router.refresh()
        } else {
          toast.error(result.error ?? "Erreur lors de la mise à jour")
          router.refresh()
        }
      } else {
        const result = await updatePhase({
          id,
          startDate: startAt,
          endDate: endAt,
        })
        if (result.success) {
          toast.success("Phase mise à jour avec succès")
          router.refresh()
        } else {
          toast.error(result.error ?? "Erreur lors de la mise à jour")
          router.refresh()
        }
      }
    })
  }

  const handleSubPhaseToggle = (subPhaseId: string, currentStatus: string) => {
    if (!canEdit) return

    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED"

    startTransition(async () => {
      // Apply optimistic update inside transition (required by useOptimistic)
      addOptimisticFeature({
        type: "toggleStatus",
        id: subPhaseId,
        status: newStatus,
      })

      const result = await updateSubPhase({
        id: subPhaseId,
        status: newStatus,
      })
      if (result.success) {
        toast.success(
          newStatus === "COMPLETED"
            ? "Sous-phase marquée comme terminée"
            : "Sous-phase rouverte"
        )
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour")
        router.refresh()
      }
    })
  }

  // Delete handlers
  const handleDeletePhase = async () => {
    if (!deletingPhaseId) return
    const result = await deletePhase(deletingPhaseId)
    if (result.success) {
      toast.success("Phase supprimée")
      setDeletingPhaseId(null)
      router.refresh()
    } else {
      toast.error(result.error ?? "Erreur lors de la suppression")
      setDeletingPhaseId(null)
    }
  }

  const handleDeleteSubPhase = async () => {
    if (!deletingSubPhaseId) return
    const result = await deleteSubPhase(deletingSubPhaseId)
    if (result.success) {
      toast.success("Sous-phase supprimée")
      setDeletingSubPhaseId(null)
      router.refresh()
    } else {
      toast.error(result.error ?? "Erreur lors de la suppression")
      setDeletingSubPhaseId(null)
    }
  }

  const handleDeleteMarker = async () => {
    if (!deletingMarkerId) return
    const result = await deleteGanttMarker(deletingMarkerId)
    if (result.success) {
      toast.success("Marqueur supprimé")
      setDeletingMarkerId(null)
      router.refresh()
    } else {
      toast.error(result.error ?? "Erreur lors de la suppression")
      setDeletingMarkerId(null)
    }
  }

  const ranges: { key: Range; label: string }[] = [
    { key: "daily", label: "Jour" },
    { key: "monthly", label: "Mois" },
    { key: "quarterly", label: "Trimestre" },
  ]

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(200, prev + 10))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(50, prev - 10))
  }, [])

  // Counts
  const phaseCount = optimisticFeatures.filter((f) => !f.isSubPhase).length
  const subPhaseCount = optimisticFeatures.filter((f) => f.isSubPhase).length
  const markerCount = markers.length
  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== null

  // Compute sum of existing phase montants for budget display
  const currentPhasesSum = useMemo(
    () => phases.reduce((sum, p) => sum + p.montantHT, 0),
    [phases]
  )

  // Click-on-timeline — guide user to use context menu
  const handleGanttAddItem = useCallback(
    (_date: Date) => {
      if (!canEdit) return
      toast.message("Ajouter via le menu contextuel", {
        description:
          "Faites un clic droit sur une phase dans le diagramme, puis sélectionnez 'Ajouter une sous-phase'.",
      })
    },
    [canEdit]
  )

  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden">
      {/* Toolbar with gradient card */}
      <div className="rounded-lg border bg-linear-to-r from-card to-muted/30 p-3">
        <div className="flex w-full max-w-full flex-col gap-3 overflow-x-hidden">
          {/* Row 1: Search + Filter + Counts */}
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter ?? "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="in-progress">En cours</SelectItem>
                <SelectItem value="pause">En pause</SelectItem>
                <SelectItem value="complete">Terminé</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter(null)
                }}
                className="h-8 text-xs"
              >
                <RotateCcw className="mr-1 size-3" />
                Effacer
              </Button>
            )}

            {/* Count badges */}
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 tabular-nums">
                <Layers className="size-3" />
                {phaseCount} phases
              </span>
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 tabular-nums">
                <ListTodo className="size-3" />
                {subPhaseCount} s/phases
              </span>
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 tabular-nums">
                <Flag className="size-3" />
                {markerCount} marq.
              </span>
            </div>

            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingPhase(null)
                  setPhaseDialogOpen(true)
                }}
                className="ml-auto h-8 gap-2"
              >
                <Plus className="size-4" />
                Ajouter une phase
              </Button>
            )}
          </div>

          {/* Row 2: Range toggle + Zoom controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              {ranges.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={range === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRange(key)}
                  className="h-7 text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <Minus className="size-3" />
              </Button>
              <span className="min-w-12 text-center text-xs font-medium text-muted-foreground tabular-nums">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state when no phases */}
      {phases.filter((p) => p.startDate && p.endDate).length === 0 && (
        <div className="overflow-hidden rounded-lg border">
          <EmptyState
            title="Aucune phase dans ce projet"
            description="Ajoutez des phases au projet pour visualiser le diagramme de Gantt. Les phases apparaîtront ici avec leurs sous-phases."
            icon={<Layers className="size-6" />}
            action={
              canEdit
                ? {
                    label: "Ajouter une phase",
                    onClick: () => {
                      setEditingPhase(null)
                      setPhaseDialogOpen(true)
                    },
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Gantt Chart (only show when phases exist) */}
      {phases.filter((p) => p.startDate && p.endDate).length > 0 && (
        <div
          className="w-full overflow-hidden rounded-xl border bg-card shadow-sm"
          style={{ height: "calc(100vh - 280px)" }}
        >
          <GanttProvider
            range={range}
            zoom={zoom}
            onAddItem={canEdit ? handleGanttAddItem : undefined}
          >
            {/* Sidebar */}
            <GanttSidebar>
              <GanttContext.Consumer>
                {(ganttContext) => (
                  <div className="divide-y divide-border/50">
                    {filteredFeatures
                      .filter((f) => !f.isSubPhase)
                      .map((feature) => {
                        const phase = phases.find((p) => p.id === feature.id)
                        const isExpanded = expandedPhases.has(feature.id)
                        const hasSubPhases = feature.subPhaseCount > 0

                        return (
                          <div key={feature.id}>
                            {/* Phase row */}
                            <div
                              role="button"
                              tabIndex={0}
                              className="relative flex cursor-pointer items-center gap-2 p-2.5 text-xs hover:bg-secondary"
                              style={{ height: "var(--gantt-row-height)" }}
                              onClick={() => {
                                ganttContext.scrollToFeature?.(feature)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  ganttContext.scrollToFeature?.(feature)
                                }
                              }}
                            >
                              {/* Expand/collapse chevron */}
                              {hasSubPhases && (
                                <button
                                  type="button"
                                  className="shrink-0 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    togglePhaseExpansion(feature.id)
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="size-3.5" />
                                  ) : (
                                    <ChevronRight className="size-3.5" />
                                  )}
                                </button>
                              )}
                              {!hasSubPhases && <span className="w-3.5" />}

                              {/* Status dot */}
                              <div
                                className="pointer-events-none h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: feature.status.color,
                                }}
                              />

                              {/* Phase name */}
                              <p className="pointer-events-none flex-1 truncate text-left font-medium">
                                {feature.name}
                              </p>

                              {/* Duration badge */}
                              {phase?.duration != null && (
                                <span className="pointer-events-none shrink-0 text-[10px] text-muted-foreground tabular-nums">
                                  {phase.duration} j
                                </span>
                              )}

                              {/* Subphase count badge */}
                              {hasSubPhases && (
                                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                                  {feature.subPhaseCount}
                                </span>
                              )}
                            </div>

                            {/* SubPhase rows (when expanded) */}
                            {isExpanded &&
                              filteredFeatures
                                .filter(
                                  (sf) =>
                                    sf.isSubPhase &&
                                    sf.parentPhaseId === feature.id
                                )
                                .map((subFeature) => {
                                  const subPhase = phase?.SubPhases.find(
                                    (sp) => sp.id === subFeature.id
                                  )
                                  return (
                                    <div
                                      key={subFeature.id}
                                      role="button"
                                      tabIndex={0}
                                      className="relative flex cursor-pointer items-center gap-2 p-2.5 pl-8 text-xs hover:bg-secondary"
                                      style={{
                                        height: "var(--gantt-row-height)",
                                      }}
                                      onClick={() => {
                                        ganttContext.scrollToFeature?.(
                                          subFeature
                                        )
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          ganttContext.scrollToFeature?.(
                                            subFeature
                                          )
                                        }
                                      }}
                                    >
                                      {/* Checkbox for COMPLETED/TODO toggle */}
                                      <Checkbox
                                        checked={
                                          subFeature.status.id === "complete"
                                        }
                                        onCheckedChange={() => {
                                          handleSubPhaseToggle(
                                            subFeature.id,
                                            subPhase?.status ?? "TODO"
                                          )
                                        }}
                                        className="shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      />

                                      {/* Subphase name */}
                                      <p
                                        className={cn(
                                          "pointer-events-none flex-1 truncate text-left",
                                          subFeature.status.id === "sub-done" &&
                                            "text-muted-foreground line-through"
                                        )}
                                      >
                                        {subFeature.name}
                                      </p>

                                      {/* Subphase duration */}
                                      {subPhase?.startDate &&
                                        subPhase?.endDate && (
                                          <span className="pointer-events-none shrink-0 text-[10px] text-muted-foreground tabular-nums">
                                            {Math.ceil(
                                              (subPhase.endDate.getTime() -
                                                subPhase.startDate.getTime()) /
                                                (1000 * 60 * 60 * 24)
                                            )}{" "}
                                            j
                                          </span>
                                        )}
                                    </div>
                                  )
                                })}
                          </div>
                        )
                      })}
                  </div>
                )}
              </GanttContext.Consumer>
            </GanttSidebar>

            {/* Timeline */}
            <GanttTimeline>
              <GanttHeader />
              {canEdit && (
                <GanttCreateMarkerTrigger
                  onCreateMarker={(_date) => {
                    setEditingMarker(null)
                    setMarkerDialogOpen(true)
                  }}
                />
              )}
              <GanttFeatureList>
                {filteredFeatures.map((feature) => {
                  const isPhase = !feature.isSubPhase
                  const phaseData = isPhase
                    ? phases.find((p) => p.id === feature.id)
                    : null

                  return (
                    <ContextMenu key={feature.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          onClick={() => {
                            if (isPhase && phaseData) {
                              setEditingPhase({
                                id: phaseData.id,
                                name: phaseData.name,
                                code: phaseData.code,
                                montantHT: phaseData.montantHT,
                                startDate: phaseData.startDate,
                                endDate: phaseData.endDate,
                                status: phaseData.status,
                                obs: phaseData.obs,
                                progress: phaseData.progress,
                              })
                              setPhaseDialogOpen(true)
                            } else if (!isPhase) {
                              const parentPhase = phases.find((p) =>
                                p.SubPhases.some((sp) => sp.id === feature.id)
                              )
                              const subPhase = parentPhase?.SubPhases.find(
                                (sp) => sp.id === feature.id
                              )
                              if (subPhase) {
                                setEditingSubPhase({
                                  id: subPhase.id,
                                  name: subPhase.name,
                                  code: subPhase.code,
                                  status: subPhase.status,
                                  progress: subPhase.progress,
                                  startDate: subPhase.startDate,
                                  endDate: subPhase.endDate,
                                })
                                setSubPhaseParentId(feature.parentPhaseId)
                                setSubPhaseDialogOpen(true)
                              }
                            }
                          }}
                        >
                          <GanttFeatureItem
                            {...feature}
                            onMove={canEdit ? handleMove : undefined}
                            cardClassName={cn(
                              "border-2 shadow-sm backdrop-blur-md"
                            )}
                            cardStyle={
                              feature.isSubPhase
                                ? {
                                    borderLeftWidth: "3px",
                                    borderColor:
                                      feature.status.id === "complete"
                                        ? "rgb(148 163 184 / 0.5)"
                                        : "rgb(56 189 248 / 0.6)",
                                    background:
                                      feature.status.id === "complete"
                                        ? "linear-gradient(to right, color-mix(in srgb, rgb(148, 163, 184) 15%, transparent), color-mix(in srgb, rgb(148, 163, 184) 5%, transparent))"
                                        : "linear-gradient(to right, color-mix(in srgb, rgb(56, 189, 248) 20%, transparent), color-mix(in srgb, rgb(56, 189, 248) 5%, transparent))",
                                  }
                                : {
                                    borderLeftWidth: "3px",
                                    borderColor: "rgb(148 117 240 / 0.6)",
                                    background:
                                      "linear-gradient(to right, color-mix(in srgb, rgb(148, 117, 240) 20%, transparent), color-mix(in srgb, rgb(148, 117, 240) 5%, transparent))",
                                  }
                            }
                          >
                            <div className="flex w-full items-center gap-1.5">
                              {/* Icon */}
                              {feature.isSubPhase ? (
                                <ListTodo className="size-3 shrink-0 text-muted-foreground" />
                              ) : (
                                <FolderKanban className="size-3 shrink-0 text-muted-foreground" />
                              )}

                              {/* Name */}
                              <span className="flex-1 truncate text-[11px] font-medium tracking-tighter">
                                <span className="mr-1.5 font-bold opacity-70">
                                  {feature.code}
                                </span>
                                {feature.name}
                              </span>

                              {/* Duration for subphases */}
                              {feature.isSubPhase && (
                                <span className="shrink-0 text-[10px] tracking-tighter text-muted-foreground tabular-nums">
                                  {Math.ceil(
                                    (feature.endAt.getTime() -
                                      feature.startAt.getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  j
                                </span>
                              )}

                              {/* Progress badge for phases */}
                              {!feature.isSubPhase && (
                                <span className="shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-tighter tabular-nums">
                                  {feature.progress}%
                                </span>
                              )}
                            </div>

                            {/* Progress overlay bar for phases */}
                            {!feature.isSubPhase && feature.progress > 0 && (
                              <div
                                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[5px]"
                                style={{
                                  width: `${feature.progress}%`,
                                }}
                              >
                                <div
                                  className="size-full opacity-20"
                                  style={{
                                    background: `linear-gradient(to right, color-mix(in srgb, rgb(148, 117, 240) 60%, transparent), transparent)`,
                                  }}
                                />
                              </div>
                            )}
                          </GanttFeatureItem>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        {isPhase ? (
                          <>
                            <ContextMenuItem
                              className="flex items-center gap-2"
                              onClick={() => {
                                if (!phaseData) return
                                setEditingPhase({
                                  id: phaseData.id,
                                  name: phaseData.name,
                                  code: phaseData.code,
                                  montantHT: phaseData.montantHT,
                                  startDate: phaseData.startDate,
                                  endDate: phaseData.endDate,
                                  status: phaseData.status,
                                  obs: phaseData.obs,
                                  progress: phaseData.progress,
                                })
                                setPhaseDialogOpen(true)
                              }}
                            >
                              <Eye className="size-4" />
                              {canEdit ? "Modifier" : "Voir les détails"}
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="flex items-center gap-2"
                              onClick={() => {
                                if (!phaseData) return
                                setEditingPhase({
                                  id: phaseData.id,
                                  name: phaseData.name,
                                  code: phaseData.code,
                                  montantHT: phaseData.montantHT,
                                  startDate: phaseData.startDate,
                                  endDate: phaseData.endDate,
                                  status: phaseData.status,
                                  obs: phaseData.obs,
                                  progress: phaseData.progress,
                                })
                                setPhaseDialogOpen(true)
                              }}
                            >
                              <Pencil className="size-4" />
                              Modifier
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="flex items-center gap-2"
                              onClick={() => {
                                setEditingSubPhase(null)
                                setSubPhaseParentId(feature.id)
                                setSubPhaseDialogOpen(true)
                              }}
                            >
                              <Plus className="size-4" />
                              Ajouter une sous-phase
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="flex items-center gap-2 text-destructive"
                              onClick={() => {
                                setDeletingPhaseId(feature.id)
                              }}
                            >
                              <Trash2 className="size-4" />
                              Supprimer
                            </ContextMenuItem>
                          </>
                        ) : (
                          <>
                            <ContextMenuItem
                              className="flex items-center gap-2"
                              onClick={() => {
                                const parentPhase = phases.find((p) =>
                                  p.SubPhases.some((sp) => sp.id === feature.id)
                                )
                                const subPhase = parentPhase?.SubPhases.find(
                                  (sp) => sp.id === feature.id
                                )
                                if (!subPhase) return
                                setEditingSubPhase({
                                  id: subPhase.id,
                                  name: subPhase.name,
                                  code: subPhase.code,
                                  status: subPhase.status,
                                  progress: subPhase.progress,
                                  startDate: subPhase.startDate,
                                  endDate: subPhase.endDate,
                                })
                                setSubPhaseParentId(feature.parentPhaseId)
                                setSubPhaseDialogOpen(true)
                              }}
                            >
                              <Pencil className="size-4" />
                              Modifier
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="flex items-center gap-2 text-destructive"
                              onClick={() => {
                                setDeletingSubPhaseId(feature.id)
                              }}
                            >
                              <Trash2 className="size-4" />
                              Supprimer
                            </ContextMenuItem>
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })}
              </GanttFeatureList>

              {/* Markers */}
              {markers.map((marker) => (
                <GanttMarker
                  key={marker.id}
                  id={marker.id}
                  date={marker.date}
                  label={marker.label}
                  className={marker.className}
                  onEdit={
                    canEdit
                      ? () => {
                          const m = markers.find((mk) => mk.id === marker.id)
                          if (!m) return
                          setEditingMarker({
                            id: m.id,
                            label: m.label,
                            date: m.date,
                            className: m.className,
                          })
                          setMarkerDialogOpen(true)
                        }
                      : undefined
                  }
                  onRemove={
                    canEdit
                      ? () => {
                          setDeletingMarkerId(marker.id)
                        }
                      : undefined
                  }
                />
              ))}
              <GanttToday />
            </GanttTimeline>
          </GanttProvider>
        </div>
      )}

      {/* Phase Dialog */}
      <PhaseDialog
        key={editingPhase?.id ?? "phase-create"}
        projectId={projectId}
        projectODS={projectODS}
        projectMontantHT={projectMontantHT}
        currentPhasesSum={currentPhasesSum}
        phase={editingPhase ?? undefined}
        open={phaseDialogOpen}
        onOpenChange={(open) => {
          setPhaseDialogOpen(open)
          if (!open) setEditingPhase(null)
        }}
        onSuccess={() => router.refresh()}
      />

      {/* SubPhase Dialog */}
      {subPhaseParentId && (
        <SubPhaseDialog
          key={`${subPhaseParentId}-${editingSubPhase?.id ?? "sub-create"}`}
          phaseId={subPhaseParentId}
          phaseStartDate={
            phases.find((p) => p.id === subPhaseParentId)?.startDate ?? null
          }
          phaseEndDate={
            phases.find((p) => p.id === subPhaseParentId)?.endDate ?? null
          }
          subPhase={editingSubPhase ?? undefined}
          open={subPhaseDialogOpen}
          onOpenChange={(open) => {
            setSubPhaseDialogOpen(open)
            if (!open) {
              setEditingSubPhase(null)
              setSubPhaseParentId(null)
            }
          }}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* GanttMarker Dialog */}
      <GanttMarkerDialog
        key={editingMarker?.id ?? "marker-create"}
        projectId={projectId}
        marker={editingMarker ?? undefined}
        open={markerDialogOpen}
        onOpenChange={(open) => {
          setMarkerDialogOpen(open)
          if (!open) setEditingMarker(null)
        }}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Phase Confirmation */}
      <AlertDialog
        open={!!deletingPhaseId}
        onOpenChange={(open) => !open && setDeletingPhaseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la phase</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette phase ? Cette action est
              irréversible. Toutes les sous-phases et tâches associées seront
              également supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhase}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete SubPhase Confirmation */}
      <AlertDialog
        open={!!deletingSubPhaseId}
        onOpenChange={(open) => !open && setDeletingSubPhaseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la sous-phase</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette sous-phase ? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubPhase}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Marker Confirmation */}
      <AlertDialog
        open={!!deletingMarkerId}
        onOpenChange={(open) => !open && setDeletingMarkerId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le marqueur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce marqueur ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMarker}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

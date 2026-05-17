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
import { type Range } from "@/components/kibo-ui/gantt"
import {
  STATUS_MAP,
  type ProjectGanttProps,
  type GanttPhaseFeature,
  type EditingPhase,
  type EditingSubPhase,
  type EditingMarker,
} from "@/lib/types"

export function useGanttState({
  phases,
  markers,
  canEdit,
  projectId,
  projectMontantHT,
  projectODS,
}: ProjectGanttProps) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()

  // --- UI state ---
  const [range, setRange] = useState<Range>("monthly")
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(100)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // --- Dialog states ---
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<EditingPhase>(null)

  const [subPhaseDialogOpen, setSubPhaseDialogOpen] = useState(false)
  const [editingSubPhase, setEditingSubPhase] = useState<EditingSubPhase>(null)
  const [subPhaseParentId, setSubPhaseParentId] = useState<string | null>(null)

  const [markerDialogOpen, setMarkerDialogOpen] = useState(false)
  const [editingMarker, setEditingMarker] = useState<EditingMarker>(null)
  const [markerDefaultDate, setMarkerDefaultDate] = useState<Date | null>(null)

  // --- Delete confirmation states ---
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null)
  const [deletingSubPhaseId, setDeletingSubPhaseId] = useState<string | null>(
    null
  )
  const [deletingMarkerId, setDeletingMarkerId] = useState<string | null>(null)

  // --- Derived -- does the project have any phases with dates? ---
  const hasPhases = phases.some((p) => p.startDate && p.endDate)

  // --- Build Gantt features from phases/subphases ---
  const ganttFeatures: GanttPhaseFeature[] = useMemo(() => {
    const items: GanttPhaseFeature[] = []

    for (const phase of phases) {
      if (!phase.startDate || !phase.endDate) continue

      const status = STATUS_MAP[phase.status] ?? STATUS_MAP.New

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

  // --- Optimistic updates for drag & checkbox toggle ---
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

  // --- Filter features by search query & status ---
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

  // --- Budget sum of all phases ---
  const currentPhasesSum = useMemo(
    () => phases.reduce((sum, p) => sum + p.montantHT, 0),
    [phases]
  )

  // --- Counts ---
  const phaseCount = optimisticFeatures.filter((f) => !f.isSubPhase).length
  const subPhaseCount = optimisticFeatures.filter((f) => f.isSubPhase).length
  const markerCount = markers.length
  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== null

  // --- Handlers ---

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

  const handleMove = (id: string, startAt: Date, endAt: Date | null) => {
    if (!canEdit) return

    const isSubPhase = phases.some((p) =>
      p.SubPhases.some((sp) => sp.id === id)
    )

    startTransition(async () => {
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

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(200, prev + 10))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(50, prev - 10))
  }, [])

  const handleGanttAddItem = useCallback(
    (_date: Date) => {
      if (!canEdit) return
      toast.info("Ajouter via le menu contextuel", {
        description:
          "Faites un clic droit sur une phase dans le diagramme, puis sélectionnez 'Ajouter une sous-phase'.",
        duration: 5000,
        classNames: {
          toast:
            "!border-l-4 !border-l-primary/60 !shadow-lg !bg-card !border-border dark:!border-l-primary/80",
          title: "!font-semibold !text-card-foreground",
          description:
            "!text-muted-foreground !text-[13px] !leading-snug !opacity-100",
        },
      })
    },
    [canEdit]
  )

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return {
    // Refresh
    onRefresh: handleRefresh,

    // UI state
    range,
    setRange,
    expandedPhases,
    togglePhaseExpansion,
    zoom,
    handleZoomIn,
    handleZoomOut,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    hasPhases,

    // Counts
    phaseCount,
    subPhaseCount,
    markerCount,

    // Computed
    filteredFeatures,
    currentPhasesSum,

    // Handlers
    handleMove,
    handleSubPhaseToggle,
    handleDeletePhase,
    handleDeleteSubPhase,
    handleDeleteMarker,
    handleGanttAddItem,

    // Dialog states & setters
    phaseDialogOpen,
    setPhaseDialogOpen,
    editingPhase,
    setEditingPhase,
    subPhaseDialogOpen,
    setSubPhaseDialogOpen,
    editingSubPhase,
    setEditingSubPhase,
    subPhaseParentId,
    setSubPhaseParentId,
    markerDialogOpen,
    setMarkerDialogOpen,
    editingMarker,
    setEditingMarker,
    markerDefaultDate,
    setMarkerDefaultDate,

    // Delete states & setters
    deletingPhaseId,
    setDeletingPhaseId,
    deletingSubPhaseId,
    setDeletingSubPhaseId,
    deletingMarkerId,
    setDeletingMarkerId,

    // Original props (needed by sub-components)
    phases,
    markers,
    canEdit,
    projectId,
    projectMontantHT,
    projectODS,
  }
}

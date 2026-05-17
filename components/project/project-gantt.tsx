"use client"

import {
  GanttProvider,
  GanttSidebar,
  GanttTimeline,
} from "@/components/kibo-ui/gantt"
import { Layers } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { useGanttState } from "./gantt/use-gantt-state"
import { GanttToolbar } from "./gantt/gantt-toolbar"
import { GanttSidebarContent } from "./gantt/gantt-sidebar-content"
import { GanttTimelineContent } from "./gantt/gantt-timeline-content"
import { GanttDialogs } from "./gantt/gantt-dialogs"
import type { TimelineActions } from "./gantt/gantt-timeline-content"
import type { ProjectGanttProps } from "@/lib/types"

export function ProjectGantt(props: ProjectGanttProps) {
  const {
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

    // Refresh
    onRefresh,

    // Original props
    phases,
    markers,
    canEdit,
    projectId,
    projectMontantHT,
    projectODS,
  } = useGanttState(props)

  const timelineActions: TimelineActions = {
    onEditPhase: (phaseId) => {
      const phase = phases.find((p) => p.id === phaseId)
      if (!phase) return
      setEditingPhase({
        id: phase.id,
        name: phase.name,
        code: phase.code,
        montantHT: phase.montantHT,
        startDate: phase.startDate,
        endDate: phase.endDate,
        status: phase.status,
        obs: phase.obs,
        progress: phase.progress,
      })
      setPhaseDialogOpen(true)
    },
    onEditSubPhase: (subPhaseId, parentPhaseId) => {
      const parentPhase = phases.find((p) => p.id === parentPhaseId)
      const subPhase = parentPhase?.SubPhases.find((sp) => sp.id === subPhaseId)
      if (!subPhase || !parentPhase) return
      setEditingSubPhase({
        id: subPhase.id,
        name: subPhase.name,
        code: subPhase.code,
        status: subPhase.status,
        progress: subPhase.progress,
        startDate: subPhase.startDate,
        endDate: subPhase.endDate,
      })
      setSubPhaseParentId(parentPhase.id)
      setSubPhaseDialogOpen(true)
    },
    onDeletePhase: (phaseId) => setDeletingPhaseId(phaseId),
    onDeleteSubPhase: (subPhaseId) => setDeletingSubPhaseId(subPhaseId),
    onAddSubPhase: (parentPhaseId) => {
      setEditingSubPhase(null)
      setSubPhaseParentId(parentPhaseId)
      setSubPhaseDialogOpen(true)
    },
    onCreateMarker: (date) => {
      setEditingMarker(null)
      setMarkerDefaultDate(date)
      setMarkerDialogOpen(true)
    },
    onEditMarker: (markerId) => {
      const m = markers.find((mk) => mk.id === markerId)
      if (!m) return
      setEditingMarker({
        id: m.id,
        label: m.label,
        date: m.date,
        className: m.className,
      })
      setMarkerDialogOpen(true)
    },
    onDeleteMarker: (markerId) => setDeletingMarkerId(markerId),
    onMoveFeature: handleMove,
  }

  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden">
      {/* Toolbar */}
      <GanttToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        hasActiveFilters={hasActiveFilters}
        range={range}
        setRange={setRange}
        zoom={zoom}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        phaseCount={phaseCount}
        subPhaseCount={subPhaseCount}
        markerCount={markerCount}
      />

      {/* Empty state when no phases */}
      {!hasPhases && (
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
      {hasPhases && (
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
              <GanttSidebarContent
                filteredFeatures={filteredFeatures}
                expandedPhases={expandedPhases}
                togglePhaseExpansion={togglePhaseExpansion}
                phases={phases}
                handleSubPhaseToggle={handleSubPhaseToggle}
              />
            </GanttSidebar>

            {/* Timeline */}
            <GanttTimeline>
              <GanttTimelineContent
                filteredFeatures={filteredFeatures}
                phases={phases}
                markers={markers}
                canEdit={canEdit}
                actions={timelineActions}
              />
            </GanttTimeline>
          </GanttProvider>
        </div>
      )}

      {/* All Dialogs + Delete Confirmations */}
      <GanttDialogs
        project={{
          id: projectId,
          ods: projectODS,
          montantHT: projectMontantHT,
        }}
        phases={phases}
        currentPhasesSum={currentPhasesSum}
        phaseDialog={{
          open: phaseDialogOpen,
          editing: editingPhase,
          setOpen: setPhaseDialogOpen,
          setEditing: setEditingPhase,
        }}
        subPhaseDialog={{
          open: subPhaseDialogOpen,
          editing: editingSubPhase,
          parentId: subPhaseParentId,
          setOpen: setSubPhaseDialogOpen,
          setEditing: setEditingSubPhase,
          setParentId: setSubPhaseParentId,
        }}
        markerDialog={{
          open: markerDialogOpen,
          editing: editingMarker,
          defaultDate: markerDefaultDate,
          setOpen: setMarkerDialogOpen,
          setEditing: setEditingMarker,
          setDefaultDate: setMarkerDefaultDate,
        }}
        deleteConfirm={{
          phaseId: deletingPhaseId,
          setPhaseId: setDeletingPhaseId,
          subPhaseId: deletingSubPhaseId,
          setSubPhaseId: setDeletingSubPhaseId,
          markerId: deletingMarkerId,
          setMarkerId: setDeletingMarkerId,
          handleDeletePhase,
          handleDeleteSubPhase,
          handleDeleteMarker,
        }}
        onSuccess={onRefresh}
      />
    </div>
  )
}

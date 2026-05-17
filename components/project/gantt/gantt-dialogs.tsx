"use client"

import { PhaseDialog } from "@/components/project/phase-dialog"
import { SubPhaseDialog } from "@/components/project/subphase-dialog"
import { GanttMarkerDialog } from "@/components/gantt/gantt-marker-dialog"
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
import {
  type PhaseData,
  type EditingPhase,
  type EditingSubPhase,
  type EditingMarker,
} from "@/lib/types"

interface PhaseDialogGroup {
  open: boolean
  editing: EditingPhase
  setOpen: (open: boolean) => void
  setEditing: (phase: EditingPhase) => void
}

interface SubPhaseDialogGroup {
  open: boolean
  editing: EditingSubPhase
  parentId: string | null
  setOpen: (open: boolean) => void
  setEditing: (phase: EditingSubPhase) => void
  setParentId: (id: string | null) => void
}

interface MarkerDialogGroup {
  open: boolean
  editing: EditingMarker
  defaultDate: Date | null
  setOpen: (open: boolean) => void
  setEditing: (marker: EditingMarker) => void
  setDefaultDate: (date: Date | null) => void
}

interface DeleteConfirmGroup {
  phaseId: string | null
  setPhaseId: (id: string | null) => void
  subPhaseId: string | null
  setSubPhaseId: (id: string | null) => void
  markerId: string | null
  setMarkerId: (id: string | null) => void
  handleDeletePhase: () => void
  handleDeleteSubPhase: () => void
  handleDeleteMarker: () => void
}

interface GanttDialogsProps {
  project: { id: string; ods: Date | null; montantHT: number }
  phases: PhaseData[]
  currentPhasesSum: number
  phaseDialog: PhaseDialogGroup
  subPhaseDialog: SubPhaseDialogGroup
  markerDialog: MarkerDialogGroup
  deleteConfirm: DeleteConfirmGroup
  onSuccess: () => void
}

export function GanttDialogs({
  project,
  phases,
  currentPhasesSum,
  phaseDialog,
  subPhaseDialog,
  markerDialog,
  deleteConfirm,
  onSuccess,
}: GanttDialogsProps) {
  return (
    <>
      {/* Phase Dialog */}
      <PhaseDialog
        key={phaseDialog.editing?.id ?? "phase-create"}
        projectId={project.id}
        projectODS={project.ods}
        projectMontantHT={project.montantHT}
        currentPhasesSum={currentPhasesSum}
        phase={phaseDialog.editing ?? undefined}
        open={phaseDialog.open}
        onOpenChange={(open) => {
          phaseDialog.setOpen(open)
          if (!open) phaseDialog.setEditing(null)
        }}
        onSuccess={onSuccess}
      />

      {/* SubPhase Dialog */}
      {subPhaseDialog.parentId && (
        <SubPhaseDialog
          key={`${subPhaseDialog.parentId}-${subPhaseDialog.editing?.id ?? "sub-create"}`}
          phaseId={subPhaseDialog.parentId}
          phaseStartDate={
            phases.find((p) => p.id === subPhaseDialog.parentId)?.startDate ??
            null
          }
          phaseEndDate={
            phases.find((p) => p.id === subPhaseDialog.parentId)?.endDate ??
            null
          }
          subPhase={subPhaseDialog.editing ?? undefined}
          open={subPhaseDialog.open}
          onOpenChange={(open) => {
            subPhaseDialog.setOpen(open)
            if (!open) {
              subPhaseDialog.setEditing(null)
              subPhaseDialog.setParentId(null)
            }
          }}
          onSuccess={onSuccess}
        />
      )}

      {/* GanttMarker Dialog */}
      <GanttMarkerDialog
        key={`${markerDialog.editing?.id ?? "marker-create"}-${markerDialog.defaultDate?.getTime() ?? "no-date"}`}
        projectId={project.id}
        marker={markerDialog.editing ?? undefined}
        defaultDate={markerDialog.defaultDate}
        open={markerDialog.open}
        onOpenChange={(open) => {
          markerDialog.setOpen(open)
          if (!open) {
            markerDialog.setEditing(null)
            markerDialog.setDefaultDate(null)
          }
        }}
        onSuccess={onSuccess}
      />

      {/* Delete Phase Confirmation */}
      <AlertDialog
        open={!!deleteConfirm.phaseId}
        onOpenChange={(open) => !open && deleteConfirm.setPhaseId(null)}
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
              onClick={deleteConfirm.handleDeletePhase}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete SubPhase Confirmation */}
      <AlertDialog
        open={!!deleteConfirm.subPhaseId}
        onOpenChange={(open) => !open && deleteConfirm.setSubPhaseId(null)}
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
              onClick={deleteConfirm.handleDeleteSubPhase}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Marker Confirmation */}
      <AlertDialog
        open={!!deleteConfirm.markerId}
        onOpenChange={(open) => !open && deleteConfirm.setMarkerId(null)}
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
              onClick={deleteConfirm.handleDeleteMarker}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

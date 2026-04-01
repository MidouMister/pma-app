"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/format"
import { STATUS_COLORS } from "@/lib/constants"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { PhaseDialog } from "./phase-dialog"
import { SubPhaseDialog } from "./subphase-dialog"

interface Phase {
  id: string
  name: string
  code: string
  montantHT: number
  startDate: Date | null
  endDate: Date | null
  status: string
  obs: string | null
  progress: number
  SubPhases: SubPhase[]
}

interface SubPhase {
  id: string
  name: string
  code: string
  status: string
  progress: number
  startDate: Date | null
  endDate: Date | null
}

interface PhaseListProps {
  projectId: string
  projectMontantHT: number
  phases: Phase[]
  userRole: "OWNER" | "ADMIN" | "USER"
  onPhaseUpdate?: () => void
}

const statusLabels: Record<string, string> = {
  New: "Nouveau",
  InProgress: "En cours",
  Pause: "En pause",
  Complete: "Terminé",
}

const subPhaseStatusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-green-100 text-green-800",
}

export function PhaseList({
  projectId,
  projectMontantHT,
  phases,
  userRole,
  onPhaseUpdate: _onPhaseUpdate,
}: PhaseListProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<"phase" | "subphase">("phase")

  const canEdit = userRole === "OWNER" || userRole === "ADMIN"

  const currentPhasesSum = phases.reduce((sum, p) => sum + p.montantHT, 0)
  const remainingBudget = projectMontantHT - currentPhasesSum

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  const handleDelete = () => {
    toast.success(
      deleteType === "phase"
        ? "Phase supprimée (temporaire)"
        : "Sous-phase supprimée (temporaire)"
    )
    setDeleteDialogId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Phases du projet
          {canEdit && (
            <PhaseDialog
              projectId={projectId}
              projectODS={null}
              projectMontantHT={projectMontantHT}
              currentPhasesSum={currentPhasesSum}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Budget total: {formatCurrency(projectMontantHT)} | Budget utilisé:{" "}
            {formatCurrency(currentPhasesSum)} | Budget restant:{" "}
            <span
              className={remainingBudget < 0 ? "font-medium text-red-600" : ""}
            >
              {formatCurrency(remainingBudget)}
            </span>
          </p>

          {phases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune phase définie
            </p>
          ) : (
            <div className="space-y-2">
              {phases.map((phase) => (
                <div key={phase.id} className="rounded-md border">
                  <div
                    className="flex cursor-pointer items-center justify-between p-3"
                    onClick={() => togglePhase(phase.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedPhases.has(phase.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <p className="font-medium">{phase.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {phase.code} | {formatCurrency(phase.montantHT)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          STATUS_COLORS[
                            phase.status as keyof typeof STATUS_COLORS
                          ]
                        }
                      >
                        {statusLabels[phase.status] || phase.status}
                      </Badge>
                      <div className="flex w-24 items-center gap-1">
                        <Progress value={phase.progress} className="h-2" />
                        <span className="text-xs">{phase.progress}%</span>
                      </div>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteDialogId(phase.id)
                                setDeleteType("phase")
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {expandedPhases.has(phase.id) &&
                    phase.SubPhases.length > 0 && (
                      <div className="space-y-2 border-t bg-muted/30 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Sous-phases:
                        </p>
                        {phase.SubPhases.map((subphase) => (
                          <div
                            key={subphase.id}
                            className="flex items-center justify-between rounded bg-background p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{subphase.name}</span>
                              <Badge
                                className={
                                  subPhaseStatusColors[
                                    subphase.status as keyof typeof subPhaseStatusColors
                                  ]
                                }
                              >
                                {subphase.status === "TODO"
                                  ? "À faire"
                                  : "Terminé"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={subphase.progress}
                                className="h-1.5 w-16"
                              />
                              <span className="text-xs">
                                {subphase.progress}%
                              </span>
                              {canEdit && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDeleteDialogId(subphase.id)
                                        setDeleteType("subphase")
                                      }}
                                    >
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        ))}
                        {canEdit && (
                          <SubPhaseDialog
                            phaseId={phase.id}
                            phaseStartDate={phase.startDate}
                            phaseEndDate={phase.endDate}
                          />
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog
        open={!!deleteDialogId}
        onOpenChange={() => setDeleteDialogId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {deleteType === "phase" ? "la phase" : "la sous-phase"}{" "}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.{" "}
              {deleteType === "phase"
                ? "Toutes les sous-phases seront également supprimées."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

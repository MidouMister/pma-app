import {
  type GanttFeature,
  type GanttStatus,
  type Range,
} from "@/components/kibo-ui/gantt"

export const STATUS_MAP: Record<string, GanttStatus> = {
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
    color: "hsl(255 80% 70%)",
  },
  SubPhaseDone: {
    id: "sub-done",
    name: "Terminé",
    color: "hsl(180 80% 45%)",
  },
}

export interface PhaseData {
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

export interface MarkerData {
  id: string
  label: string
  date: Date
  className?: string
}

export interface ProjectGanttProps {
  phases: PhaseData[]
  markers: MarkerData[]
  canEdit: boolean
  projectId: string
  unitId: string
  projectMontantHT: number
  projectODS: Date | null
}

export interface GanttPhaseFeature extends GanttFeature {
  code: string
  montantHT: number
  progress: number
  isSubPhase: boolean
  parentPhaseId: string | null
  subPhaseCount: number
}

export type EditingPhase = {
  id: string
  name: string
  code: string
  montantHT: number
  startDate: Date | null
  endDate: Date | null
  status: string
  obs: string | null
  progress: number
} | null

export type EditingSubPhase = {
  id: string
  name: string
  code: string
  status: string
  progress: number
  startDate: Date | null
  endDate: Date | null
} | null

export type EditingMarker = {
  id: string
  label: string
  date: Date
  className?: string | null
} | null

export const RANGES: { key: Range; label: string }[] = [
  { key: "daily", label: "Jour" },
  { key: "monthly", label: "Mois" },
  { key: "quarterly", label: "Trimestre" },
]

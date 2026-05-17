// Centralized TypeScript interfaces — PRD §3.3
// Do not define types inline in components or actions.

import {
  type GanttFeature,
  type GanttStatus,
  type Range,
} from "@/components/kibo-ui/gantt"
import type {
  Role,
  Status,
  SubPhaseStatus,
  User,
  Company,
  Unit,
  Project,
  Phase,
  SubPhase,
  Client,
  TeamMember,
  Task,
  Lane,
  Tag,
  TimeEntry,
  Notification,
  Invitation,
  Subscription,
  Plan,
  GanttMarker,
  Product,
  Production,
  TaskComment,
  TaskMention,
  ActivityLog,
} from "@prisma/client"

// ──── User ──────────────────────────

export type { User }

export interface UserWithRole extends User {
  company?: Company | null
  unit?: Unit | null
}

// ──── Company ───────────────────────

export type { Company }

// ──── Unit ──────────────────────────

export type { Unit }

// ──── Project ───────────────────────

export interface ProjectWithClient extends Project {
  Client: { id: string; name: string } | null
  Unit?: { id: string; name: string } | null
}

export interface ProjectWithPhases {
  id: string
  name: string
  montantHT: number
  phases: PhaseWithSubPhases[]
}

// ──── Phase ─────────────────────────

export interface PhaseWithSubPhases extends Phase {
  SubPhases: SubPhaseData[]
}

export type SubPhaseData = SubPhase

// ──── Team ──────────────────────────

export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

// ──── Client ────────────────────────

export interface ClientWithProjects extends Client {
  projects: { id: string; name: string; status: Status }[]
}

// ──── Task ──────────────────────────

export type { Task }

// ──── Lane ──────────────────────────

export type { Lane }

// ──── Tag ──────────────────────────

export type { Tag }

// ──── Time Entry ────────────────────

export type { TimeEntry }

// ──── Notification ──────────────────

export type { Notification }

// ──── Invitation ────────────────────

export type { Invitation }

// ──── Subscription ──────────────────

export type { Subscription }

// ──── Plan ──────────────────────────

export type { Plan }

// ──── Gantt ─────────────────────────

export type { GanttMarker }

// ──── Production ────────────────────

export type { Product, Production }

// ──── Comments & Mentions ───────────

export type { TaskComment, TaskMention }

// ──── Activity Log ──────────────────

export type { ActivityLog }

// ──── Kanban ────────────────────────

export interface KanbanTeamMember {
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

export interface KanbanTaskComment {
  id: string
  body: string
  createdAt: Date
  Author: {
    name: string | null
    avatarUrl: string | null
  }
}

export interface KanbanTimeEntry {
  id: string
  duration: number
  description: string | null
  startTime: Date
  user: {
    name: string | null
    avatarUrl: string | null
  }
}

export interface TaskTag {
  id: string
  name: string
  color: string
}

export interface TaskDetailData {
  teamMembers: KanbanTeamMember[]
  comments: KanbanTaskComment[]
  timeEntries: KanbanTimeEntry[]
  unitTags: TaskTag[]
  taskTagIds: string[]
}

export interface CurrentUser {
  name: string | null
  avatarUrl: string | null
}

// ──── Gantt ──────────────────────────

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

// ──── Enums ─────────────────────────

export type { Role, Status, SubPhaseStatus }

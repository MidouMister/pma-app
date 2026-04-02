// Centralized TypeScript interfaces — PRD §3.3
// Do not define types inline in components or actions.

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

// ──── Enums ─────────────────────────

export type { Role, Status, SubPhaseStatus }

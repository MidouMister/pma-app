import type { getProject, getProjects } from "@/actions/project"

export type ProjectWithDetails = NonNullable<
  Awaited<ReturnType<typeof getProject>>["project"]
>

export type ProjectListData = NonNullable<
  Awaited<ReturnType<typeof getProjects>>["projects"]
>[number]

export interface ProjectWithClient {
  id: string
  name: string
  code: string
  type: string
  montantHT: number
  montantTTC: number
  ods: Date | null
  delaiMonths: number
  delaiDays: number
  status: "New" | "InProgress" | "Pause" | "Complete"
  signe: boolean
  archived: boolean
  clientId: string
  unitId: string
  companyId: string
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    name: string
  } | null
  unit: {
    id: string
    name: string
  } | null
}

export type PhaseWithSubPhases = {
  id: string
  name: string
  code: string
  montantHT: number
  startDate: Date | null
  endDate: Date | null
  status: "New" | "InProgress" | "Pause" | "Complete"
  obs: string | null
  progress: number
  duration: number | null
  projectId: string
  createdAt: Date
  updatedAt: Date
  SubPhases: SubPhase[]
}

export type SubPhase = {
  id: string
  name: string
  code: string
  status: "TODO" | "COMPLETED"
  progress: number
  startDate: Date | null
  endDate: Date | null
  phaseId: string
  createdAt: Date
  updatedAt: Date
}

export type TeamMemberWithUser = {
  id: string
  role: string
  teamId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

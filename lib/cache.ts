// Cache Tag Taxonomy — PRD §4.3
// All tag constants used by lib/queries.ts and actions/*

// Static
export const PLANS_TAG = "plans"

// Company
export const companyTag = (id: string) => `company:${id}`
export const companyTeamTag = (id: string) => `company:${id}:team`

// Subscription
export const subscriptionTag = (companyId: string) =>
  `subscription:${companyId}`

// Unit
export const unitTag = (id: string) => `unit:${id}`
export const unitMembersTag = (id: string) => `unit:${id}:members`
export const unitProjectsTag = (id: string) => `unit:${id}:projects`
export const unitClientsTag = (id: string) => `unit:${id}:clients`
export const unitLanesTag = (id: string) => `unit:${id}:lanes`
export const unitTasksTag = (id: string) => `unit:${id}:tasks`
export const unitTagsTag = (id: string) => `unit:${id}:tags`
export const unitProductionsTag = (id: string) => `unit:${id}:productions`

// Project
export const projectTag = (id: string) => `project:${id}`
export const projectPhasesTag = (id: string) => `project:${id}:phases`
export const projectGanttTag = (id: string) => `project:${id}:gantt`
export const projectTeamTag = (id: string) => `project:${id}:team`
export const projectTimeTag = (id: string) => `project:${id}:time`
export const projectDocumentsTag = (id: string) => `project:${id}:documents`

// Phase
export const phaseTag = (id: string) => `phase:${id}`
export const phaseProductionTag = (id: string) => `phase:${id}:production`

// User
export const userTag = (id: string) => `user:${id}`
export const userTasksTag = (id: string) => `user:${id}:tasks`
export const userProjectsTag = (id: string) => `user:${id}:projects`
export const userAnalyticsTag = (id: string) => `user:${id}:analytics`

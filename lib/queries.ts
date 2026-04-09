// Data-fetching functions with 'use cache' — PRD §3.2
// All database read operations live here. No raw Prisma queries in page components.

import { auth } from "@clerk/nextjs/server"
import { Prisma } from "@prisma/client"
import { prisma } from "./prisma"
import { cacheTag, cacheLife, unstable_noStore } from "next/cache"
import {
  PLANS_TAG,
  companyTag,
  companyTeamTag,
  subscriptionTag,
  unitTag,
  unitMembersTag,
  unitProjectsTag,
  unitClientsTag,
  unitLanesTag,
  unitTasksTag,
  unitTagsTag,
  unitProductionsTag,
  projectTag,
  projectPhasesTag,
  projectGanttTag,
  projectTeamTag,
  projectTimeTag,
  projectDocumentsTag,
  phaseProductionTag,
  userTag,
  userTasksTag,
  userProjectsTag,
  userAnalyticsTag,
} from "./cache"

// Cache life profiles (PRD §4.2)
const DAYS = { stale: 86400, revalidate: 86400, expire: 604800 }
const HOURS = { stale: 3600, revalidate: 3600, expire: 86400 }
const MINUTES = { stale: 60, revalidate: 60, expire: 300 }
const SECONDS = { stale: 30, revalidate: 30, expire: 120 }
const STATIC = { stale: 31536000, revalidate: 31536000, expire: 31536000 }

// ──── Company Domain ──────────────────────────

export async function getCompanyById(companyId: string) {
  "use cache"
  cacheTag(companyTag(companyId))
  cacheLife(DAYS)
  return prisma.company.findUnique({ where: { id: companyId } })
}

export async function getCompanyKPIs(companyId: string) {
  "use cache"
  cacheTag(companyTag(companyId))
  cacheLife(HOURS)
  const [units, projects, users] = await Promise.all([
    prisma.unit.count({ where: { companyId } }),
    prisma.project.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId } }),
  ])
  return { totalUnits: units, totalProjects: projects, totalMembers: users }
}

export async function getAllUnits(companyId: string) {
  "use cache"
  cacheTag(companyTag(companyId))
  cacheLife(HOURS)
  return prisma.unit.findMany({
    where: { companyId },
    include: {
      admin: { select: { id: true, name: true } },
      _count: { select: { projects: true, members: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getCompanyTeam(companyId: string) {
  "use cache"
  cacheTag(companyTeamTag(companyId))
  cacheLife(HOURS)
  return prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      unitId: true,
      jobTitle: true,
      avatarUrl: true,
      createdAt: true,
      unit: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getSubscription(companyId: string) {
  "use cache"
  cacheTag(subscriptionTag(companyId))
  cacheLife(HOURS)
  return prisma.subscription.findUnique({
    where: { companyId },
    include: { Plan: true },
  })
}

export async function getPlans() {
  "use cache"
  cacheTag(PLANS_TAG)
  cacheLife(STATIC)
  return prisma.plan.findMany({ orderBy: { priceDA: "asc" } })
}

// ──── Unit Domain ──────────────────────────

export async function getUnitById(unitId: string) {
  "use cache"
  cacheTag(unitTag(unitId))
  cacheLife(DAYS)
  return prisma.unit.findUnique({ where: { id: unitId } })
}

export async function getUnitMembers(unitId: string) {
  "use cache"
  cacheTag(unitMembersTag(unitId))
  cacheLife(HOURS)
  return prisma.user.findMany({
    where: { unitId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      jobTitle: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  })
}

export async function getUnitProjects(unitId: string) {
  "use cache"
  cacheTag(unitProjectsTag(unitId))
  cacheLife(HOURS)
  return prisma.project.findMany({
    where: { unitId },
    include: { Client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUnitClients(unitId: string) {
  "use cache"
  cacheTag(unitClientsTag(unitId))
  cacheLife(HOURS)
  return prisma.client.findMany({
    where: { unitId },
    include: {
      _count: { select: { projects: true } },
      projects: { select: { id: true, montantTTC: true, status: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getScopedClients(
  unitId: string,
  companyId: string,
  userId: string,
  role: string
) {
  "use cache"
  cacheTag(unitClientsTag(unitId))
  cacheTag(userProjectsTag(userId))
  cacheLife(HOURS)

  const where: Prisma.ClientWhereInput = {
    unitId,
    companyId,
  }

  if (role === "USER") {
    where.projects = {
      some: {
        team: {
          members: {
            some: { userId },
          },
        },
      },
    }
  }

  return prisma.client.findMany({
    where,
    include: {
      _count: {
        select: { projects: true },
      },
      projects: {
        select: { id: true, montantTTC: true, status: true },
      },
    },
    orderBy: { name: "asc" },
  })
}

export async function getUnitLanes(unitId: string) {
  "use cache"
  cacheTag(unitLanesTag(unitId))
  cacheLife(SECONDS)
  return prisma.lane.findMany({
    where: { unitId },
    orderBy: { order: "asc" },
  })
}

export async function getUnitTasks(unitId: string) {
  "use cache"
  cacheTag(unitTasksTag(unitId))
  cacheLife(SECONDS)
  return prisma.task.findMany({
    where: { unitId },
    include: {
      Assigned: { select: { id: true, name: true, avatarUrl: true } },
      Tags: true,
      Phase: { select: { id: true, name: true } },
      subPhase: { select: { id: true, name: true } },
    },
    orderBy: { order: "asc" },
  })
}

export async function getUnitTags(unitId: string) {
  "use cache"
  cacheTag(unitTagsTag(unitId))
  cacheLife(HOURS)
  return prisma.tag.findMany({
    where: { unitId },
    orderBy: { name: "asc" },
  })
}

export async function getUnitProductions(unitId: string) {
  "use cache"
  cacheTag(unitProductionsTag(unitId))
  cacheLife(MINUTES)
  return prisma.production.findMany({
    where: { Phase: { Project: { unitId } } },
    include: { Phase: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  })
}

export async function getCompanyDashboard(companyId: string) {
  "use cache"
  cacheTag(companyTag(companyId))
  cacheLife(HOURS)
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      units: {
        include: {
          admin: { select: { id: true, name: true } },
          projects: { select: { id: true } },
          members: { select: { id: true } },
        },
      },
      Project: {
        select: {
          id: true,
          name: true,
          montantTTC: true,
          status: true,
          createdAt: true,
          unitId: true,
        },
      },
      users: {
        select: {
          id: true,
        },
      },
    },
  })
}

export async function getCompanyBilling(companyId: string) {
  "use cache"
  cacheTag(subscriptionTag(companyId))
  cacheTag(companyTag(companyId))
  cacheLife(HOURS)
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscription: {
        include: { Plan: true },
      },
      _count: {
        select: {
          units: true,
          Project: true,
          users: true,
        },
      },
    },
  })
}

export async function getPendingInvitations(companyId: string) {
  "use cache"
  cacheTag(companyTeamTag(companyId))
  cacheLife(HOURS)
  return prisma.invitation.findMany({
    where: { companyId, status: "PENDING" },
    include: {
      Unit: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUnitPendingInvitations(
  unitId: string,
  companyId: string
) {
  "use cache"
  cacheTag(unitMembersTag(unitId))
  cacheLife(HOURS)
  return prisma.invitation.findMany({
    where: { unitId, companyId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUnitDashboard(unitId: string, companyId: string) {
  "use cache"
  cacheTag(unitTag(unitId))
  cacheTag(companyTag(companyId))
  cacheLife(HOURS)
  const [unit, projects, kpiData] = await Promise.all([
    prisma.unit.findFirst({
      where: { id: unitId, companyId },
      include: {
        _count: {
          select: { projects: true, members: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { unitId, companyId },
      include: { Client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.findMany({
      where: { unitId, companyId },
      select: { montantTTC: true, status: true },
    }),
  ])
  return { unit, projects, kpiData }
}

export async function getScopedProjects(
  companyId: string,
  unitId: string,
  userId: string,
  role: string
) {
  "use cache"
  cacheTag(unitProjectsTag(unitId))
  cacheTag(userProjectsTag(userId))
  cacheLife(MINUTES)

  const where: Prisma.ProjectWhereInput = {
    companyId,
    archived: false,
    unitId,
  }

  if (role === "USER") {
    where.team = { members: { some: { userId } } }
  } else if (role === "OWNER") {
    delete where.unitId // OWNER sees all
  }

  return prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      Client: { select: { id: true, name: true } },
      phases: {
        select: {
          id: true,
          name: true,
          SubPhases: { select: { id: true, name: true } },
        },
        orderBy: { startDate: "asc" },
      },
    },
  })
}

// ──── Unit Scoped Phases for Kanban Filters ──────────────────────────

export async function getUnitPhases(unitId: string) {
  "use cache"
  cacheTag(unitProjectsTag(unitId))
  cacheLife(MINUTES)
  return prisma.phase.findMany({
    where: { Project: { unitId } },
    select: { id: true, name: true, projectId: true },
    orderBy: { startDate: "asc" },
  })
}

export async function getUnitSubPhases(phaseIds: string[]) {
  "use cache"
  cacheTag(unitProjectsTag(phaseIds[0] ?? ""))
  cacheLife(MINUTES)
  return prisma.subPhase.findMany({
    where: { phaseId: { in: phaseIds } },
    select: { id: true, name: true, phaseId: true },
    orderBy: { startDate: "asc" },
  })
}

// ──── Project Domain ──────────────────────────

export async function getProjectById(projectId: string) {
  "use cache"
  cacheTag(projectTag(projectId))
  cacheLife(MINUTES)
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      Client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          wilaya: true,
        },
      },
      phases: {
        include: { SubPhases: true },
        orderBy: { startDate: "asc" },
      },
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function getProjectPhases(projectId: string) {
  "use cache"
  cacheTag(projectPhasesTag(projectId))
  cacheLife(MINUTES)
  return prisma.phase.findMany({
    where: { projectId },
    include: { SubPhases: true },
    orderBy: { startDate: "asc" },
  })
}

export async function getGanttData(projectId: string) {
  "use cache"
  cacheTag(projectGanttTag(projectId))
  cacheLife(MINUTES)
  const [phases, markers] = await Promise.all([
    prisma.phase.findMany({
      where: { projectId },
      include: { SubPhases: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.ganttMarker.findMany({
      where: { projectId },
      orderBy: { date: "asc" },
    }),
  ])
  return { phases, markers }
}

export async function getProjectTeam(projectId: string) {
  "use cache"
  cacheTag(projectTeamTag(projectId))
  cacheLife(HOURS)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  })
  return project?.team?.members ?? []
}

export async function isProjectMember(projectId: string, userId: string) {
  "use cache"
  cacheTag(projectTeamTag(projectId))
  cacheTag(userProjectsTag(userId))
  cacheLife(HOURS)
  const member = await prisma.teamMember.findFirst({
    where: {
      userId,
      team: { projectId },
    },
  })
  return !!member
}

export async function getTimeEntries(projectId: string) {
  "use cache"
  cacheTag(projectTimeTag(projectId))
  cacheLife(MINUTES)
  return prisma.timeEntry.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { startTime: "desc" },
  })
}

export async function getProjectDocuments(projectId: string) {
  "use cache"
  cacheTag(projectDocumentsTag(projectId))
  cacheLife(HOURS)
  return prisma.projectDocument.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPhaseProduction(phaseId: string) {
  "use cache"
  cacheTag(phaseProductionTag(phaseId))
  cacheLife(MINUTES)
  return prisma.production.findMany({
    where: { phaseId },
    include: { Product: true },
    orderBy: { date: "asc" },
  })
}

// ──── User Domain ──────────────────────────

export async function getUserById(clerkId: string) {
  "use cache"
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { company: true, unit: true },
  })
  if (user) {
    cacheTag(userTag(user.id))
    cacheLife(DAYS)
  }
  return user
}

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null
  return getUserWithSubscription(userId)
}

async function getUserWithSubscription(clerkId: string) {
  "use cache"
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      company: {
        include: {
          subscription: {
            include: { Plan: true },
          },
        },
      },
      unit: true,
    },
  })
  if (user) {
    cacheTag(userTag(user.id))
    cacheTag(companyTag(user.companyId!))
    cacheLife(DAYS)
  }
  return user
}

export async function getUserTasks(userId: string) {
  "use cache"
  cacheTag(userTasksTag(userId))
  cacheLife(SECONDS)
  return prisma.task.findMany({
    where: { assignedUserId: userId },
    include: {
      Assigned: { select: { id: true, name: true, avatarUrl: true } },
      Tags: true,
    },
    orderBy: { order: "asc" },
  })
}

export async function getUserProjects(userId: string) {
  "use cache"
  cacheTag(userProjectsTag(userId))
  cacheLife(HOURS)
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    include: { team: { include: { project: true } } },
  })
  return teamMembers.map((tm) => tm.team.project)
}

export async function getUserAnalytics(userId: string) {
  "use cache"
  cacheTag(userAnalyticsTag(userId))
  cacheLife(MINUTES)
  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    select: { duration: true, startTime: true },
  })
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0)
  return { totalMinutes, entryCount: entries.length }
}

// ──── Never Cached — Always Fresh ──────────────────────────

export async function getNotifications(userId: string) {
  unstable_noStore()
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getActivityLogs(companyId: string) {
  unstable_noStore()
  return prisma.activityLog.findMany({
    where: { companyId },
    include: { User: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUnreadCount(userId: string) {
  unstable_noStore()
  return prisma.notification.count({
    where: { userId, read: false },
  })
}

export async function getInvitationStatus(invitationId: string) {
  unstable_noStore()
  return prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { status: true, email: true, role: true },
  })
}

// ──── Task Comments (no cache — PRD §3.3) ──────────────────────────

export async function getTaskComments(taskId: string) {
  unstable_noStore()
  return prisma.taskComment.findMany({
    where: { taskId },
    include: {
      Author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}

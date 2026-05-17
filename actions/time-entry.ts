"use server"

import { auth } from "@clerk/nextjs/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { projectTimeTag, userAnalyticsTag } from "@/lib/cache"

const createTimeEntrySchema = z.object({
  projectId: z.string().uuid("Projet invalide"),
  taskId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  startTime: z.date(),
  endTime: z.date(),
})

const startTimerSchema = z.object({
  projectId: z.string().uuid("Projet invalide"),
  taskId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})

const updateTimeEntrySchema = z.object({
  description: z.string().max(500).optional().nullable(),
  startTime: z.date().optional(),
  endTime: z.date().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
})

async function isTeamMember(userId: string, projectId: string) {
  const member = await prisma.teamMember.findFirst({
    where: { userId, team: { projectId } },
  })
  return !!member
}

export async function createTimeEntry(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return { success: false, error: "Votre abonnement est en lecture seule." }
    }

    const validation = createTimeEntrySchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const project = await prisma.project.findFirst({
      where: { id: validData.projectId, companyId: user.companyId },
    })
    if (!project) {
      return { success: false, error: "Projet introuvable" }
    }

    if (user.role === "USER") {
      const member = await isTeamMember(user.id, validData.projectId)
      if (!member) {
        return {
          success: false,
          error:
            "Vous devez être membre de l'équipe du projet pour enregistrer du temps",
        }
      }
    }

    const duration = Math.round(
      (validData.endTime.getTime() - validData.startTime.getTime()) / 60000
    )

    const entry = await prisma.timeEntry.create({
      data: {
        description: validData.description,
        startTime: validData.startTime,
        endTime: validData.endTime,
        duration,
        userId: user.id,
        companyId: user.companyId,
        projectId: validData.projectId,
        taskId: validData.taskId,
      },
    })

    revalidateTag(projectTimeTag(validData.projectId), "max")
    revalidateTag(userAnalyticsTag(user.id), "max")

    return { success: true, timeEntryId: entry.id }
  } catch (error) {
    console.error("createTimeEntry error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function startTimer(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return { success: false, error: "Votre abonnement est en lecture seule." }
    }

    const validation = startTimerSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const project = await prisma.project.findFirst({
      where: { id: validData.projectId, companyId: user.companyId },
    })
    if (!project) {
      return { success: false, error: "Projet introuvable" }
    }

    if (user.role === "USER") {
      const member = await isTeamMember(user.id, validData.projectId)
      if (!member) {
        return {
          success: false,
          error: "Vous devez être membre de l'équipe du projet",
        }
      }
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: { userId: user.id, endTime: null },
    })
    if (activeTimer) {
      return {
        success: false,
        error:
          "Vous avez déjà un minuteur actif. Veuillez l'arrêter avant d'en démarrer un nouveau.",
      }
    }

    const entry = await prisma.timeEntry.create({
      data: {
        description: validData.description,
        startTime: new Date(),
        endTime: null,
        userId: user.id,
        companyId: user.companyId,
        projectId: validData.projectId,
        taskId: validData.taskId,
      },
    })

    revalidateTag(projectTimeTag(validData.projectId), "max")

    return { success: true, timeEntryId: entry.id }
  } catch (error) {
    console.error("startTimer error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function stopTimer(timeEntryId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Utilisateur non trouvé" }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
    })
    if (!timeEntry) {
      return { success: false, error: "Entrée de temps introuvable" }
    }

    if (timeEntry.userId !== user.id) {
      return {
        success: false,
        error: "Vous ne pouvez arrêter que votre propre minuteur",
      }
    }

    if (timeEntry.endTime) {
      return {
        success: false,
        error: "Ce minuteur est déjà arrêté",
      }
    }

    const now = new Date()
    const duration = Math.round(
      (now.getTime() - timeEntry.startTime.getTime()) / 60000
    )

    await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: { endTime: now, duration },
    })

    revalidateTag(projectTimeTag(timeEntry.projectId), "max")
    revalidateTag(userAnalyticsTag(user.id), "max")

    return { success: true }
  } catch (error) {
    console.error("stopTimer error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function updateTimeEntry(timeEntryId: string, data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return { success: false, error: "Votre abonnement est en lecture seule." }
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
    })
    if (!timeEntry || timeEntry.companyId !== user.companyId) {
      return { success: false, error: "Entrée de temps introuvable" }
    }

    if (
      timeEntry.userId !== user.id &&
      user.role !== "OWNER" &&
      user.role !== "ADMIN"
    ) {
      return {
        success: false,
        error: "Vous ne pouvez modifier que vos propres entrées de temps",
      }
    }

    const validation = updateTimeEntrySchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const effectiveStartTime = validData.startTime ?? timeEntry.startTime
    const effectiveEndTime =
      validData.endTime !== undefined ? validData.endTime : timeEntry.endTime

    let duration = timeEntry.duration
    if (effectiveStartTime && effectiveEndTime) {
      duration = Math.round(
        (effectiveEndTime.getTime() - effectiveStartTime.getTime()) / 60000
      )
    } else if (validData.startTime || validData.endTime !== undefined) {
      duration = null
    }

    await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        ...(validData.description !== undefined && {
          description: validData.description,
        }),
        ...(validData.startTime !== undefined && {
          startTime: validData.startTime,
        }),
        ...(validData.endTime !== undefined && {
          endTime: validData.endTime,
        }),
        ...(validData.taskId !== undefined && { taskId: validData.taskId }),
        duration,
      },
    })

    revalidateTag(projectTimeTag(timeEntry.projectId), "max")
    revalidateTag(userAnalyticsTag(timeEntry.userId), "max")

    return { success: true }
  } catch (error) {
    console.error("updateTimeEntry error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteTimeEntry(timeEntryId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return { success: false, error: "Votre abonnement est en lecture seule." }
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
    })
    if (!timeEntry || timeEntry.companyId !== user.companyId) {
      return { success: false, error: "Entrée de temps introuvable" }
    }

    if (
      timeEntry.userId !== user.id &&
      user.role !== "OWNER" &&
      user.role !== "ADMIN"
    ) {
      return {
        success: false,
        error: "Vous ne pouvez supprimer que vos propres entrées de temps",
      }
    }

    await prisma.timeEntry.delete({ where: { id: timeEntryId } })

    revalidateTag(projectTimeTag(timeEntry.projectId), "max")
    revalidateTag(userAnalyticsTag(timeEntry.userId), "max")

    return { success: true }
  } catch (error) {
    console.error("deleteTimeEntry error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

type ProjectTimeEntriesResult =
  | {
      success: true
      entries: Prisma.TimeEntryGetPayload<{
        include: { user: { select: { id: true; name: true; avatarUrl: true } } }
      }>[]
      totalDuration: number
      userTotals: { userId: string; userName: string; duration: number }[]
    }
  | { success: false; error: string }

type TaskTimeEntriesResult =
  | {
      success: true
      entries: Prisma.TimeEntryGetPayload<{
        include: { user: { select: { id: true; name: true; avatarUrl: true } } }
      }>[]
    }
  | { success: false; error: string }

export async function getProjectTimeEntries(
  projectId: string
): Promise<ProjectTimeEntriesResult> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
    })
    if (!project) {
      return { success: false, error: "Projet introuvable" }
    }

    if (user.role === "USER") {
      const member = await isTeamMember(user.id, projectId)
      if (!member) {
        return { success: false, error: "Accès refusé" }
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { startTime: "desc" },
    })

    const totalDuration = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0)

    const userMap = new Map<
      string,
      { userId: string; userName: string; duration: number }
    >()
    for (const entry of entries) {
      const existing = userMap.get(entry.userId)
      if (existing) {
        existing.duration += entry.duration ?? 0
      } else {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.user.name ?? "Utilisateur",
          duration: entry.duration ?? 0,
        })
      }
    }

    return {
      success: true,
      entries,
      totalDuration,
      userTotals: Array.from(userMap.values()),
    }
  } catch (error) {
    console.error("getProjectTimeEntries error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function getTaskTimeEntries(
  taskId: string
): Promise<TaskTimeEntriesResult> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId },
      select: {
        projectId: true,
        companyId: true,
      },
    })
    if (!task || task.companyId !== user.companyId) {
      return { success: false, error: "Tâche introuvable" }
    }

    if (user.role === "USER") {
      const member = await isTeamMember(user.id, task.projectId)
      if (!member) {
        return { success: false, error: "Accès refusé" }
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { startTime: "desc" },
    })

    return { success: true, entries }
  } catch (error) {
    console.error("getTaskTimeEntries error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function getUserTimeEntries(targetUserId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (
      targetUserId !== user.id &&
      user.role !== "OWNER" &&
      user.role !== "ADMIN"
    ) {
      return {
        success: false,
        error: "Vous ne pouvez consulter que vos propres entrées de temps",
      }
    }

    if (targetUserId !== user.id) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { companyId: true },
      })
      if (!targetUser || targetUser.companyId !== user.companyId) {
        return { success: false, error: "Utilisateur introuvable" }
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where: { userId: targetUserId },
      include: {
        Project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { startTime: "desc" },
    })

    const weeklyMap = new Map<
      string,
      {
        weekStart: string
        entries: (typeof entries)[0][]
        totalDuration: number
      }
    >()

    for (const entry of entries) {
      const startDate = new Date(entry.startTime)
      const day = startDate.getDay()
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(startDate)
      monday.setDate(diff)
      monday.setHours(0, 0, 0, 0)
      const weekKey = monday.toISOString()

      const existing = weeklyMap.get(weekKey)
      if (existing) {
        existing.entries.push(entry)
        existing.totalDuration += entry.duration ?? 0
      } else {
        weeklyMap.set(weekKey, {
          weekStart: weekKey,
          entries: [entry],
          totalDuration: entry.duration ?? 0,
        })
      }
    }

    const weeklyGroups = Array.from(weeklyMap.values()).sort((a, b) =>
      b.weekStart.localeCompare(a.weekStart)
    )

    return { success: true, entries, weeklyGroups }
  } catch (error) {
    console.error("getUserTimeEntries error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function getActiveTimer() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Utilisateur non trouvé" }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: { userId: user.id, endTime: null },
      include: {
        Project: { select: { id: true, name: true } },
      },
    })

    if (!activeEntry) {
      return { success: true, activeEntry: null }
    }

    const elapsed = Math.floor(
      (Date.now() - activeEntry.startTime.getTime()) / 1000
    )

    return {
      success: true,
      activeEntry: {
        id: activeEntry.id,
        projectId: activeEntry.projectId,
        projectName: activeEntry.Project.name,
        startTime: activeEntry.startTime,
        elapsed,
      },
    }
  } catch (error) {
    console.error("getActiveTimer error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

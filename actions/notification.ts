"use server"

import { unstable_noStore } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { NotificationType } from "@prisma/client"

export interface CreateNotificationInput {
  companyId: string
  unitId?: string
  type:
    | "INVITATION"
    | "PROJECT"
    | "TASK"
    | "CLIENT"
    | "PHASE"
    | "TEAM"
    | "LANE"
    | "TAG"
    | "PRODUCTION"
    | "GENERAL"
  message: string
  targetRole?: "OWNER" | "ADMIN"
  targetUserId?: string
}

export async function createNotification(data: CreateNotificationInput) {
  unstable_noStore()

  if (!data.targetRole && !data.targetUserId) {
    throw new Error("targetRole ou targetUserId requis")
  }

  if (data.targetUserId) {
    await prisma.notification.create({
      data: {
        message: data.message,
        companyId: data.companyId,
        unitId: data.unitId,
        userId: data.targetUserId,
        type: data.type,
      },
    })
    return
  }

  if (data.targetRole === "OWNER") {
    const owner = await prisma.user.findFirst({
      where: { companyId: data.companyId, role: "OWNER" },
      select: { id: true },
    })
    if (!owner) return

    await prisma.notification.create({
      data: {
        message: data.message,
        companyId: data.companyId,
        unitId: data.unitId,
        userId: owner.id,
        type: data.type,
        targetRole: "OWNER",
      },
    })
    return
  }

  if (data.targetRole === "ADMIN") {
    const admins = await prisma.user.findMany({
      where: {
        companyId: data.companyId,
        role: "ADMIN",
        ...(data.unitId ? { unitId: data.unitId } : {}),
      },
      select: { id: true },
    })
    if (admins.length === 0) return

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        message: data.message,
        companyId: data.companyId,
        unitId: data.unitId,
        userId: admin.id,
        type: data.type,
        targetRole: "ADMIN",
      })),
    })
    return
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  unstable_noStore()
  try {
    return await prisma.notification.count({
      where: { userId, read: false },
    })
  } catch (error) {
    console.error("getUnreadCount error:", error)
    return 0
  }
}

interface GetNotificationsFilters {
  type?: NotificationType
  read?: boolean
  take?: number
  skip?: number
}

export async function getNotifications(
  userId: string,
  filters?: GetNotificationsFilters
) {
  unstable_noStore()
  try {
    const { type, read, take = 20, skip = 0 } = filters ?? {}

    return await prisma.notification.findMany({
      where: {
        userId,
        ...(type !== undefined ? { type } : {}),
        ...(read !== undefined ? { read } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    })
  } catch (error) {
    console.error("getNotifications error:", error)
    return []
  }
}

export async function getLatestUnread(userId: string, limit = 5) {
  unstable_noStore()
  try {
    return await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  } catch (error) {
    console.error("getLatestUnread error:", error)
    return []
  }
}

export async function markAsRead(notificationId: string, userId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Non autorisé" }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      return { success: false, error: "Notification introuvable" }
    }

    if (notification.userId !== userId) {
      return { success: false, error: "Non autorisé" }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    return { success: true }
  } catch (error) {
    console.error("markAsRead error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, count: 0, error: "Non autorisé" }

    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    return { success: true, count: result.count }
  } catch (error) {
    console.error("markAllAsRead error:", error)
    return { success: false, count: 0, error: "Une erreur est survenue" }
  }
}

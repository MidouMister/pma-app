"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { unitTasksTag, userTasksTag } from "@/lib/cache"

const MENTION_REGEX = /@(\w+(?:\s+\w+)*)/g

export async function createComment(taskId: string, body: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return {
        success: false,
        error: "Votre abonnement est en lecture seule.",
      }
    }

    // Verify task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: { id: taskId, companyId: user.companyId },
      include: { Project: true },
    })
    if (!task) {
      return { success: false, error: "Tâche introuvable" }
    }

    // Create the comment
    const comment = await prisma.taskComment.create({
      data: {
        body,
        taskId,
        authorId: user.id,
        companyId: user.companyId,
      },
      include: {
        Author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    // Parse @mentions from body
    const mentions = body.match(MENTION_REGEX)
    if (mentions && mentions.length > 0) {
      // Get eligible users: TeamMembers of the project + ADMIN/OWNER
      const teamMembers = await prisma.teamMember.findMany({
        where: { team: { projectId: task.projectId } },
        select: { userId: true, user: { select: { name: true } } },
      })

      const adminAndOwner = await prisma.user.findMany({
        where: {
          companyId: user.companyId,
          role: { in: ["ADMIN", "OWNER"] },
        },
        select: { id: true, name: true },
      })

      const eligibleUsers = [
        ...teamMembers.map((m) => ({ id: m.userId, name: m.user.name })),
        ...adminAndOwner,
      ].filter(
        (u, index, self) => self.findIndex((x) => x.id === u.id) === index
      )

      // Process each mention
      for (const mention of mentions) {
        const mentionName = mention.slice(1).trim() // Remove '@'

        // Find user by name (case-insensitive match)
        const mentionedUser = eligibleUsers.find(
          (u) => u.name?.toLowerCase() === mentionName.toLowerCase()
        )

        if (mentionedUser && mentionedUser.id !== user.id) {
          // Create TaskMention record (Prisma handles unique constraint)
          try {
            await prisma.taskMention.create({
              data: {
                commentId: comment.id,
                mentionedUserId: mentionedUser.id,
                companyId: user.companyId,
              },
            })

            // Also create a Notification
            await prisma.notification.create({
              data: {
                message: `${user.name} vous a mentionné dans "${task.title}"`,
                companyId: user.companyId,
                unitId: task.unitId,
                userId: mentionedUser.id,
                type: "TASK",
                targetUserId: user.id
              }
            })
          } catch {
            // Ignore unique constraint violations (duplicate mentions)
          }
        }
      }
    }

    revalidateTag(unitTasksTag(task.unitId), "max")
    revalidateTag(userTasksTag(user.id), "max")
    return { success: true, commentId: comment.id }
  } catch (error) {
    console.error("createComment error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function updateComment(commentId: string, body: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return {
        success: false,
        error: "Votre abonnement est en lecture seule.",
      }
    }

    // Find comment
    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, companyId: user.companyId },
    })
    if (!comment) {
      return { success: false, error: "Commentaire introuvable" }
    }

    // Only author can edit (or ADMIN/OWNER)
    if (comment.authorId !== user.id && user.role === "USER") {
      return { success: false, error: "Accès refusé" }
    }

    // Get the task to find its unitId for revalidation
    const task = await prisma.task.findUnique({
      where: { id: comment.taskId },
      select: { unitId: true },
    })

    await prisma.taskComment.update({
      where: { id: commentId },
      data: { body, edited: true },
    })

    if (task) {
      revalidateTag(unitTasksTag(task.unitId), "max")
    }
    return { success: true }
  } catch (error) {
    console.error("updateComment error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return {
        success: false,
        error: "Votre abonnement est en lecture seule.",
      }
    }

    // Find comment
    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, companyId: user.companyId },
    })
    if (!comment) {
      return { success: false, error: "Commentaire introuvable" }
    }

    // Only author can delete (or ADMIN/OWNER)
    if (comment.authorId !== user.id && user.role === "USER") {
      return { success: false, error: "Accès refusé" }
    }

    // Delete mentions first (cascade should handle this, but being explicit)
    await prisma.taskMention.deleteMany({ where: { commentId } })

    // Get the task to find its unitId for revalidation
    const task = await prisma.task.findUnique({
      where: { id: comment.taskId },
      select: { unitId: true },
    })

    await prisma.taskComment.delete({ where: { id: commentId } })

    if (task) {
      revalidateTag(unitTasksTag(task.unitId), "max")
    }
    return { success: true }
  } catch (error) {
    console.error("deleteComment error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

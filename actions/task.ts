"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { taskSchema, taskUpdateSchema } from "@/lib/validators"
import { unitTasksTag, userTasksTag } from "@/lib/cache"
import { createNotification } from "@/actions/notification"

export async function createTask(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return {
        success: false,
        error: "Votre abonnement est en lecture seule.",
      }
    }

    const validation = taskSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: { id: validData.projectId, companyId: user.companyId },
    })
    if (!project) {
      return { success: false, error: "Projet introuvable" }
    }

    // Verify unit matches project's unit
    if (project.unitId !== validData.unitId) {
      return {
        success: false,
        error: "L'unité spécifiée ne correspond pas à celle du projet.",
      }
    }

    // Check Plan.maxTasksPerProject limit
    const plan = user.company?.subscription?.Plan
    if (plan && plan.maxTasksPerProject) {
      const taskCount = await prisma.task.count({
        where: { projectId: validData.projectId },
      })
      if (taskCount >= plan.maxTasksPerProject) {
        return {
          success: false,
          error: `Vous avez atteint la limite de ${plan.maxTasksPerProject} tâches pour ce projet. Veuillez passer à un plan supérieur.`,
        }
      }
    }

    // Verify assignee is a TeamMember of the project
    if (validData.assignedUserId) {
      const isTeamMember = await prisma.teamMember.findFirst({
        where: {
          userId: validData.assignedUserId,
          team: { projectId: validData.projectId },
        },
      })
      if (!isTeamMember) {
        return {
          success: false,
          error: "L'utilisateur assigné doit être membre de l'équipe du projet",
        }
      }
    }

    // Verify subPhase is a child of phaseId
    if (validData.subPhaseId && validData.phaseId) {
      const subPhase = await prisma.subPhase.findFirst({
        where: { id: validData.subPhaseId, phaseId: validData.phaseId },
      })
      if (!subPhase) {
        return {
          success: false,
          error: "La sous-phase doit appartenir à la phase sélectionnée",
        }
      }
    }

    // Get max order for the lane (or unit if no lane)
    const maxOrder = await prisma.task.aggregate({
      where: {
        laneId: validData.laneId ?? null,
        unitId: validData.unitId,
        companyId: user.companyId,
      },
      _max: { order: true },
    })

    const task = await prisma.task.create({
      data: {
        title: validData.title,
        description: validData.description,
        startDate: validData.startDate,
        dueDate: validData.dueDate,
        endDate: validData.endDate,
        complete: validData.complete,
        assignedUserId: validData.assignedUserId,
        laneId: validData.laneId,
        unitId: validData.unitId,
        companyId: user.companyId,
        projectId: validData.projectId,
        phaseId: validData.phaseId,
        subPhaseId: validData.subPhaseId,
        order: (maxOrder._max.order ?? -1) + 1,
        ...(validData.tagIds &&
          validData.tagIds.length > 0 && {
            Tags: {
              connect: validData.tagIds.map((id) => ({ id })),
            },
          }),
      },
    })

    if (validData.assignedUserId && validData.assignedUserId !== user.id) {
      try {
        await createNotification({
          companyId: user.companyId!,
          unitId: validData.unitId,
          type: "TASK",
          message: `Vous avez été assigné à la tâche "${task.title}"`,
          targetUserId: validData.assignedUserId,
        })
      } catch {
        // Notification failure should not block the mutation
      }
    }

    revalidateTag(unitTasksTag(validData.unitId), "max")
    if (validData.assignedUserId) {
      revalidateTag(userTasksTag(validData.assignedUserId), "max")
    }
    return { success: true, taskId: task.id }
  } catch (error) {
    console.error("createTask error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function updateTask(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return {
        success: false,
        error: "Votre abonnement est en lecture seule.",
      }
    }

    const validation = taskUpdateSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { id, ...fields } = validation.data

    const task = await prisma.task.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!task) {
      return { success: false, error: "Tâche introuvable" }
    }

    // Verify assignee is a TeamMember
    if (fields.assignedUserId) {
      const isTeamMember = await prisma.teamMember.findFirst({
        where: {
          userId: fields.assignedUserId,
          team: { projectId: task.projectId },
        },
      })
      if (!isTeamMember) {
        return {
          success: false,
          error: "L'utilisateur assigné doit être membre de l'équipe du projet",
        }
      }
    }

    const prevAssignedUserId = task.assignedUserId

    await prisma.task.update({
      where: { id },
      data: {
        ...fields,
        ...(fields.tagIds !== undefined && {
          Tags: {
            set: fields.tagIds.map((id) => ({ id })),
          },
        }),
      },
    })

    if (fields.assignedUserId && fields.assignedUserId !== prevAssignedUserId) {
      try {
        await createNotification({
          companyId: user.companyId!,
          unitId: task.unitId,
          type: "TASK",
          message: `Vous avez été assigné à la tâche "${task.title}"`,
          targetUserId: fields.assignedUserId,
        })
      } catch {
        // Notification failure should not block the mutation
      }
    }

    revalidateTag(unitTasksTag(task.unitId), "max")
    if (prevAssignedUserId) {
      revalidateTag(userTasksTag(prevAssignedUserId), "max")
    }
    if (fields.assignedUserId && fields.assignedUserId !== prevAssignedUserId) {
      revalidateTag(userTasksTag(fields.assignedUserId), "max")
    }
    return { success: true }
  } catch (error) {
    console.error("updateTask error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function moveTask(
  taskId: string,
  laneId: string | null,
  newOrder: number
) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, companyId: user.companyId },
    })
    if (!task) {
      return { success: false, error: "Tâche introuvable" }
    }

    // USER can only move their own tasks
    if (user.role === "USER" && task.assignedUserId !== user.id) {
      return {
        success: false,
        error: "Vous ne pouvez déplacer que vos propres tâches",
      }
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(laneId != null && { laneId }),
        order: newOrder,
      },
    })

    revalidateTag(unitTasksTag(task.unitId), "max")
    if (task.assignedUserId) {
      revalidateTag(userTasksTag(task.assignedUserId), "max")
    }
    return { success: true }
  } catch (error) {
    console.error("moveTask error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function completeTask(taskId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, companyId: user.companyId },
    })
    if (!task) {
      return { success: false, error: "Tâche introuvable" }
    }

    // USER can only complete their own tasks
    if (user.role === "USER" && task.assignedUserId !== user.id) {
      return {
        success: false,
        error: "Vous ne pouvez compléter que vos propres tâches",
      }
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { complete: !task.complete },
    })

    revalidateTag(unitTasksTag(task.unitId), "max")
    if (task.assignedUserId) {
      revalidateTag(userTasksTag(task.assignedUserId), "max")
    }
    return { success: true }
  } catch (error) {
    console.error("completeTask error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteTask(taskId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    const subscription = user.company?.subscription
    if (subscription && !isMutationAllowed(subscription.status)) {
      return {
        success: false,
        error: "Votre abonnement est en lecture seule.",
      }
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, companyId: user.companyId },
    })
    if (!task) {
      return { success: false, error: "Tâche introuvable" }
    }

    await prisma.task.delete({ where: { id: taskId } })

    revalidateTag(unitTasksTag(task.unitId), "max")
    if (task.assignedUserId) {
      revalidateTag(userTasksTag(task.assignedUserId), "max")
    }
    return { success: true }
  } catch (error) {
    console.error("deleteTask error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

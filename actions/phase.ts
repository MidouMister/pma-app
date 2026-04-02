"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { formatCurrency } from "@/lib/format"
import { phaseSchema, updatePhaseSchema } from "@/lib/validators"
import { projectPhasesTag, projectGanttTag, projectTag } from "@/lib/cache"

async function recalculatePhaseProgress(phaseId: string) {
  const subPhases = await prisma.subPhase.findMany({ where: { phaseId } })
  if (subPhases.length > 0) {
    const avgProgress = Math.round(
      subPhases.reduce((sum, sp) => sum + sp.progress, 0) / subPhases.length
    )
    await prisma.phase.update({
      where: { id: phaseId },
      data: { progress: avgProgress },
    })
  }
}

async function calculateDuration(
  startDate: Date | null,
  endDate: Date | null
): Promise<number | null> {
  if (!startDate || !endDate) return null
  return Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
}

export async function createPhase(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de créer une phase.",
        }
      }
    }

    const validation = phaseSchema.safeParse(data)
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
      return {
        success: false,
        error: "Projet introuvable ou accès non autorisé",
      }
    }

    if (
      validData.startDate &&
      project.ods &&
      validData.startDate < project.ods
    ) {
      const odsFormatted = project.ods.toLocaleDateString("fr-DZ")
      return {
        success: false,
        error: `La date de début de la phase doit être postérieure ou égale à la date ODS du projet (format: ${odsFormatted})`,
      }
    }

    const currentPhases = await prisma.phase.aggregate({
      where: { projectId: validData.projectId },
      _sum: { montantHT: true },
    })
    const currentSum = currentPhases._sum.montantHT ?? 0
    const remainingBudget = project.montantHT - currentSum

    if (validData.montantHT > remainingBudget) {
      return {
        success: false,
        error: `Le montant de la phase dépasse le budget restant du projet. Budget disponible: ${formatCurrency(remainingBudget)}`,
      }
    }

    const duration = await calculateDuration(
      validData.startDate ?? null,
      validData.endDate ?? null
    )

    await prisma.phase.create({
      data: {
        name: validData.name,
        code: validData.code,
        montantHT: validData.montantHT,
        startDate: validData.startDate,
        endDate: validData.endDate,
        status: validData.status,
        obs: validData.obs,
        progress: validData.progress,
        projectId: validData.projectId,
        duration,
      },
    })

    revalidateTag(projectPhasesTag(project.id), "max")
    revalidateTag(projectGanttTag(project.id), "max")
    revalidateTag(projectTag(project.id), "max")

    return { success: true }
  } catch (error) {
    console.error("createPhase error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de la phase",
    }
  }
}

export async function updatePhase(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de modifier la phase.",
        }
      }
    }

    const validation = updatePhaseSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const phase = await prisma.phase.findFirst({
      where: { id: validData.id },
      include: { Project: true },
    })
    if (!phase) {
      return {
        success: false,
        error: "Phase introuvable ou accès non autorisé",
      }
    }

    if (phase.Project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    if (
      validData.startDate &&
      phase.Project.ods &&
      validData.startDate < phase.Project.ods
    ) {
      const odsFormatted = phase.Project.ods.toLocaleDateString("fr-DZ")
      return {
        success: false,
        error: `La date de début de la phase doit être postérieure ou égale à la date ODS du projet (format: ${odsFormatted})`,
      }
    }

    const currentPhases = await prisma.phase.aggregate({
      where: { projectId: phase.projectId, NOT: { id: phase.id } },
      _sum: { montantHT: true },
    })
    const currentSum = currentPhases._sum.montantHT ?? 0
    const remainingBudget = phase.Project.montantHT - currentSum

    if (validData.montantHT && validData.montantHT > remainingBudget) {
      return {
        success: false,
        error: `Le montant de la phase dépasse le budget restant du projet. Budget disponible: ${formatCurrency(remainingBudget)}`,
      }
    }

    const duration = await calculateDuration(
      validData.startDate ?? phase.startDate ?? null,
      validData.endDate ?? phase.endDate ?? null
    )

    await prisma.phase.update({
      where: { id: phase.id },
      data: {
        ...(validData.name !== undefined && { name: validData.name }),
        ...(validData.code !== undefined && { code: validData.code }),
        ...(validData.montantHT !== undefined && {
          montantHT: validData.montantHT,
        }),
        ...(validData.startDate !== undefined && {
          startDate: validData.startDate,
        }),
        ...(validData.endDate !== undefined && { endDate: validData.endDate }),
        ...(validData.status !== undefined && { status: validData.status }),
        ...(validData.obs !== undefined && { obs: validData.obs }),
        ...(validData.progress !== undefined && {
          progress: validData.progress,
        }),
        ...(duration !== undefined && { duration }),
      },
    })

    await recalculatePhaseProgress(phase.id)

    revalidateTag(projectPhasesTag(phase.Project.id), "max")
    revalidateTag(projectGanttTag(phase.Project.id), "max")
    revalidateTag(projectTag(phase.Project.id), "max")

    return { success: true }
  } catch (error) {
    console.error("updatePhase error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de la phase",
    }
  }
}

export async function deletePhase(phaseId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de supprimer la phase.",
        }
      }
    }

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: { Project: true },
    })
    if (!phase) {
      return {
        success: false,
        error: "Phase introuvable ou accès non autorisé",
      }
    }

    if (phase.Project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    await prisma.phase.delete({
      where: { id: phaseId },
    })

    revalidateTag(projectPhasesTag(phase.Project.id), "max")
    revalidateTag(projectGanttTag(phase.Project.id), "max")

    return { success: true }
  } catch (error) {
    console.error("deletePhase error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression de la phase",
    }
  }
}

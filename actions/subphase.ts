"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { subPhaseSchema, updateSubPhaseSchema } from "@/lib/validators"
import { projectPhasesTag, projectTag } from "@/lib/cache"

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

export async function createSubPhase(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible de créer une sous-phase.",
        }
      }
    }

    const validation = subPhaseSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const phase = await prisma.phase.findFirst({
      where: { id: validData.phaseId },
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
      phase.startDate &&
      validData.startDate < phase.startDate
    ) {
      return {
        success: false,
        error:
          "La date de début de la sous-phase doit être postérieure à la date de début de la phase parente",
      }
    }

    if (
      validData.endDate &&
      phase.endDate &&
      validData.endDate > phase.endDate
    ) {
      return {
        success: false,
        error:
          "La date de fin de la sous-phase doit être antérieure à la date de fin de la phase parente",
      }
    }

    await prisma.subPhase.create({
      data: {
        name: validData.name,
        code: validData.code,
        status: validData.status,
        progress: validData.progress,
        startDate: validData.startDate,
        endDate: validData.endDate,
        phaseId: validData.phaseId,
      },
    })

    await recalculatePhaseProgress(phase.id)

    revalidateTag(projectPhasesTag(phase.Project.id), 'max')
    revalidateTag(projectTag(phase.Project.id), 'max')

    return { success: true }
  } catch (error) {
    console.error("createSubPhase error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de la sous-phase",
    }
  }
}

export async function updateSubPhase(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible de modifier la sous-phase.",
        }
      }
    }

    const validation = updateSubPhaseSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const subPhase = await prisma.subPhase.findFirst({
      where: { id: validData.id },
      include: { Phase: { include: { Project: true } } },
    })
    if (!subPhase) {
      return {
        success: false,
        error: "Sous-phase introuvable ou accès non autorisé",
      }
    }

    if (subPhase.Phase.Project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    if (
      validData.startDate &&
      subPhase.Phase.startDate &&
      validData.startDate < subPhase.Phase.startDate
    ) {
      return {
        success: false,
        error:
          "La date de début de la sous-phase doit être postérieure à la date de début de la phase parente",
      }
    }

    if (
      validData.endDate &&
      subPhase.Phase.endDate &&
      validData.endDate > subPhase.Phase.endDate
    ) {
      return {
        success: false,
        error:
          "La date de fin de la sous-phase doit être antérieure à la date de fin de la phase parente",
      }
    }

    await prisma.subPhase.update({
      where: { id: subPhase.id },
      data: {
        ...(validData.name !== undefined && { name: validData.name }),
        ...(validData.code !== undefined && { code: validData.code }),
        ...(validData.status !== undefined && { status: validData.status }),
        ...(validData.progress !== undefined && {
          progress: validData.progress,
        }),
        ...(validData.startDate !== undefined && {
          startDate: validData.startDate,
        }),
        ...(validData.endDate !== undefined && { endDate: validData.endDate }),
      },
    })

    await recalculatePhaseProgress(subPhase.phaseId)

    revalidateTag(projectPhasesTag(subPhase.Phase.Project.id), 'max')
    revalidateTag(projectTag(subPhase.Phase.Project.id), 'max')

    return { success: true }
  } catch (error) {
    console.error("updateSubPhase error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de la sous-phase",
    }
  }
}

export async function deleteSubPhase(subPhaseId: string) {
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
            "Votre abonnement est en lecture seule. Impossible de supprimer la sous-phase.",
        }
      }
    }

    const subPhase = await prisma.subPhase.findFirst({
      where: { id: subPhaseId },
      include: { Phase: { include: { Project: true } } },
    })
    if (!subPhase) {
      return {
        success: false,
        error: "Sous-phase introuvable ou accès non autorisé",
      }
    }

    if (subPhase.Phase.Project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    const phaseId = subPhase.phaseId

    await prisma.subPhase.delete({
      where: { id: subPhaseId },
    })

    await recalculatePhaseProgress(phaseId)

    revalidateTag(projectPhasesTag(subPhase.Phase.Project.id), 'max')
    revalidateTag(projectTag(subPhase.Phase.Project.id), 'max')

    return { success: true }
  } catch (error) {
    console.error("deleteSubPhase error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression de la sous-phase",
    }
  }
}

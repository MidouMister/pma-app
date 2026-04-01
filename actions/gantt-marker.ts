"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import {
  createGanttMarkerSchema,
  updateGanttMarkerSchema,
} from "@/lib/validators"

export async function createGanttMarker(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible de créer un marqueur.",
        }
      }
    }

    const validation = createGanttMarkerSchema.safeParse(data)
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

    await prisma.ganttMarker.create({
      data: {
        label: validData.label,
        date: validData.date,
        className: validData.className ?? null,
        projectId: validData.projectId,
      },
    })

    revalidatePath(`/unite/${project.unitId}/projects/${project.id}`)

    return { success: true }
  } catch (error) {
    console.error("createGanttMarker error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la création du marqueur",
    }
  }
}

export async function updateGanttMarker(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible de modifier le marqueur.",
        }
      }
    }

    const validation = updateGanttMarkerSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const marker = await prisma.ganttMarker.findFirst({
      where: { id: validData.id },
      include: { Project: true },
    })
    if (!marker) {
      return {
        success: false,
        error: "Marqueur introuvable ou accès non autorisé",
      }
    }

    if (marker.Project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    await prisma.ganttMarker.update({
      where: { id: marker.id },
      data: {
        ...(validData.label !== undefined && { label: validData.label }),
        ...(validData.date !== undefined && { date: validData.date }),
        ...(validData.className !== undefined && {
          className: validData.className,
        }),
        ...(validData.projectId !== undefined && {
          projectId: validData.projectId,
        }),
      },
    })

    revalidatePath(
      `/unite/${marker.Project.unitId}/projects/${marker.Project.id}`
    )

    return { success: true }
  } catch (error) {
    console.error("updateGanttMarker error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du marqueur",
    }
  }
}

export async function deleteGanttMarker(id: string) {
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
            "Votre abonnement est en lecture seule. Impossible de supprimer le marqueur.",
        }
      }
    }

    const marker = await prisma.ganttMarker.findFirst({
      where: { id },
      include: { Project: true },
    })
    if (!marker) {
      return {
        success: false,
        error: "Marqueur introuvable ou accès non autorisé",
      }
    }

    if (marker.Project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    await prisma.ganttMarker.delete({
      where: { id },
    })

    revalidatePath(
      `/unite/${marker.Project.unitId}/projects/${marker.Project.id}`
    )

    return { success: true }
  } catch (error) {
    console.error("deleteGanttMarker error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression du marqueur",
    }
  }
}

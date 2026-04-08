"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { laneSchema } from "@/lib/validators"
import { unitLanesTag } from "@/lib/cache"

export async function createLane(data: unknown) {
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

    const validation = laneSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // Verify unit belongs to company
    const unit = await prisma.unit.findFirst({
      where: { id: validData.unitId, companyId: user.companyId },
    })
    if (!unit) {
      return { success: false, error: "Unité introuvable" }
    }

    // Get max order for this unit
    const maxOrder = await prisma.lane.aggregate({
      where: { unitId: validData.unitId },
      _max: { order: true },
    })

    await prisma.lane.create({
      data: {
        name: validData.name,
        unitId: validData.unitId,
        companyId: user.companyId,
        order: (maxOrder._max.order ?? -1) + 1,
        color: validData.color,
      },
    })

    revalidateTag(unitLanesTag(validData.unitId), "max")
    return { success: true }
  } catch (error) {
    console.error("createLane error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function updateLane(data: unknown) {
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

    const { id, name, color } = data as {
      id: string
      name?: string
      color?: string | null
    }

    const lane = await prisma.lane.findFirst({
      where: { id },
      include: { Unit: true },
    })
    if (!lane || lane.Unit.companyId !== user.companyId) {
      return { success: false, error: "Colonne introuvable" }
    }

    await prisma.lane.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    })

    revalidateTag(unitLanesTag(lane.unitId), "max")
    return { success: true }
  } catch (error) {
    console.error("updateLane error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteLane(laneId: string) {
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

    const lane = await prisma.lane.findFirst({
      where: { id: laneId },
      include: { Unit: true, _count: { select: { Tasks: true } } },
    })
    if (!lane || lane.Unit.companyId !== user.companyId) {
      return { success: false, error: "Colonne introuvable" }
    }

    if (lane._count.Tasks > 0) {
      return {
        success: false,
        error: `Impossible de supprimer cette colonne car elle contient ${lane._count.Tasks} tâche(s). Déplacez-les d'abord.`,
      }
    }

    await prisma.lane.delete({ where: { id: laneId } })

    revalidateTag(unitLanesTag(lane.unitId), "max")
    return { success: true }
  } catch (error) {
    console.error("deleteLane error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function reorderLanes(unitId: string, orderedIds: string[]) {
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

    // Verify all lanes belong to this unit and company
    const lanes = await prisma.lane.findMany({
      where: { unitId, companyId: user.companyId },
      select: { id: true },
    })
    const validIds = new Set(lanes.map((l) => l.id))
    const filteredIds = orderedIds.filter((id) => validIds.has(id))

    await prisma.$transaction(
      filteredIds.map((id, index) =>
        prisma.lane.update({ where: { id }, data: { order: index } })
      )
    )

    revalidateTag(unitLanesTag(unitId), "max")
    return { success: true }
  } catch (error) {
    console.error("reorderLanes error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

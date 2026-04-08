"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { tagSchema } from "@/lib/validators"
import { unitTagsTag, unitTasksTag } from "@/lib/cache"

export async function createTag(data: unknown) {
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

    const validation = tagSchema.safeParse(data)
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

    await prisma.tag.create({
      data: {
        name: validData.name,
        color: validData.color,
        unitId: validData.unitId,
      },
    })

    revalidateTag(unitTagsTag(validData.unitId), "max")
    return { success: true }
  } catch (error) {
    console.error("createTag error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteTag(tagId: string) {
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

    const tag = await prisma.tag.findFirst({
      where: { id: tagId },
      include: { Unit: true },
    })
    if (!tag || tag.Unit.companyId !== user.companyId) {
      return { success: false, error: "Tag introuvable" }
    }

    // Detach from tasks first, then delete
    await prisma.tag.update({
      where: { id: tagId },
      data: { Task: { set: [] } },
    })

    await prisma.tag.delete({ where: { id: tagId } })

    revalidateTag(unitTagsTag(tag.unitId), "max")
    revalidateTag(unitTasksTag(tag.unitId), "max")
    return { success: true }
  } catch (error) {
    console.error("deleteTag error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

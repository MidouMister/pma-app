"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createUnitSchema, updateUnitSchema } from "@/lib/validators"
import { computeExpectedStatus, isMutationAllowed } from "@/lib/subscription"
import type { CreateUnitFormData, UpdateUnitFormData } from "@/lib/validators"

export async function createUnit(data: CreateUnitFormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Non autorisé")

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            subscription: {
              include: { Plan: true },
            },
          },
        },
      },
    })

    if (!user || !user.companyId) {
      throw new Error("Accès refusé: aucune entreprise associée")
    }

    if (user.role !== "OWNER") {
      throw new Error(
        "Accès refusé: seul le propriétaire peut créer des unités"
      )
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const expectedStatus = computeExpectedStatus(
        subscription.status as Parameters<typeof computeExpectedStatus>[0],
        subscription.endAt
      )
      if (!isMutationAllowed(expectedStatus)) {
        throw new Error(
          "Votre abonnement est en lecture seule. Veuillez mettre à jour votre plan."
        )
      }
    }

    const plan = subscription?.Plan
    if (plan && plan.maxUnits !== null) {
      const unitCount = await prisma.unit.count({
        where: { companyId: user.companyId },
      })
      if (unitCount >= plan.maxUnits) {
        throw new Error(
          `Limite d'unités atteinte (${unitCount}/${plan.maxUnits}). Veuillez mettre à jour votre plan.`
        )
      }
    }

    const validation = createUnitSchema.safeParse(data)
    if (!validation.success) {
      throw new Error(
        validation.error.issues[0]?.message ?? "Données unité invalides"
      )
    }

    const unit = await prisma.unit.create({
      data: {
        name: validation.data.name,
        address: validation.data.address,
        phone: validation.data.phone,
        email: validation.data.email,
        logo: validation.data.logo || null,
        companyId: validation.data.companyId,
      },
    })

    revalidatePath(`/company/${user.companyId}/units`)

    return { success: true, unitId: unit.id }
  } catch (error) {
    console.error("createUnit error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    }
  }
}

export async function updateUnit(data: UpdateUnitFormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Non autorisé")

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            subscription: {
              include: { Plan: true },
            },
          },
        },
      },
    })

    if (!user || !user.companyId) {
      throw new Error("Accès refusé: aucune entreprise associée")
    }

    if (user.role !== "OWNER") {
      throw new Error(
        "Accès refusé: seul le propriétaire peut modifier des unités"
      )
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const expectedStatus = computeExpectedStatus(
        subscription.status as Parameters<typeof computeExpectedStatus>[0],
        subscription.endAt
      )
      if (!isMutationAllowed(expectedStatus)) {
        throw new Error(
          "Votre abonnement est en lecture seule. Veuillez mettre à jour votre plan."
        )
      }
    }

    const validation = updateUnitSchema.safeParse(data)
    if (!validation.success) {
      throw new Error(
        validation.error.issues[0]?.message ?? "Données unité invalides"
      )
    }

    const existingUnit = await prisma.unit.findUnique({
      where: { id: validation.data.id },
      select: { companyId: true },
    })

    if (!existingUnit || existingUnit.companyId !== user.companyId) {
      throw new Error("Unité non trouvée ou accès non autorisé")
    }

    const unit = await prisma.unit.update({
      where: { id: validation.data.id },
      data: {
        name: validation.data.name,
        address: validation.data.address,
        phone: validation.data.phone,
        email: validation.data.email,
        logo: validation.data.logo || null,
      },
    })

    revalidatePath(`/company/${user.companyId}/units`)

    return { success: true, unitId: unit.id }
  } catch (error) {
    console.error("updateUnit error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    }
  }
}

export async function deleteUnit(unitId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Non autorisé")

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            subscription: {
              include: { Plan: true },
            },
          },
        },
      },
    })

    if (!user || !user.companyId) {
      throw new Error("Accès refusé: aucune entreprise associée")
    }

    if (user.role !== "OWNER") {
      throw new Error(
        "Accès refusé: seul le propriétaire peut supprimer des unités"
      )
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const expectedStatus = computeExpectedStatus(
        subscription.status as Parameters<typeof computeExpectedStatus>[0],
        subscription.endAt
      )
      if (!isMutationAllowed(expectedStatus)) {
        throw new Error(
          "Votre abonnement est en lecture seule. Veuillez mettre à jour votre plan."
        )
      }
    }

    const existingUnit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { companyId: true },
    })

    if (!existingUnit || existingUnit.companyId !== user.companyId) {
      throw new Error("Unité non trouvée ou accès non autorisé")
    }

    await prisma.unit.delete({
      where: { id: unitId },
    })

    revalidatePath(`/company/${user.companyId}/units`)

    return { success: true }
  } catch (error) {
    console.error("deleteUnit error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    }
  }
}

export async function removeMember(memberId: string, unitId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            subscription: {
              include: { Plan: true },
            },
          },
        },
      },
    })

    if (!user || !user.companyId) {
      return {
        success: false,
        error: "Vous devez appartenir à une entreprise",
      }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé: rôle insuffisant",
      }
    }

    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        unitId,
        companyId: user.companyId,
      },
    })

    if (!member) {
      return { success: false, error: "Membre introuvable" }
    }

    if (member.role === "OWNER") {
      return {
        success: false,
        error: "Impossible de retirer le propriétaire de l'unité",
      }
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { unitId: null },
    })

    await prisma.activityLog.create({
      data: {
        action: "MEMBER_REMOVED",
        entityType: "User",
        entityId: memberId,
        companyId: user.companyId,
        unitId,
        userId: user.id,
        metadata: { email: member.email },
      },
    })

    revalidatePath(`/unite/${unitId}/members`)
    revalidatePath(`/company/${user.companyId}/users`)

    return { success: true }
  } catch (error) {
    console.error("removeMember error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors du retrait du membre",
    }
  }
}

export async function reassignAdminRole(targetUserId: string, unitId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            subscription: {
              include: { Plan: true },
            },
          },
        },
      },
    })

    if (!user || !user.companyId || user.role !== "OWNER") {
      return {
        success: false,
        error:
          "Accès refusé: seul le propriétaire peut réassigner le rôle ADMIN",
      }
    }

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, companyId: user.companyId },
      select: { adminId: true },
    })

    if (!unit) {
      return { success: false, error: "Unité introuvable" }
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, unitId, companyId: user.companyId },
    })

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" }
    }

    await prisma.$transaction(async (tx) => {
      if (unit.adminId) {
        await tx.user.update({
          where: { id: unit.adminId },
          data: { role: "USER" },
        })
      }

      await tx.user.update({
        where: { id: targetUserId },
        data: { role: "ADMIN" },
      })

      await tx.unit.update({
        where: { id: unitId },
        data: { adminId: targetUserId },
      })
    })

    await prisma.activityLog.create({
      data: {
        action: "ADMIN_REASSIGNED",
        entityType: "Unit",
        entityId: unitId,
        companyId: user.companyId,
        unitId,
        userId: user.id,
        metadata: { newAdminId: targetUserId },
      },
    })

    revalidatePath(`/unite/${unitId}/members`)
    revalidatePath(`/unite/${unitId}/settings`)

    return { success: true }
  } catch (error) {
    console.error("reassignAdminRole error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la réassignation du rôle ADMIN",
    }
  }
}

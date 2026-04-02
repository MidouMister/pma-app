"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import {
  createUnitSchema,
  updateUnitSchema,
  removeMemberSchema,
} from "@/lib/validators"
import {
  companyTag,
  unitTag,
  unitMembersTag,
  companyTeamTag,
} from "@/lib/cache"

export async function createUnit(data: unknown) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    // 3. Check subscription status (block READONLY)
    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de créer une unité.",
        }
      }
    }

    // 4. Validate input
    const validation = createUnitSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // 5. Check Plan.maxUnits limit (BR-05)
    if (subscription?.Plan) {
      const maxUnits = subscription.Plan.maxUnits
      if (maxUnits !== null) {
        const currentUnitCount = await prisma.unit.count({
          where: { companyId: user.companyId },
        })

        if (currentUnitCount >= maxUnits) {
          return {
            success: false,
            error: `La limite d'unités de votre plan (${maxUnits}) est atteinte`,
          }
        }
      }
    }

    // 6. Execute create
    await prisma.unit.create({
      data: {
        name: validData.name,
        address: validData.address,
        phone: validData.phone,
        email: validData.email,
        companyId: user.companyId,
        adminId: validData.adminId ?? null,
      },
    })

    // 7. Revalidate
    revalidateTag(companyTag(user.companyId), 'max')

    return { success: true }
  } catch (error) {
    console.error("createUnit error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de l'unité",
    }
  }
}

export async function updateUnit(data: unknown) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    // 3. Check subscription status (block READONLY)
    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de modifier l'unité.",
        }
      }
    }

    // 4. Validate input
    const validation = updateUnitSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // 5. Find unit, verify it belongs to user's company (BR-01)
    const unit = await prisma.unit.findFirst({
      where: { id: validData.id, companyId: user.companyId },
    })

    if (!unit) {
      return {
        success: false,
        error: "Unité introuvable ou accès non autorisé",
      }
    }

    // 6. Execute update
    await prisma.unit.update({
      where: { id: unit.id },
      data: {
        ...(validData.name !== undefined && { name: validData.name }),
        ...(validData.address !== undefined && { address: validData.address }),
        ...(validData.phone !== undefined && { phone: validData.phone }),
        ...(validData.email !== undefined && { email: validData.email }),
        ...(validData.adminId !== undefined && {
          adminId: validData.adminId ?? null,
        }),
      },
    })

    // 7. Revalidate
    revalidateTag(unitTag(unit.id), 'max')

    return { success: true }
  } catch (error) {
    console.error("updateUnit error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de l'unité",
    }
  }
}

export async function deleteUnit(unitId: string) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.role !== "OWNER") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    // 3. Check subscription status (block READONLY)
    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de supprimer l'unité.",
        }
      }
    }

    // 4. Find unit, verify it belongs to user's company (BR-01)
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, companyId: user.companyId },
    })

    if (!unit) {
      return {
        success: false,
        error: "Unité introuvable ou accès non autorisé",
      }
    }

    // 5. Delete unit with cascade (UNIT-06)
    // Prisma schema has onDelete: Cascade on Unit relations, so deleting
    // the unit cascades to projects, tasks, clients, members
    await prisma.unit.delete({
      where: { id: unitId },
    })

    // 6. Revalidate
    revalidateTag(companyTag(user.companyId), 'max')
    revalidateTag(unitTag(unitId), 'max')

    return { success: true }
  } catch (error) {
    console.error("deleteUnit error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression de l'unité",
    }
  }
}

export async function removeMember(data: unknown) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role (OWNER/ADMIN)
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

    // 3. Check subscription status (block READONLY)
    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de retirer un membre.",
        }
      }
    }

    // 4. Validate input
    const validation = removeMemberSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // 5. Find user, verify they belong to user's company (BR-01)
    const targetUser = await prisma.user.findFirst({
      where: { id: validData.userId, companyId: user.companyId },
    })

    if (!targetUser) {
      return {
        success: false,
        error: "Utilisateur introuvable ou accès non autorisé",
      }
    }

    // 6. Remove unit membership only — do NOT delete the user (BR-16)
    // Their tasks and time entries are retained (REL-01)
    await prisma.user.update({
      where: { id: validData.userId },
      data: { unitId: null },
    })

    // 7. Revalidate
    revalidateTag(companyTag(user.companyId), 'max')
    revalidateTag(unitMembersTag(targetUser.unitId ?? ""), 'max')
    revalidateTag(companyTeamTag(user.companyId), 'max')

    return { success: true }
  } catch (error) {
    console.error("removeMember error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors du retrait du membre de l'unité",
    }
  }
}

"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { clientSchema, updateClientSchema } from "@/lib/validators"

export async function createClient(data: unknown) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role (ADMIN/OWNER only — CLT-02)
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
            "Votre abonnement est en lecture seule. Impossible de créer un client.",
        }
      }
    }

    // 4. Validate input
    const validation = clientSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // 5. Verify unit belongs to user's company (BR-01)
    const unit = await prisma.unit.findFirst({
      where: { id: validData.unitId, companyId: user.companyId },
    })

    if (!unit) {
      return {
        success: false,
        error: "Unité introuvable ou accès non autorisé",
      }
    }

    // 6. Execute create (CLT-01, CLT-03)
    await prisma.client.create({
      data: {
        name: validData.name,
        wilaya: validData.wilaya ?? null,
        phone: validData.phone ?? null,
        email: validData.email ?? null,
        unitId: validData.unitId,
        companyId: user.companyId,
      },
    })

    // 7. Revalidate
    revalidatePath(`/unite/${validData.unitId}/clients`)

    return { success: true }
  } catch (error) {
    console.error("createClient error:", error)

    // Handle unique constraint violations (CLT-03)
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint") ||
        error.message.includes("unique"))
    ) {
      return {
        success: false,
        error:
          "Un client avec ce nom ou cet email existe déjà dans cette unité",
      }
    }

    return {
      success: false,
      error: "Une erreur est survenue lors de la création du client",
    }
  }
}

export async function updateClient(data: unknown) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role (ADMIN/OWNER only — CLT-02)
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
            "Votre abonnement est en lecture seule. Impossible de modifier le client.",
        }
      }
    }

    // 4. Validate input
    const validation = updateClientSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // 5. Find client, verify it belongs to user's company (BR-01)
    const client = await prisma.client.findFirst({
      where: { id: validData.id, companyId: user.companyId },
    })

    if (!client) {
      return {
        success: false,
        error: "Client introuvable ou accès non autorisé",
      }
    }

    // 6. Execute update
    await prisma.client.update({
      where: { id: client.id },
      data: {
        ...(validData.name !== undefined && { name: validData.name }),
        ...(validData.wilaya !== undefined && { wilaya: validData.wilaya }),
        ...(validData.phone !== undefined && { phone: validData.phone }),
        ...(validData.email !== undefined && { email: validData.email }),
      },
    })

    // 7. Revalidate
    revalidatePath(`/unite/${client.unitId}/clients`)
    revalidatePath(`/unite/${client.unitId}/clients/${client.id}`)

    return { success: true }
  } catch (error) {
    console.error("updateClient error:", error)

    // Handle unique constraint violations
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint") ||
        error.message.includes("unique"))
    ) {
      return {
        success: false,
        error:
          "Un client avec ce nom ou cet email existe déjà dans cette unité",
      }
    }

    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du client",
    }
  }
}

export async function deleteClient(clientId: string) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // 2. Get user + validate role (ADMIN/OWNER only — CLT-02)
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
            "Votre abonnement est en lecture seule. Impossible de supprimer le client.",
        }
      }
    }

    // 4. Find client, verify it belongs to user's company (BR-01)
    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId: user.companyId },
      include: {
        projects: {
          where: { status: "InProgress" },
        },
      },
    })

    if (!client) {
      return {
        success: false,
        error: "Client introuvable ou accès non autorisé",
      }
    }

    // 5. Block deletion if any project is InProgress (CLT-07, BR-20)
    if (client.projects.length > 0) {
      return {
        success: false,
        error:
          "Ce client ne peut pas être supprimé car il a des projets en cours",
      }
    }

    // 6. Delete client
    await prisma.client.delete({
      where: { id: clientId },
    })

    // 7. Revalidate
    revalidatePath(`/unite/${client.unitId}/clients`)

    return { success: true }
  } catch (error) {
    console.error("deleteClient error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression du client",
    }
  }
}

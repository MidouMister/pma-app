"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { sendInvitationSchema } from "@/lib/validators"

export async function sendInvitation(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible d'inviter des membres.",
        }
      }
    }

    // 4. Validate input
    const validation = sendInvitationSchema.safeParse(data)
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

    // 6. INV-04: Check for duplicate PENDING invitation (same email + unitId)
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: validData.email,
        unitId: validData.unitId,
        status: "PENDING",
      },
    })

    if (existingInvitation) {
      return {
        success: false,
        error:
          "Une invitation est déjà en cours pour cette adresse e-mail dans cette unité",
      }
    }

    // 7. INV-08: Check Plan.maxMembers limit
    if (subscription?.Plan) {
      const maxMembers = subscription.Plan.maxMembers
      if (maxMembers !== null) {
        const currentMemberCount = await prisma.user.count({
          where: { companyId: user.companyId },
        })

        const pendingInvitationCount = await prisma.invitation.count({
          where: {
            companyId: user.companyId,
            status: "PENDING",
          },
        })

        const totalMembers = currentMemberCount + pendingInvitationCount

        if (totalMembers >= maxMembers) {
          return {
            success: false,
            error: `La limite de membres de votre plan (${maxMembers}) est atteinte`,
          }
        }
      }
    }

    // 8. Create invitation
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.invitation.create({
      data: {
        email: validData.email,
        token,
        expiresAt,
        unitId: validData.unitId,
        companyId: user.companyId,
        role: validData.role,
        status: "PENDING",
      },
    })

    // 9. Revalidate
    revalidatePath(`/unite/${validData.unitId}/settings`)
    revalidatePath(`/unite/${validData.unitId}/team`)

    return { success: true }
  } catch (error) {
    console.error("sendInvitation error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de l'envoi de l'invitation",
    }
  }
}

export async function revokeInvitation(invitationId: string) {
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

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }

    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    // 3. Find invitation, verify it belongs to user's company (BR-01)
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        companyId: user.companyId,
      },
    })

    if (!invitation) {
      return {
        success: false,
        error: "Invitation introuvable ou accès non autorisé",
      }
    }

    // 4. INV-06: Update invitation status to EXPIRED
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    })

    // 5. Revalidate
    revalidatePath(`/unite/${invitation.unitId}/settings`)
    revalidatePath(`/unite/${invitation.unitId}/team`)

    return { success: true }
  } catch (error) {
    console.error("revokeInvitation error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la révocation de l'invitation",
    }
  }
}

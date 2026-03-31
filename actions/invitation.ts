"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { sendInvitationSchema } from "@/lib/validators"
import { computeExpectedStatus, isMutationAllowed } from "@/lib/subscription"

export type SendInvitationInput = {
  email: string
  unitId: string
  role: "ADMIN" | "USER"
  jobTitle?: string | null
}

export async function sendInvitation(rawData: SendInvitationInput) {
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

    if (!user || !user.companyId || !user.company) {
      return {
        success: false,
        error: "Vous devez appartenir à une entreprise",
      }
    }

    const subscription = user.company.subscription
    if (subscription) {
      const expectedStatus = computeExpectedStatus(
        subscription.status,
        subscription.endAt
      )
      if (!isMutationAllowed(expectedStatus)) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Veuillez mettre à jour votre plan.",
          redirectTo: `/company/${user.companyId}/settings/billing`,
        }
      }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé: rôle insuffisant",
      }
    }

    const unit = await prisma.unit.findFirst({
      where: {
        id: rawData.unitId,
        companyId: user.companyId,
      },
    })

    if (!unit) {
      return { success: false, error: "Unité introuvable" }
    }

    const validation = sendInvitationSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message ??
          "Données d'invitation invalides",
      }
    }

    const { email, unitId, role, jobTitle } = validation.data

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        unitId,
        status: "PENDING",
        companyId: user.companyId,
      },
    })

    if (existingInvitation) {
      return {
        success: false,
        error:
          "Une invitation est déjà en attente pour cet email dans cette unité",
      }
    }

    if (subscription?.Plan) {
      const maxMembers = subscription.Plan.maxMembers
      if (maxMembers !== null) {
        const currentMembers = await prisma.user.count({
          where: {
            companyId: user.companyId,
            unitId,
          },
        })

        const pendingInvitations = await prisma.invitation.count({
          where: {
            companyId: user.companyId,
            unitId,
            status: "PENDING",
          },
        })

        if (currentMembers + pendingInvitations >= maxMembers) {
          return {
            success: false,
            error: `Limite de membres atteinte (${maxMembers}). Veuillez mettre à jour votre plan.`,
            redirectTo: `/company/${user.companyId}/settings/billing`,
          }
        }
      }
    }

    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.invitation.create({
      data: {
        email,
        token,
        expiresAt,
        unitId,
        companyId: user.companyId,
        role,
        jobeTilte: jobTitle ?? null,
      },
    })

    // TODO: Implement email sending via Clerk's email API
    // try {
    //   const client = await clerkClient()
    //   await client.emails.createEmail({
    //     fromName: "PMA",
    //     subject: "Vous avez été invité à rejoindre une unité",
    //     body: `Cliquez sur le lien pour accepter l'invitation: ${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
    //     toEmailAddress: email,
    //   })
    // } catch {
    //   console.warn("Failed to send invitation email — placeholder")
    // }

    await prisma.activityLog.create({
      data: {
        action: "INVITATION_SENT",
        entityType: "Invitation",
        entityId: token,
        companyId: user.companyId,
        unitId,
        userId: user.id,
        metadata: { email, role, unitId },
      },
    })

    revalidatePath(`/unite/${unitId}/members`)
    revalidatePath(`/company/${user.companyId}/users`)

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

    if (!user || !user.companyId || !user.company) {
      return {
        success: false,
        error: "Vous devez appartenir à une entreprise",
      }
    }

    const subscription = user.company.subscription
    if (subscription) {
      const expectedStatus = computeExpectedStatus(
        subscription.status,
        subscription.endAt
      )
      if (!isMutationAllowed(expectedStatus)) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Veuillez mettre à jour votre plan.",
          redirectTo: `/company/${user.companyId}/settings/billing`,
        }
      }
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé: rôle insuffisant",
      }
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        companyId: user.companyId,
      },
    })

    if (!invitation) {
      return { success: false, error: "Invitation introuvable" }
    }

    if (invitation.status !== "PENDING") {
      return {
        success: false,
        error: "Cette invitation ne peut plus être révoquée",
      }
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    })

    await prisma.activityLog.create({
      data: {
        action: "INVITATION_REVOKED",
        entityType: "Invitation",
        entityId: invitationId,
        companyId: user.companyId,
        unitId: invitation.unitId,
        userId: user.id,
        metadata: { email: invitation.email },
      },
    })

    revalidatePath(`/unite/${invitation.unitId}/members`)
    revalidatePath(`/company/${user.companyId}/users`)

    return { success: true }
  } catch (error) {
    console.error("revokeInvitation error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la révocation de l'invitation",
    }
  }
}

"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { addTeamMemberSchema } from "@/lib/validators"
import { projectTeamTag, userProjectsTag, companyTeamTag } from "@/lib/cache"

export async function addTeamMember(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible d'ajouter un membre.",
        }
      }
    }

    const validation = addTeamMemberSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const team = await prisma.team.findFirst({
      where: { projectId: validData.teamId },
      include: { project: true },
    })
    if (!team) {
      return {
        success: false,
        error: "Équipe introuvable ou accès non autorisé",
      }
    }

    if (team.project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    const unitMember = await prisma.user.findFirst({
      where: { id: validData.userId, unitId: team.project.unitId },
    })
    if (!unitMember) {
      return {
        success: false,
        error: "Cet utilisateur n'est pas membre de l'unité du projet",
      }
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: validData.userId } },
    })
    if (existingMember) {
      return {
        success: false,
        error: "Cet utilisateur est déjà dans l'équipe",
      }
    }

    await prisma.teamMember.create({
      data: {
        role: validData.roleLabel,
        teamId: team.id,
        userId: validData.userId,
      },
    })

    revalidateTag(projectTeamTag(team.project.id), 'max')
    revalidateTag(userProjectsTag(validData.userId), 'max')
    revalidateTag(companyTeamTag(user.companyId), 'max')

    return { success: true }
  } catch (error) {
    console.error("addTeamMember error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de l'ajout du membre",
    }
  }
}

export async function removeTeamMember(memberId: string) {
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
            "Votre abonnement est en lecture seule. Impossible de supprimer le membre.",
        }
      }
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { id: memberId },
      include: { team: { include: { project: true } } },
    })
    if (!teamMember) {
      return {
        success: false,
        error: "Membre introuvable ou accès non autorisé",
      }
    }

    if (teamMember.team.project.companyId !== user.companyId) {
      return {
        success: false,
        error: "Accès non autorisé",
      }
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    revalidateTag(projectTeamTag(teamMember.team.project.id), 'max')
    revalidateTag(userProjectsTag(teamMember.userId), 'max')
    revalidateTag(companyTeamTag(user.companyId), 'max')

    return { success: true }
  } catch (error) {
    console.error("removeTeamMember error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression du membre",
    }
  }
}

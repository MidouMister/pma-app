"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { projectSchema, updateProjectSchema } from "@/lib/validators"
import { unitProjectsTag, projectTag } from "@/lib/cache"

export async function createProject(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible de créer un projet.",
        }
      }
    }

    const validation = projectSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const plan = user.company?.subscription?.Plan
    if (plan && plan.maxProjects) {
      const projectCount = await prisma.project.count({
        where: { companyId: user.companyId!, archived: false },
      })
      if (projectCount >= plan.maxProjects) {
        return {
          success: false,
          error: `Vous avez atteint la limite de ${plan.maxProjects} projets pour votre abonnement. Veuillez passer à un plan supérieur.`,
        }
      }
    }

    const existingProject = await prisma.project.findFirst({
      where: { code: validData.code, unitId: validData.unitId },
    })
    if (existingProject) {
      return {
        success: false,
        error: "Un projet avec ce code existe déjà dans cette unité",
      }
    }

    const unit = await prisma.unit.findFirst({
      where: { id: validData.unitId, companyId: user.companyId },
    })
    if (!unit) {
      return {
        success: false,
        error: "Unité introuvable ou accès non autorisé",
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: validData.name,
          code: validData.code,
          type: validData.type,
          montantHT: validData.montantHT,
          montantTTC: validData.montantTTC,
          ods: validData.ods,
          delaiMonths: validData.delaiMonths,
          delaiDays: validData.delaiDays,
          status: validData.status,
          signe: validData.signe,
          clientId: validData.clientId,
          unitId: validData.unitId,
          companyId: user.companyId!,
        },
      })
      await tx.team.create({
        data: { projectId: project.id },
      })
      return project
    })

    void result

    revalidateTag(unitProjectsTag(validData.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("createProject error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la création du projet",
    }
  }
}

export async function updateProject(data: unknown) {
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
            "Votre abonnement est en lecture seule. Impossible de modifier le projet.",
        }
      }
    }

    const validation = updateProjectSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    const project = await prisma.project.findFirst({
      where: { id: validData.id, companyId: user.companyId },
    })

    if (!project) {
      return {
        success: false,
        error: "Projet introuvable ou accès non autorisé",
      }
    }

    const validStatuses = ["New", "InProgress", "Pause", "Complete"]
    if (validData.status && !validStatuses.includes(validData.status)) {
      return {
        success: false,
        error: "Statut invalide",
      }
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(validData.name !== undefined && { name: validData.name }),
        ...(validData.code !== undefined && { code: validData.code }),
        ...(validData.type !== undefined && { type: validData.type }),
        ...(validData.montantHT !== undefined && {
          montantHT: validData.montantHT,
        }),
        ...(validData.montantTTC !== undefined && {
          montantTTC: validData.montantTTC,
        }),
        ...(validData.ods !== undefined && { ods: validData.ods }),
        ...(validData.delaiMonths !== undefined && {
          delaiMonths: validData.delaiMonths,
        }),
        ...(validData.delaiDays !== undefined && {
          delaiDays: validData.delaiDays,
        }),
        ...(validData.status !== undefined && { status: validData.status }),
        ...(validData.signe !== undefined && { signe: validData.signe }),
        ...(validData.clientId !== undefined && {
          clientId: validData.clientId,
        }),
        ...(validData.unitId !== undefined && { unitId: validData.unitId }),
      },
    })

    revalidateTag(projectTag(project.id), "max")
    revalidateTag(unitProjectsTag(project.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("updateProject error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour du projet",
    }
  }
}

export async function archiveProject(projectId: string) {
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
            "Votre abonnement est en lecture seule. Impossible d'archiver le projet.",
        }
      }
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
    })

    if (!project) {
      return {
        success: false,
        error: "Projet introuvable ou accès non autorisé",
      }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { archived: true },
    })

    revalidateTag(unitProjectsTag(project.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("archiveProject error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de l'archivage du projet",
    }
  }
}

export async function getProjects(unitId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const baseWhere = { companyId: user.companyId, archived: false }

    if (user.role === "OWNER") {
      const projects = await prisma.project.findMany({
        where: baseWhere,
        include: {
          phases: true,
          Client: true,
          team: {
            include: {
              members: {
                include: { user: true },
              },
            },
          },
          Unit: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return { success: true, projects }
    } else if (user.role === "ADMIN") {
      const projects = await prisma.project.findMany({
        where: { ...baseWhere, unitId },
        include: {
          phases: true,
          Client: true,
          team: {
            include: {
              members: {
                include: { user: true },
              },
            },
          },
          Unit: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return { success: true, projects }
    } else {
      const projects = await prisma.project.findMany({
        where: {
          ...baseWhere,
          unitId,
          team: {
            members: {
              some: { userId: user.id },
            },
          },
        },
        include: {
          phases: true,
          Client: true,
          team: {
            include: {
              members: {
                include: { user: true },
              },
            },
          },
          Unit: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return { success: true, projects }
    }
  } catch (error) {
    console.error("getProjects error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération des projets",
    }
  }
}

export async function getProject(projectId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
      include: {
        phases: {
          include: {
            SubPhases: true,
          },
          orderBy: { startDate: "asc" },
        },
        Client: true,
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
        Unit: true,
      },
    })

    if (!project) {
      return { success: false, error: "Projet introuvable" }
    }

    return { success: true, project }
  } catch (error) {
    console.error("getProject error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération du projet",
    }
  }
}

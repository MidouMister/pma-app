"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { updateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { createDocumentSchema } from "@/lib/validators"
import { projectDocumentsTag, projectTag } from "@/lib/cache"

export async function createDocument(data: unknown) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Utilisateur non trouvé" }
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }
    if (!user.companyId) {
      return { success: false, error: "Aucune entreprise associée" }
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return { success: false, error: "Abonnement en lecture seule" }
      }
    }

    const validation = createDocumentSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // Verify project belongs to this company
    const project = await prisma.project.findFirst({
      where: { id: validData.projectId, companyId: user.companyId },
    })
    if (!project) {
      return { success: false, error: "Projet introuvable" }
    }

    await prisma.projectDocument.create({
      data: {
        name: validData.name,
        url: validData.url,
        size: validData.size,
        type: validData.type,
        projectId: validData.projectId,
        companyId: user.companyId!,
      },
    })

    updateTag(projectDocumentsTag(validData.projectId))
    updateTag(projectTag(validData.projectId))

    return { success: true }
  } catch (error) {
    console.error("createDocument error:", error)
    return { success: false, error: "Erreur lors de l'ajout du document" }
  }
}

export async function deleteDocument(documentId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Utilisateur non trouvé" }
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return { success: false, error: "Accès refusé" }
    }
    if (!user.companyId) {
      return { success: false, error: "Aucune entreprise associée" }
    }

    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return { success: false, error: "Abonnement en lecture seule" }
      }
    }

    const doc = await prisma.projectDocument.findFirst({
      where: { id: documentId, companyId: user.companyId },
    })
    if (!doc) {
      return { success: false, error: "Document introuvable" }
    }

    await prisma.projectDocument.delete({ where: { id: documentId } })

    updateTag(projectDocumentsTag(doc.projectId))
    updateTag(projectTag(doc.projectId))

    return { success: true }
  } catch (error) {
    console.error("deleteDocument error:", error)
    return {
      success: false,
      error: "Erreur lors de la suppression du document",
    }
  }
}

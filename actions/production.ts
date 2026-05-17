"use server"

import { auth } from "@clerk/nextjs/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { z } from "zod"
import { phaseProductionTag, unitProductionsTag } from "@/lib/cache"
import { createNotification } from "@/actions/notification"

const createProductSchema = z.object({
  phaseId: z.string().uuid("Phase invalide"),
  taux: z
    .number()
    .min(0, "Le taux doit être entre 0 et 100")
    .max(100, "Le taux doit être entre 0 et 100"),
  date: z.date(),
})

const updateProductSchema = z.object({
  id: z.string().uuid("Produit invalide"),
  taux: z
    .number()
    .min(0, "Le taux doit être entre 0 et 100")
    .max(100, "Le taux doit être entre 0 et 100")
    .optional(),
  date: z.date().optional(),
})

const createProductionSchema = z.object({
  productId: z.string().uuid("Produit invalide"),
  phaseId: z.string().uuid("Phase invalide"),
  taux: z
    .number()
    .min(0, "Le taux doit être entre 0 et 100")
    .max(100, "Le taux doit être entre 0 et 100"),
  date: z.date(),
})

const updateProductionSchema = z.object({
  id: z.string().uuid("Production invalide"),
  taux: z
    .number()
    .min(0, "Le taux doit être entre 0 et 100")
    .max(100, "Le taux doit être entre 0 et 100")
    .optional(),
  date: z.date().optional(),
})

function calcMontant(montantHT: number, taux: number) {
  return montantHT * (taux / 100)
}

export async function createProduct(data: unknown) {
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

    const validation = createProductSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { phaseId, taux, date } = validation.data

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: { Project: { select: { companyId: true, unitId: true } } },
    })
    if (!phase || phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Phase introuvable" }
    }

    const existingProduct = await prisma.product.findUnique({
      where: { phaseId },
    })
    if (existingProduct) {
      return {
        success: false,
        error: "Un produit existe déjà pour cette phase",
      }
    }

    const montantProd = calcMontant(phase.montantHT, taux)

    const product = await prisma.product.create({
      data: { date, taux, montantProd, phaseId },
    })

    revalidateTag(phaseProductionTag(phaseId), "max")
    revalidateTag(unitProductionsTag(phase.Project.unitId), "max")

    return { success: true, productId: product.id }
  } catch (error) {
    console.error("createProduct error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function updateProduct(data: unknown) {
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

    const validation = updateProductSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { id, taux, date } = validation.data

    const product = await prisma.product.findFirst({
      where: { id },
      include: {
        Phase: {
          include: { Project: { select: { companyId: true, unitId: true } } },
        },
      },
    })
    if (!product || product.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Produit introuvable" }
    }

    const updateData: { taux?: number; montantProd?: number; date?: Date } = {}

    if (taux !== undefined) {
      updateData.taux = taux
      updateData.montantProd = calcMontant(product.Phase.montantHT, taux)
    }

    if (date !== undefined) {
      updateData.date = date
    }

    await prisma.product.update({ where: { id }, data: updateData })

    revalidateTag(phaseProductionTag(product.phaseId), "max")
    revalidateTag(unitProductionsTag(product.Phase.Project.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("updateProduct error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteProduct(productId: string) {
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

    const product = await prisma.product.findFirst({
      where: { id: productId },
      include: {
        Phase: {
          include: { Project: { select: { companyId: true, unitId: true } } },
        },
      },
    })
    if (!product || product.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Produit introuvable" }
    }

    await prisma.product.delete({ where: { id: productId } })

    revalidateTag(phaseProductionTag(product.phaseId), "max")
    revalidateTag(unitProductionsTag(product.Phase.Project.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("deleteProduct error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function createProduction(data: unknown) {
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

    const validation = createProductionSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { productId, phaseId, taux } = validation.data

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: {
        Project: { select: { companyId: true, unitId: true } },
        Product: true,
      },
    })
    if (!phase || phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Phase introuvable" }
    }
    if (!phase.Product) {
      return { success: false, error: "Aucun produit trouvé pour cette phase" }
    }

    const mntProd = calcMontant(phase.montantHT, taux)

    const production = await prisma.production.create({
      data: { date: validation.data.date, taux, mntProd, phaseId, productId },
    })

    const threshold =
      (phase.Product.taux * (user.company?.productionAlertThreshold ?? 80)) /
      100
    if (taux < threshold) {
      await createNotification({
        companyId: user.companyId,
        unitId: phase.Project.unitId,
        type: "PRODUCTION",
        message: `Production en dessous du seuil pour ${phase.name}`,
        targetRole: "OWNER",
      })
    }

    revalidateTag(phaseProductionTag(phaseId), "max")
    revalidateTag(unitProductionsTag(phase.Project.unitId), "max")

    return { success: true, productionId: production.id }
  } catch (error) {
    console.error("createProduction error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function updateProduction(data: unknown) {
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

    const validation = updateProductionSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { id, taux, date } = validation.data

    const production = await prisma.production.findFirst({
      where: { id },
      include: {
        Phase: {
          include: {
            Project: { select: { companyId: true, unitId: true } },
            Product: true,
          },
        },
      },
    })
    if (!production || production.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Production introuvable" }
    }

    const updateData: { taux?: number; mntProd?: number; date?: Date } = {}

    if (taux !== undefined) {
      updateData.taux = taux
      updateData.mntProd = calcMontant(production.Phase.montantHT, taux)
    }

    if (date !== undefined) {
      updateData.date = date
    }

    await prisma.production.update({ where: { id }, data: updateData })

    const newTaux = taux ?? production.taux
    const product = production.Phase.Product
    if (product) {
      const threshold =
        (product.taux * (user.company?.productionAlertThreshold ?? 80)) / 100
      if (newTaux < threshold) {
        await createNotification({
          companyId: user.companyId,
          unitId: production.Phase.Project.unitId,
          type: "PRODUCTION",
          message: `Production en dessous du seuil pour ${production.Phase.name}`,
          targetRole: "OWNER",
        })
      }
    }

    revalidateTag(phaseProductionTag(production.phaseId), "max")
    revalidateTag(unitProductionsTag(production.Phase.Project.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("updateProduction error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteProduction(productionId: string) {
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

    const production = await prisma.production.findFirst({
      where: { id: productionId },
      include: {
        Phase: {
          include: { Project: { select: { companyId: true, unitId: true } } },
        },
      },
    })
    if (!production || production.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Production introuvable" }
    }

    await prisma.production.delete({ where: { id: productionId } })

    revalidateTag(phaseProductionTag(production.phaseId), "max")
    revalidateTag(unitProductionsTag(production.Phase.Project.unitId), "max")

    return { success: true }
  } catch (error) {
    console.error("deleteProduction error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

type PhaseProductResult =
  | {
      success: true
      data: Prisma.ProductGetPayload<{
        include: { Productions: { orderBy: { date: "asc" } } }
      }> | null
    }
  | { success: false; error: string }

export async function getPhaseProduction(
  phaseId: string
): Promise<PhaseProductResult> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Non autorisé" }

    const user = await getCurrentUser()
    if (!user || !user.companyId) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: { Project: { select: { companyId: true } } },
    })
    if (!phase || phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Phase introuvable" }
    }

    const product = await prisma.product.findUnique({
      where: { phaseId },
      include: {
        Productions: {
          orderBy: { date: "asc" as const },
        },
      },
    })

    return { success: true, data: product }
  } catch (error) {
    console.error("getPhaseProduction error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function getUnitProductions(unitId: string) {
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

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, companyId: user.companyId },
    })
    if (!unit) {
      return { success: false, error: "Unité introuvable" }
    }

    const productions = await prisma.production.findMany({
      where: { Phase: { Project: { unitId } } },
      include: {
        Phase: {
          select: {
            id: true,
            name: true,
            montantHT: true,
            Project: { select: { id: true, name: true } },
          },
        },
        Product: true,
      },
      orderBy: { date: "desc" },
    })

    return { success: true, data: productions }
  } catch (error) {
    console.error("getUnitProductions error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

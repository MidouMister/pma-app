"use server"

import { auth } from "@clerk/nextjs/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import {
  createProductionSchema,
  updateProductionSchema,
  bulkForecastSchema,
  bulkUnitForecastSchema,
  bulkUnitProductionSchema,
} from "@/lib/validators"
import {
  phaseProductionTag,
  unitProductionsTag,
  unitForecastsTag,
  phaseForecastsTag,
  projectTag,
  projectPhasesTag,
} from "@/lib/cache"
import { createNotification } from "@/actions/notification"

import { calcMontant, recalculateProduct } from "@/lib/production-utils"

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

    const { phaseId, taux, month, year } = validation.data

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: {
        Project: { select: { id: true, companyId: true, unitId: true } },
      },
    })

    if (!phase || phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Phase introuvable" }
    }

    // Check if production already exists for this month/year
    const existing = await prisma.production.findUnique({
      where: {
        phaseId_month_year: {
          phaseId,
          month,
          year,
        },
      },
    })
    if (existing) {
      return {
        success: false,
        error: "Une production existe déjà pour cette période (mois/année)",
      }
    }

    const mntProd = calcMontant(phase.montantHT, taux)

    // Execute in transaction to ensure Product exists and is updated
    const result = await prisma.$transaction(async (tx) => {
      // Find or create product row first since it is required by Production
      let product = await tx.product.findUnique({
        where: { phaseId },
      })
      if (!product) {
        product = await tx.product.create({
          data: {
            phaseId,
            taux: 0,
            montantProd: 0,
          },
        })
      }

      const production = await tx.production.create({
        data: {
          month,
          year,
          taux,
          mntProd,
          phaseId,
          productId: product.id,
        },
      })

      await recalculateProduct(phaseId, tx)

      return production
    })

    // Check threshold alert based on ProductionForecast
    const forecast = await prisma.productionForecast.findUnique({
      where: {
        phaseId_month_year: {
          phaseId,
          month,
          year,
        },
      },
    })

    if (forecast) {
      const alertThreshold = user.company?.productionAlertThreshold ?? 80
      const thresholdTaux = (forecast.taux * alertThreshold) / 100
      if (taux < thresholdTaux) {
        await createNotification({
          companyId: user.companyId,
          unitId: phase.Project.unitId,
          type: "PRODUCTION",
          message: `Production sous le seuil pour la phase ${phase.name} (${taux}% vs prévu ${forecast.taux}%)`,
          targetRole: "OWNER",
        })
      }
    }

    revalidateTag(phaseProductionTag(phaseId), "max")
    revalidateTag(unitProductionsTag(phase.Project.unitId), "max")
    revalidateTag(projectTag(phase.Project.id), "max")
    revalidateTag(projectPhasesTag(phase.Project.id), "max")

    return { success: true, productionId: result.id }
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

    const { id, taux, month, year } = validation.data

    const production = await prisma.production.findFirst({
      where: { id },
      include: {
        Phase: {
          include: {
            Project: { select: { id: true, companyId: true, unitId: true } },
          },
        },
      },
    })

    if (!production || production.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Production introuvable" }
    }

    const nextMonth = month ?? production.month
    const nextYear = year ?? production.year

    // If month or year changed, check uniqueness
    if (nextMonth !== production.month || nextYear !== production.year) {
      const existing = await prisma.production.findUnique({
        where: {
          phaseId_month_year: {
            phaseId: production.phaseId,
            month: nextMonth,
            year: nextYear,
          },
        },
      })
      if (existing && existing.id !== id) {
        return {
          success: false,
          error: "Une production existe déjà pour cette période (mois/année)",
        }
      }
    }

    const updateData: {
      taux?: number
      mntProd?: number
      month?: number
      year?: number
    } = {}
    if (taux !== undefined) {
      updateData.taux = taux
      updateData.mntProd = calcMontant(production.Phase.montantHT, taux)
    }
    if (month !== undefined) updateData.month = month
    if (year !== undefined) updateData.year = year

    await prisma.$transaction(async (tx) => {
      await tx.production.update({
        where: { id },
        data: updateData,
      })
      await recalculateProduct(production.phaseId, tx)
    })

    // Check threshold alert if taux changed
    const newTaux = taux ?? production.taux
    const forecast = await prisma.productionForecast.findUnique({
      where: {
        phaseId_month_year: {
          phaseId: production.phaseId,
          month: nextMonth,
          year: nextYear,
        },
      },
    })

    if (forecast) {
      const alertThreshold = user.company?.productionAlertThreshold ?? 80
      const thresholdTaux = (forecast.taux * alertThreshold) / 100
      if (newTaux < thresholdTaux) {
        await createNotification({
          companyId: user.companyId,
          unitId: production.Phase.Project.unitId,
          type: "PRODUCTION",
          message: `Production sous le seuil pour la phase ${production.Phase.name} (${newTaux}% vs prévu ${forecast.taux}%)`,
          targetRole: "OWNER",
        })
      }
    }

    revalidateTag(phaseProductionTag(production.phaseId), "max")
    revalidateTag(unitProductionsTag(production.Phase.Project.unitId), "max")
    revalidateTag(projectTag(production.Phase.Project.id), "max")
    revalidateTag(projectPhasesTag(production.Phase.Project.id), "max")

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
          include: {
            Project: { select: { id: true, companyId: true, unitId: true } },
          },
        },
      },
    })

    if (!production || production.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Production introuvable" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.production.delete({
        where: { id: productionId },
      })
      await recalculateProduct(production.phaseId, tx)
    })

    revalidateTag(phaseProductionTag(production.phaseId), "max")
    revalidateTag(unitProductionsTag(production.Phase.Project.unitId), "max")
    revalidateTag(projectTag(production.Phase.Project.id), "max")
    revalidateTag(projectPhasesTag(production.Phase.Project.id), "max")

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
        include: {
          Productions: {
            orderBy: [{ year: "asc" }, { month: "asc" }]
          }
        }
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
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    })

    return { success: true, data: product }
  } catch (error) {
    console.error("getPhaseProduction error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteProduct(phaseId: string) {
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

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: {
        Project: { select: { id: true, companyId: true, unitId: true } },
      },
    })

    if (!phase || phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Phase introuvable" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.production.deleteMany({
        where: { phaseId },
      })
      await tx.product.deleteMany({
        where: { phaseId },
      })
    })

    revalidateTag(phaseProductionTag(phaseId), "max")
    revalidateTag(unitProductionsTag(phase.Project.unitId), "max")
    revalidateTag(projectTag(phase.Project.id), "max")
    revalidateTag(projectPhasesTag(phase.Project.id), "max")

    return { success: true }
  } catch (error) {
    console.error("deleteProduct error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function deleteProductionForecast(forecastId: string) {
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

    const forecast = await prisma.productionForecast.findFirst({
      where: { id: forecastId },
      include: {
        Phase: {
          include: {
            Project: { select: { companyId: true, unitId: true } },
          },
        },
      },
    })

    if (!forecast || forecast.Phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Prévision introuvable" }
    }

    await prisma.productionForecast.delete({
      where: { id: forecastId },
    })

    revalidateTag(phaseForecastsTag(forecast.phaseId), "max")
    revalidateTag(unitForecastsTag(forecast.Phase.Project.unitId), "max")
    revalidateTag(phaseProductionTag(forecast.phaseId), "max")

    return { success: true }
  } catch (error) {
    console.error("deleteProductionForecast error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

/* ==========================================================================
   PRODUCTION FORECAST ACTIONS
   ========================================================================== */

export async function bulkCreateForecasts(data: unknown) {
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

    const validation = bulkForecastSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { phaseId, year, forecasts } = validation.data

    const phase = await prisma.phase.findFirst({
      where: { id: phaseId },
      include: {
        Project: { select: { id: true, companyId: true, unitId: true } },
      },
    })

    if (!phase || phase.Project.companyId !== user.companyId) {
      return { success: false, error: "Phase introuvable" }
    }

    // Execute upserts in a transaction
    await prisma.$transaction(
      forecasts.map((f) => {
        const mntProd = calcMontant(phase.montantHT, f.taux)
        return prisma.productionForecast.upsert({
          where: {
            phaseId_month_year: {
              phaseId,
              month: f.month,
              year,
            },
          },
          create: {
            phaseId,
            month: f.month,
            year,
            taux: f.taux,
            mntProd,
          },
          update: {
            taux: f.taux,
            mntProd,
          },
        })
      })
    )

    revalidateTag(phaseForecastsTag(phaseId), "max")
    revalidateTag(unitForecastsTag(phase.Project.unitId), "max")
    revalidateTag(phaseProductionTag(phaseId), "max")
    revalidateTag(projectTag(phase.Project.id), "max")
    revalidateTag(projectPhasesTag(phase.Project.id), "max")

    return { success: true }
  } catch (error) {
    console.error("bulkCreateForecasts error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function bulkUpdateUnitForecasts(data: unknown) {
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

    const validation = bulkUnitForecastSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { unitId, year, phases } = validation.data

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, companyId: user.companyId },
    })

    if (!unit) {
      return { success: false, error: "Unité introuvable" }
    }

    // Load all submitted phases to get their montantHT
    const phaseIds = phases.map((p) => p.phaseId)
    const dbPhases = await prisma.phase.findMany({
      where: {
        id: { in: phaseIds },
        Project: { unitId, companyId: user.companyId },
      },
      select: { id: true, montantHT: true },
    })

    const phaseMontants = new Map<string, number>()
    dbPhases.forEach((p) => phaseMontants.set(p.id, p.montantHT))

    // Prepare upsert operations
    const operations = phases.flatMap((phase) => {
      const montantHT = phaseMontants.get(phase.phaseId)
      if (montantHT === undefined) return []

      return phase.forecasts.map((f) => {
        const mntProd = calcMontant(montantHT, f.taux)
        return prisma.productionForecast.upsert({
          where: {
            phaseId_month_year: {
              phaseId: phase.phaseId,
              month: f.month,
              year,
            },
          },
          create: {
            phaseId: phase.phaseId,
            month: f.month,
            year,
            taux: f.taux,
            mntProd,
          },
          update: {
            taux: f.taux,
            mntProd,
          },
        })
      })
    })

    // Execute in transaction
    await prisma.$transaction(operations)

    revalidateTag(unitForecastsTag(unitId), "max")
    // Revalidate per-phase forecast tags so phase-level cached queries are fresh
    for (const pid of phaseIds) {
      revalidateTag(phaseForecastsTag(pid), "max")
      revalidateTag(phaseProductionTag(pid), "max")
    }

    return { success: true }
  } catch (error) {
    console.error("bulkUpdateUnitForecasts error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function bulkUpdateUnitProductions(data: unknown) {
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

    const validation = bulkUnitProductionSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const { unitId, year, phases } = validation.data

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, companyId: user.companyId },
    })

    if (!unit) {
      return { success: false, error: "Unité introuvable" }
    }

    const threshold = user.company?.productionAlertThreshold ?? 80

    // Load phases and forecasts
    const phaseIds = phases.map((p) => p.phaseId)
    const dbPhases = await prisma.phase.findMany({
      where: {
        id: { in: phaseIds },
        Project: { unitId, companyId: user.companyId },
      },
      select: {
        id: true,
        name: true,
        montantHT: true,
        Project: { select: { id: true, name: true } },
      },
    })

    const phaseMap = new Map<string, (typeof dbPhases)[0]>()
    dbPhases.forEach((p) => phaseMap.set(p.id, p))

    // Collect unique project IDs for cache invalidation
    const projectIds = new Set<string>()
    dbPhases.forEach((p) => projectIds.add(p.Project.id))

    const forecasts = await prisma.productionForecast.findMany({
      where: { phaseId: { in: phaseIds }, year },
    })

    const notificationsToCreate: Array<{
      phaseName: string
      projectName: string
      month: number
      taux: number
      prev: number
    }> = []

    await prisma.$transaction(async (tx) => {
      for (const phaseInput of phases) {
        const phaseDb = phaseMap.get(phaseInput.phaseId)
        if (!phaseDb) continue

        // Ensure Product exists for this phase before looping over productions
        const product = await tx.product.upsert({
          where: { phaseId: phaseInput.phaseId },
          create: {
            phaseId: phaseInput.phaseId,
            taux: 0,
            montantProd: 0,
          },
          update: {},
          select: { id: true },
        })

        for (const prodInput of phaseInput.productions) {
          const mntProd = calcMontant(phaseDb.montantHT, prodInput.taux)

          await tx.production.upsert({
            where: {
              phaseId_month_year: {
                phaseId: phaseInput.phaseId,
                month: prodInput.month,
                year,
              },
            },
            create: {
              phaseId: phaseInput.phaseId,
              productId: product.id,
              month: prodInput.month,
              year,
              taux: prodInput.taux,
              mntProd,
            },
            update: {
              taux: prodInput.taux,
              mntProd,
            },
          })

          // Check alert
          const forecast = forecasts.find(
            (f) =>
              f.phaseId === phaseInput.phaseId && f.month === prodInput.month
          )
          if (forecast && forecast.taux > 0) {
            const minRequired = (forecast.taux * threshold) / 100
            if (prodInput.taux < minRequired) {
              notificationsToCreate.push({
                phaseName: phaseDb.name,
                projectName: phaseDb.Project.name,
                month: prodInput.month,
                taux: prodInput.taux,
                prev: forecast.taux,
              })
            }
          }
        }

        // Recalculate Product for the phase
        await recalculateProduct(phaseInput.phaseId, tx)
      }
    })

    // Dispatch notifications after transaction
    for (const notif of notificationsToCreate) {
      await createNotification({
        companyId: user.companyId,
        unitId,
        type: "PRODUCTION",
        targetRole: "OWNER",
        message: `Alerte Production : ${notif.projectName} - ${notif.phaseName} (Mois ${notif.month}/${year}). Taux réel (${notif.taux}%) inférieur aux ${threshold}% du prévisionnel (${notif.prev}%).`,
      }).catch((err) => console.error("Notification fail:", err))
    }

    revalidateTag(unitProductionsTag(unitId), "max")

    // Revalidate per-phase and per-project tags
    for (const phaseId of phaseIds) {
      revalidateTag(phaseProductionTag(phaseId), "max")
    }
    for (const projectId of projectIds) {
      revalidateTag(projectTag(projectId), "max")
      revalidateTag(projectPhasesTag(projectId), "max")
    }

    return { success: true }
  } catch (error) {
    console.error("bulkUpdateUnitProductions error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function getPhaseForecasts(phaseId: string) {
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

    const forecasts = await prisma.productionForecast.findMany({
      where: { phaseId },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    })

    return { success: true, data: forecasts }
  } catch (error) {
    console.error("getPhaseForecasts error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function getUnitForecasts(unitId: string, year: number) {
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

    const forecasts = await prisma.productionForecast.findMany({
      where: {
        Phase: { Project: { unitId } },
        year,
      },
      include: {
        Phase: {
          select: {
            id: true,
            name: true,
            montantHT: true,
            Project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ month: "asc" }],
    })

    return { success: true, data: forecasts }
  } catch (error) {
    console.error("getUnitForecasts error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

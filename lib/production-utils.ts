// Shared production calculation utilities
// Used by actions/production.ts and actions/phase.ts
// No "use server" directive — these are pure helpers + Prisma helpers

import type { Prisma } from "@prisma/client"
import { prisma } from "./prisma"

export function calcMontant(montantHT: number, taux: number) {
  return montantHT * (taux / 100)
}

/**
 * Recalculate the Product aggregate for a Phase.
 * Product.taux = SUM(Production.taux)
 * Product.montantProd = Phase.montantHT * (Product.taux / 100)
 */
export async function recalculateProduct(
  phaseId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma

  const phase = await client.phase.findUnique({
    where: { id: phaseId },
    select: { montantHT: true },
  })

  if (!phase) {
    throw new Error("Phase introuvable")
  }

  const productions = await client.production.findMany({
    where: { phaseId },
    select: { taux: true },
  })

  const totalTaux = productions.reduce((sum, p) => sum + p.taux, 0)
  const totalMontantProd = calcMontant(phase.montantHT, totalTaux)

  const product = await client.product.upsert({
    where: { phaseId },
    create: {
      phaseId,
      taux: totalTaux,
      montantProd: totalMontantProd,
    },
    update: {
      taux: totalTaux,
      montantProd: totalMontantProd,
    },
  })

  // Sync Phase.progress from production data so that the progression card
  // and phase list reflect actual production completion.
  // Phase.progress is an Int (0-100), Product.taux is a Float (0-100).
  await client.phase.update({
    where: { id: phaseId },
    data: { progress: Math.round(totalTaux) },
  })

  return product
}

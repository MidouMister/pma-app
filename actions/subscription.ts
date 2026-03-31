"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface UpgradeRequestInput {
  companyId: string
  targetPlan: string
  paymentMethod: string
  phone: string
  email: string
  notes?: string
}

export async function submitUpgradeRequest(data: UpgradeRequestInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Non autorisé")

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

  if (!user || user.role !== "OWNER") {
    throw new Error("Accès non autorisé")
  }

  if (!user.company || user.company.id !== data.companyId) {
    throw new Error("Entreprise non trouvée")
  }

  const targetPlan = await prisma.plan.findFirst({
    where: {
      name: data.targetPlan,
    },
  })

  if (!targetPlan) {
    throw new Error("Plan non trouvé")
  }

  if (targetPlan.name === "Starter") {
    throw new Error("La rétrogradation vers Starter n'est pas autorisée")
  }

  await prisma.upgradeRequest.create({
    data: {
      companyId: data.companyId,
      userId: user.id,
      targetPlanId: targetPlan.id,
      paymentMethod: data.paymentMethod,
      phone: data.phone,
      email: data.email,
      notes: data.notes || null,
      status: "PENDING",
    },
  })

  revalidatePath(`/company/${data.companyId}/settings/billing`)
}

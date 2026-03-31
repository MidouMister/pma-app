"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { updateCompanySchema } from "@/lib/validators"
import { revalidatePath } from "next/cache"
import { isMutationAllowed } from "@/lib/subscription"
import { computeExpectedStatus } from "@/lib/subscription"

type UpdateCompanyInput = {
  companyId: string
  data: Record<string, unknown>
}

export async function updateCompany(input: UpdateCompanyInput) {
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

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.companyId !== input.companyId) {
      return { success: false, error: "Accès refusé: entreprise invalide" }
    }

    if (user.role !== "OWNER") {
      return { success: false, error: "Accès refusé: réservé au propriétaire" }
    }

    if (user.company?.subscription) {
      const expectedStatus = computeExpectedStatus(
        user.company.subscription.status as Parameters<
          typeof computeExpectedStatus
        >[0],
        user.company.subscription.endAt
      )
      if (!isMutationAllowed(expectedStatus)) {
        return {
          success: false,
          error:
            "Votre compte est en lecture seule. Veuillez mettre à jour votre abonnement.",
        }
      }
    }

    const validation = updateCompanySchema.safeParse(input.data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const {
      name,
      companyEmail,
      companyAddress,
      companyPhone,
      state,
      formJur,
      nif,
      secteur,
      logo,
      productionAlertThreshold,
    } = validation.data

    await prisma.company.update({
      where: { id: input.companyId },
      data: {
        name,
        companyEmail,
        companyAddress,
        companyPhone,
        state,
        formJur,
        nif,
        secteur,
        logo,
        productionAlertThreshold,
      },
    })

    revalidatePath(`/company/${input.companyId}/settings`)
    revalidatePath(`/company/${input.companyId}`)

    return { success: true }
  } catch (error) {
    console.error("Update company error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour",
    }
  }
}

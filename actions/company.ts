"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { isMutationAllowed } from "@/lib/subscription"
import { updateCompanySchema } from "@/lib/validators"

export async function updateCompany(data: unknown) {
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

    if (user.role !== "OWNER") {
      return { success: false, error: "Accès refusé" }
    }

    // 3. Validate companyId matches user's company
    if (!user.companyId) {
      return {
        success: false,
        error: "Aucune entreprise associée à votre compte",
      }
    }

    // 4. Check subscription status (block READONLY)
    const subscription = user.company?.subscription
    if (subscription) {
      const allowed = isMutationAllowed(subscription.status)
      if (!allowed) {
        return {
          success: false,
          error:
            "Votre abonnement est en lecture seule. Impossible de modifier les paramètres.",
        }
      }
    }

    // 5. Validate input
    const validation = updateCompanySchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message ?? "Données invalides",
      }
    }

    const validData = validation.data

    // 6. Execute update
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        ...(validData.name !== undefined && { name: validData.name }),
        ...(validData.logo !== undefined && { logo: validData.logo }),
        ...(validData.companyAddress !== undefined && {
          companyAddress: validData.companyAddress,
        }),
        ...(validData.companyPhone !== undefined && {
          companyPhone: validData.companyPhone,
        }),
        ...(validData.companyEmail !== undefined && {
          companyEmail: validData.companyEmail,
        }),
        ...(validData.formJur !== undefined && { formJur: validData.formJur }),
        ...(validData.nif !== undefined && { nif: validData.nif }),
        ...(validData.secteur !== undefined && { secteur: validData.secteur }),
        ...(validData.state !== undefined && { state: validData.state }),
        ...(validData.registre !== undefined && {
          registre: validData.registre,
        }),
        ...(validData.productionAlertThreshold !== undefined && {
          productionAlertThreshold: validData.productionAlertThreshold,
        }),
      },
    })

    // 7. Revalidate
    revalidatePath(`/company/${user.companyId}/settings`)

    return { success: true }
  } catch (error) {
    console.error("updateCompany error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour",
    }
  }
}

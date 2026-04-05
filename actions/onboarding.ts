"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { companySchema, unitSchema, invitationSchema } from "@/lib/validators"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

type OnboardingInput = {
  company: Record<string, unknown>
  unit: Record<string, unknown>
  invites?: { email: string; role: "ADMIN" | "USER" }[]
}

export async function completeOnboarding(data: OnboardingInput) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Non autorisé" }
    }

    // Fetch Clerk user data for fallback creation
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress
    const firstName = clerkUser.firstName
    const lastName = clerkUser.lastName
    const imageUrl = clerkUser.imageUrl
    const name =
      [firstName, lastName].filter(Boolean).join(" ") || primaryEmail || ""

    // Try to find existing user, or create one if webhook hasn't fired yet
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user && primaryEmail) {
      // Webhook race condition fallback — create user inline
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          name,
          email: primaryEmail,
          avatarUrl: imageUrl,
        },
      })
    }

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    if (user.companyId) {
      return { success: false, error: "Vous avez déjà une entreprise" }
    }

    const companyValidation = companySchema.safeParse(data.company)
    if (!companyValidation.success) {
      return {
        success: false,
        error:
          companyValidation.error.issues[0]?.message ??
          "Données entreprise invalides",
      }
    }

    const unitValidation = unitSchema.safeParse(data.unit)
    if (!unitValidation.success) {
      return {
        success: false,
        error:
          unitValidation.error.issues[0]?.message ?? "Données unité invalides",
      }
    }

    const companyData = companyValidation.data
    const unitData = unitValidation.data

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const company = await tx.company.create({
        data: {
          name: companyData.name,
          companyEmail: companyData.companyEmail,
          companyAddress: companyData.companyAddress,
          companyPhone: companyData.companyPhone,
          wilaya: companyData.wilaya,
          formJur: companyData.formJur,
          registre: companyData.registre,
          nif: companyData.nif,
          secteur: companyData.secteur,
          logo: companyData.logo ?? "",
          ownerId: user.id,
        },
      })

      const unit = await tx.unit.create({
        data: {
          name: unitData.name,
          address: unitData.address,
          phone: unitData.phone,
          email: unitData.email,
          companyId: company.id,
          adminId: user.id,
        },
      })

      const starterPlan = await tx.plan.findFirst({
        where: { name: "Starter" },
      })

      if (starterPlan) {
        const now = new Date()
        const endAt = new Date(now)
        endAt.setMonth(endAt.getMonth() + 2)

        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: starterPlan.id,
            startAt: now,
            endAt,
            price: starterPlan.priceDA,
            status: "TRIAL",
          },
        })
      }

      if (data.invites && data.invites.length > 0) {
        for (const invite of data.invites) {
          const inviteValidation = invitationSchema.safeParse({
            email: invite.email,
            role: invite.role,
            unitId: unit.id,
          })

          if (inviteValidation.success) {
            const token = randomBytes(32).toString("hex")
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30)

            await tx.invitation.create({
              data: {
                email: invite.email,
                token,
                expiresAt,
                unitId: unit.id,
                companyId: company.id,
                role: invite.role,
              },
            })
          }
        }
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          role: "OWNER",
        },
      })

      return { companyId: company.id, unitId: unit.id }
    })

    revalidatePath("/dashboard")

    return {
      success: true,
      redirectUrl: "/dashboard",
      companyId: result.companyId,
      unitId: result.unitId,
    }
  } catch (error) {
    console.error("Onboarding error:", error)
    return {
      success: false,
      error: "Une erreur est survenue lors de la configuration",
    }
  }
}

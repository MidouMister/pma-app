import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

export interface UserWithRelations {
  id: string
  clerkId: string
  name: string | null
  email: string
  role: Role
  companyId: string | null
  unitId: string | null
  avatarUrl: string | null
  company: {
    id: string
    name: string
    logo: string | null
    subscription: {
      id: string
      status: string
      planId: string
      startAt: Date | null
      endAt: Date | null
      Plan: {
        id: string
        name: string
        maxUnits: number | null
        maxProjects: number | null
        maxTasksPerProject: number | null
        maxMembers: number | null
        priceDA: number
      } | null
    } | null
  } | null
  unit: {
    id: string
    name: string
    logo: string | null
  } | null
}

export async function getCurrentUser(): Promise<UserWithRelations | null> {
  const { userId } = await auth()
  if (!userId) return null

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
      unit: true,
    },
  })

  return user as UserWithRelations | null
}

export async function requireRole(roles: Role[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Non autorisé")
  if (!roles.includes(user.role)) {
    throw new Error("Accès refusé: rôle insuffisant")
  }
  return user
}

export async function requireCompanyScope() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Non autorisé")
  if (!user.companyId) {
    throw new Error("Accès refusé: aucune entreprise associée")
  }
  return user
}

export async function requireUnitScope() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Non autorisé")
  if (!user.unitId) {
    throw new Error("Accès refusé: aucune unité associée")
  }
  return user
}

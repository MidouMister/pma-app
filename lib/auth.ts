import { Role } from "@/lib/constants"
import { getCurrentUser } from "./queries"

export { getCurrentUser } from "./queries"

export async function requireRole(roles: Role[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Non autorisé")
  if (!roles.includes(user.role as Role)) {
    throw new Error("Accès refusé: rôle insuffisant")
  }
  return user
}

export async function requireCompanyScope() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Non autorisé")
  if (!user.companyId) throw new Error("Accès refusé: pas dans une entreprise")
  return user
}

export async function requireUnitScope() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Non autorisé")
  if (!user.unitId) throw new Error("Accès refusé: pas dans une unité")
  return user
}

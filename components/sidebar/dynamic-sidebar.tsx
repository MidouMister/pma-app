"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { getNavigation } from "@/lib/nav"
import type { WorkspaceItem } from "@/components/sidebar/company-unit-switcher"

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  companyId: string | null
}

export function DynamicSidebar({
  userData,
  workspaces,
}: {
  userData: UserData
  workspaces: WorkspaceItem[]
}) {
  const pathname = usePathname()

  // Extrait l'ID de l'unité ou de l'entreprise depuis l'URL
  const isUnitPath = pathname.startsWith("/unite/")
  const isCompanyPath = pathname.startsWith("/company/")

  let currentUnitId: string | null = null
  let currentCompId: string | null = null

  if (isUnitPath) {
    currentUnitId = pathname.split("/")[2] || null
  }
  if (isCompanyPath) {
    currentCompId = pathname.split("/")[2] || null
  }

  // Déterminer le workspace actuel
  let currentWorkspace = workspaces[0] || {
    id: "unknown",
    name: "Unknown Workspace",
    type: "company",
    logo: null,
  }

  if (currentUnitId) {
    const found = workspaces.find(
      (w) => w.type === "unit" && w.id === currentUnitId
    )
    if (found) currentWorkspace = found
  } else if (currentCompId) {
    const found = workspaces.find(
      (w) => w.type === "company" && w.id === currentCompId
    )
    if (found) currentWorkspace = found
  }

  // Si on est sur une route utilisateur, companyId et unitId ne sont pas nécessaires
  const navItems = getNavigation(
    userData.role,
    userData.companyId,
    currentUnitId,
    userData.id
  )

  return (
    <AppSidebar
      userData={userData}
      navigationItems={navItems}
      currentWorkspace={currentWorkspace}
      availableWorkspaces={workspaces}
    />
  )
}

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import type { WorkspaceItem } from "@/components/sidebar/company-unit-switcher"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const workspaces: WorkspaceItem[] = []

  if (user.company) {
    workspaces.push({
      id: user.company.id,
      name: user.company.name,
      type: "company",
      logo: user.company.logo,
    })

    if (user.role === "OWNER") {
      const units = await prisma.unit.findMany({
        where: { companyId: user.company.id },
        select: { id: true, name: true },
      })

      units.forEach((unit) => {
        workspaces.push({
          id: unit.id,
          name: unit.name,
          type: "unit",
          logo: null,
        })
      })
    }
  }

  if (user.role === "ADMIN" && user.unit) {
    workspaces.push({
      id: user.unit.id,
      name: user.unit.name,
      type: "unit",
      logo: null, // Si l'unité n'a pas de logo propre
    })
  }

  const userData = {
    id: user.id,
    name: user.name || "Utilisateur",
    email: user.email,
    avatar: user.avatarUrl || "",
    role: user.role,
    companyId: user.companyId,
  }

  return (
    <SidebarProvider>
      <DynamicSidebar userData={userData} workspaces={workspaces} />
      <SidebarInset className="bg-background flex flex-col flex-1 h-full min-h-screen">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

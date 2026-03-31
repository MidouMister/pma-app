import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import { Toaster } from "@/components/ui/sonner"
import type { WorkspaceItem } from "@/components/sidebar/company-unit-switcher"

async function buildWorkspaces(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  const workspaces: WorkspaceItem[] = []

  if (!user?.company) return workspaces

  workspaces.push({
    id: user.company.id,
    name: user.company.name,
    type: "company",
    logo: user.company.logo,
  })

  if (user.role === "OWNER") {
    const units = await prisma.unit.findMany({
      where: { companyId: user.company.id },
      select: { id: true, name: true, logo: true },
    })

    for (const unit of units) {
      workspaces.push({
        id: unit.id,
        name: unit.name,
        type: "unit",
        logo: unit.logo,
      })
    }
  }

  if (user.role === "ADMIN" && user.unit) {
    workspaces.push({
      id: user.unit.id,
      name: user.unit.name,
      type: "unit",
      logo: user.unit.logo,
    })
  }

  return workspaces
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect("/onboarding")
  }

  const workspaces = await buildWorkspaces(user)

  const userData = {
    id: user.id,
    name: user.name || "Utilisateur",
    email: user.email,
    avatar: user.avatarUrl || "",
    role: user.role,
    companyId: user.companyId,
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DynamicSidebar userData={userData} workspaces={workspaces} />
        <SidebarInset className="flex h-full min-h-screen flex-1 flex-col bg-background">
          {children}
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  )
}

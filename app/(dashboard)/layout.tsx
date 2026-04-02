import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth"
import { getAllUnits } from "@/lib/queries"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import type { WorkspaceItem } from "@/components/sidebar/company-unit-switcher"

function SidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-card p-4">
      <Skeleton className="h-8 w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-2" />
      <Skeleton className="h-6 w-2/3" />
    </div>
  )
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect("/onboarding")
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
      const units = await getAllUnits(user.company.id)

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
      logo: null,
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
    <>
      <DynamicSidebar userData={userData} workspaces={workspaces} />
      <SidebarInset className="flex h-full min-h-screen flex-1 flex-col bg-background">
        {children}
      </SidebarInset>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Suspense fallback={<SidebarSkeleton />}>
          <DashboardShell>{children}</DashboardShell>
        </Suspense>
      </SidebarProvider>
    </TooltipProvider>
  )
}

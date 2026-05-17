import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { subDays } from "date-fns"
import { getCurrentUser } from "@/lib/auth"
import { getAllUnits } from "@/lib/queries"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/actions/notification"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { DynamicSidebar } from "@/components/sidebar/dynamic-sidebar"
import type { WorkspaceItem } from "@/components/sidebar/company-unit-switcher"

function SidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-card p-4">
      <Skeleton className="mb-4 h-8 w-full" />
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="mb-2 h-6 w-1/2" />
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

  // Trial warning notifications
  if (user.companyId && user.company?.subscription?.status === "TRIAL") {
    const { endAt } = user.company.subscription
    const now = new Date()
    const daysRemaining = Math.ceil(
      (endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    const THRESHOLDS = [
      { days: 30, message: "Votre période d'essai expire dans 30 jours" },
      { days: 7, message: "Votre période d'essai expire dans 7 jours" },
      { days: 3, message: "Votre période d'essai se termine dans 3 jours" },
    ] as const

    for (const { days, message } of THRESHOLDS) {
      if (daysRemaining === days) {
        try {
          const existing = await prisma.notification.findFirst({
            where: {
              companyId: user.companyId,
              type: "GENERAL",
              message: { contains: `${days} jours` },
              createdAt: { gte: subDays(now, 1) },
            },
          })

          if (!existing) {
            await createNotification({
              companyId: user.companyId,
              type: "GENERAL",
              message,
              targetRole: "OWNER",
            })
          }
        } catch {
          // Silent fail
        }
      }
    }
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

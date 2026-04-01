import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { UnitSettingsForm } from "./unit-settings-form"

export default async function UnitSettingsPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user || !user.companyId) {
    redirect("/dashboard")
  }

  // Only OWNER or ADMIN can access unit settings
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
  })

  if (!unit) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Paramètres de l'unité"
        description="Gérez les informations de votre unité"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <UnitSettingsForm unit={unit} />
      </main>
    </div>
  )
}

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EmptyState } from "@/components/shared/empty-state"
import UnitSettingsForm from "@/components/unit/unit-settings-form"

interface UnitSettingsServerPageProps {
  params: Promise<{ unitId: string }>
}

export default async function UnitSettingsServerPage({
  params,
}: UnitSettingsServerPageProps) {
  const { unitId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, companyId: true, unitId: true },
  })

  if (!user || !user.companyId) {
    redirect("/onboarding")
  }

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
    select: {
      id: true,
      companyId: true,
      name: true,
      address: true,
      phone: true,
      email: true,
      logo: true,
    },
  })

  if (!unit) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Unité introuvable"
          description="Cette unité n'existe pas ou vous n'y avez pas accès."
        />
      </div>
    )
  }

  const isAdmin = user.role === "ADMIN" && user.unitId === unitId
  const isOwner = user.role === "OWNER"

  if (!isAdmin && !isOwner) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour modifier les paramètres de cette unité."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Paramètres de l&apos;unité
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiez les informations de votre unité.
        </p>
      </div>

      <UnitSettingsForm unit={unit} />
    </div>
  )
}

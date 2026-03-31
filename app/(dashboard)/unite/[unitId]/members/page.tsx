import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EmptyState } from "@/components/shared/empty-state"
import UnitMembersPage from "@/components/unit/unit-members-client"

interface UnitMembersServerPageProps {
  params: Promise<{ unitId: string }>
}

export default async function UnitMembersServerPage({
  params,
}: UnitMembersServerPageProps) {
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
    select: { id: true, name: true },
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
          description="Vous n'avez pas les permissions nécessaires pour gérer les membres de cette unité."
        />
      </div>
    )
  }

  const members = await prisma.user.findMany({
    where: { unitId, companyId: user.companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      jobeTitle: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  })

  return (
    <UnitMembersPage
      members={members.map((m) => ({
        ...m,
        role: m.role,
      }))}
      unitId={unitId}
      currentUserId={user.id}
      isOwner={isOwner}
    />
  )
}

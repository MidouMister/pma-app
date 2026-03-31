import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EmptyState } from "@/components/shared/empty-state"
import UnitsPageClient from "./units-page-client"

interface UnitsPageProps {
  params: Promise<{ companyId: string }>
}

export default async function UnitsPage({ params }: UnitsPageProps) {
  const { companyId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, companyId: true },
  })

  if (!user || user.role !== "OWNER" || user.companyId !== companyId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour gérer les unités."
        />
      </div>
    )
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  })

  if (!company) {
    redirect("/onboarding")
  }

  const units = await prisma.unit.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      email: true,
      logo: true,
      admin: { select: { name: true } },
      _count: { select: { projects: true, members: true } },
    },
    orderBy: { name: "asc" },
  })

  return <UnitsPageClient units={units} companyId={companyId} />
}

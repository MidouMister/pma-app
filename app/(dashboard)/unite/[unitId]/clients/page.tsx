import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { ClientList } from "@/components/client/client-list"

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params

  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user || !user.companyId) redirect("/onboarding")

  // Verify unit belongs to user's company (BR-01)
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
  })

  if (!unit) redirect("/dashboard")

  // RBAC: USERs can only view clients linked to their assigned projects (CLT-05)
  // ADMIN/OWNER have full visibility within their unit scope
  let whereClause: {
    unitId: string
    companyId: string
    projects?: { some: { team?: { members?: { some: { userId: string } } } } }
  } = {
    unitId,
    companyId: user.companyId,
  }

  if (user.role === "USER") {
    whereClause = {
      unitId,
      companyId: user.companyId,
      projects: {
        some: {
          team: {
            members: {
              some: { userId: user.id },
            },
          },
        },
      },
    }
  }

  // Query clients with project count and total TTC
  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { projects: true },
      },
      projects: {
        select: { id: true, montantTTC: true, status: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // Map to add totalValue for sorting and display
  const clientsData = clients.map((client) => ({
    ...client,
    totalValue: client.projects.reduce(
      (sum, project) => sum + project.montantTTC,
      0
    ),
  }))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Clients"
        description="Gérez vos clients et leurs informations"
      />
      <ClientList
        clients={clientsData}
        unitId={unitId}
        companyId={user.companyId}
        userRole={user.role}
      />
    </div>
  )
}

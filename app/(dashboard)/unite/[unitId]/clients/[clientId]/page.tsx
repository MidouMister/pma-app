import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { ClientProfileClient } from "./client-profile-client"

async function getClient(
  clientId: string,
  companyId: string,
  userId?: string,
  userRole?: string
) {
  // RBAC: USERs can only view clients linked to their assigned projects (CLT-05)
  if (userRole === "USER" && userId) {
    return prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
        projects: {
          some: {
            team: {
              members: {
                some: { userId },
              },
            },
          },
        },
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            montantTTC: true,
          },
          orderBy: { name: "asc" },
        },
      },
    })
  }

  return prisma.client.findFirst({
    where: { id: clientId, companyId },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          montantTTC: true,
        },
        orderBy: { name: "asc" },
      },
    },
  })
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ unitId: string; clientId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user || !user.companyId) redirect("/onboarding")

  const { unitId, clientId } = await params

  // Verify unit belongs to user's company (BR-01)
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
  })

  if (!unit) redirect("/company/sign-in")

  const client = await getClient(clientId, user.companyId, user.id, user.role)

  if (!client) notFound()

  const totalTTC = client.projects.reduce(
    (sum, project) => sum + project.montantTTC,
    0
  )

  const canEdit = user.role === "OWNER" || user.role === "ADMIN"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={client.name}
        description={`Fiche client — ${client.wilaya || "Wilaya non définie"}`}
      />

      <ClientProfileClient
        client={client}
        projects={client.projects}
        totalTTC={totalTTC}
        unitId={unitId}
        canEdit={canEdit}
      />
    </div>
  )
}

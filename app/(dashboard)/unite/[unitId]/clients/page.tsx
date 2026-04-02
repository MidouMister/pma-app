import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUnitById, getScopedClients, getCurrentUser } from "@/lib/queries"
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

  const [unit, clients] = await Promise.all([
    getUnitById(unitId),
    getScopedClients(unitId, user.companyId, user.id, user.role),
  ])

  if (!unit || unit.companyId !== user.companyId) {
    redirect("/dashboard")
  }

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

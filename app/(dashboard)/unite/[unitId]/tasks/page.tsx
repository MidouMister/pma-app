import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"

export default async function TasksPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId: _unitId } = await params

  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user || !user.companyId) redirect("/onboarding")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader title="Tâches" description="Tableau Kanban de votre unité" />
      <EmptyState
        title="Bientôt disponible"
        description="Le tableau Kanban sera disponible dans une prochaine mise à jour."
      />
    </div>
  )
}

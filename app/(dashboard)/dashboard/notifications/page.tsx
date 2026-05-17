import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { NotificationPageContent } from "./notification-page-content"

export default async function NotificationsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user) redirect("/onboarding")

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Notifications"
        description="Consultez et gérez vos notifications"
      />
      <div className="flex-1 p-4 sm:p-6">
        <NotificationPageContent userId={user.id} />
      </div>
    </div>
  )
}

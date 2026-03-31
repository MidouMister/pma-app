import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardRedirectHub() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect("/onboarding")
  }

  if (user.role === "OWNER" && user.companyId) {
    redirect(`/company/${user.companyId}`)
  }

  if (user.role === "ADMIN" && user.unitId) {
    redirect(`/unite/${user.unitId}`)
  }

  if (user.role === "USER") {
    redirect(`/user/${user.id}`)
  }

  // Fallback si pas de redirection possible
  redirect("/onboarding")
}

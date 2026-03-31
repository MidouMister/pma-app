import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await getCurrentUser()

  if (user?.companyId) {
    redirect("/dashboard")
  }

  return <OnboardingWizard />
}

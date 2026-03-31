import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  if (user.companyId) {
    redirect("/dashboard")
  }

  return <OnboardingWizard />
}

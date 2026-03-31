import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { CompanySettingsForm } from "./company-settings-form"

interface CompanySettingsPageProps {
  params: Promise<{ companyId: string }>
}

export default async function CompanySettingsPage({
  params,
}: CompanySettingsPageProps) {
  const { companyId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    redirect("/onboarding")
  }

  if (user.role !== "OWNER" || user.companyId !== companyId) {
    redirect("/dashboard")
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Paramètres de l'entreprise"
        description="Gérez les informations de votre entreprise"
        breadcrumbs={[
          { label: "Entreprise", href: `/company/${companyId}` },
          { label: "Paramètres" },
        ]}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <CompanySettingsForm company={company} companyId={companyId} />
      </div>
    </div>
  )
}

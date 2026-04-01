import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { CompanySettingsForm } from "./company-settings-form"

export default async function CompanySettingsPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      company: { include: { subscription: { include: { Plan: true } } } },
    },
  })

  if (!user || user.role !== "OWNER") {
    redirect("/dashboard")
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Paramètres de l'entreprise"
        description="Gérez les informations de votre entreprise"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <CompanySettingsForm company={company} />
      </main>
    </div>
  )
}

import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format"
import {
  getTrialDaysRemaining,
  getGraceDaysRemaining,
  computeExpectedStatus,
} from "@/lib/subscription"
import {
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionStatus,
} from "@/lib/constants"
import { PageHeader } from "@/components/shared/page-header"
import { UpgradeRequestDialog } from "@/components/company/upgrade-request-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  TrendingUp,
  Users,
  FolderKanban,
  Building2,
} from "lucide-react"

function getStatusBadgeColor(status: SubscriptionStatus): string {
  switch (status) {
    case "TRIAL":
      return "bg-blue-100 text-blue-800"
    case "ACTIVE":
      return "bg-green-100 text-green-800"
    case "GRACE":
      return "bg-yellow-100 text-yellow-800"
    case "READONLY":
      return "bg-red-100 text-red-800"
    case "SUSPENDED":
      return "bg-gray-100 text-gray-800"
  }
}

function getUsagePercentage(current: number, max: number | null): number {
  if (max === null) return 0
  if (max === 0) return 100
  return Math.min(100, Math.round((current / max) * 100))
}

function formatLimit(max: number | null): string {
  if (max === null) return "Illimité"
  return max.toString()
}

interface UsageMetricProps {
  icon: React.ReactNode
  label: string
  current: number
  max: number | null
  percentage: number
}

function UsageMetric({
  icon,
  label,
  current,
  max,
  percentage,
}: UsageMetricProps) {
  const isNearLimit = percentage >= 80
  const isUnlimited = max === null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current} / {formatLimit(max)}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={isNearLimit ? "[&>div]:bg-destructive" : ""}
        />
      )}
      {isNearLimit && !isUnlimited && (
        <p className="text-xs text-destructive">
          Limite proche — {max - current} restant
        </p>
      )}
      {isUnlimited && (
        <p className="text-xs text-muted-foreground">
          Pas de limite pour ce plan
        </p>
      )}
    </div>
  )
}

export default async function BillingPage({
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
      company: {
        include: {
          subscription: {
            include: { Plan: true },
          },
          units: true,
        },
      },
    },
  })

  if (!user || user.role !== "OWNER") {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Accès non autorisé</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user.company || user.company.id !== companyId) {
    notFound()
  }

  const company = user.company
  const subscription = company.subscription
  const plan = subscription?.Plan

  if (!subscription || !plan) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucun abonnement trouvé. Contactez le support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const expectedStatus = computeExpectedStatus(
    subscription.status as SubscriptionStatus,
    subscription.endAt
  )

  const daysRemaining =
    expectedStatus === "TRIAL"
      ? getTrialDaysRemaining(subscription.endAt)
      : expectedStatus === "GRACE"
        ? getGraceDaysRemaining(subscription.endAt)
        : 0

  const currentUnits = company.units.length
  const currentProjects = await prisma.project.count({
    where: { companyId },
  })
  const currentMembers = await prisma.user.count({
    where: { companyId },
  })
  const maxTasksPerProject = plan.maxTasksPerProject

  const unitsPercentage = getUsagePercentage(currentUnits, plan.maxUnits)
  const projectsPercentage = getUsagePercentage(
    currentProjects,
    plan.maxProjects
  )
  const membersPercentage = getUsagePercentage(currentMembers, plan.maxMembers)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Facturation et Abonnement"
        description="Gérez votre plan, consultez vos limites et effectuez une demande de mise à niveau"
        breadcrumbs={[
          { label: "Entreprise", href: `/company/${companyId}` },
          { label: "Paramètres" },
          { label: "Facturation" },
        ]}
      />

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                Plan {plan.name}
                <Badge variant="secondary" className="text-xs">
                  {plan.name === "Starter"
                    ? "Essai"
                    : plan.name === "Pro"
                      ? "Professionnel"
                      : "Premium"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {plan.priceDA > 0
                  ? `${formatCurrency(plan.priceDA)} / an`
                  : "Gratuit pendant la période d'essai"}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeColor(expectedStatus)}>
              {SUBSCRIPTION_STATUS_LABELS[expectedStatus]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {expectedStatus === "TRIAL" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">
                  {daysRemaining} jour{daysRemaining !== 1 ? "s" : ""} restant
                  {daysRemaining !== 1 ? "s" : ""}
                </span>{" "}
                avant la fin de votre période d&apos;essai.
                {daysRemaining < 30 && (
                  <span className="mt-1 block font-medium text-destructive">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    Attention : votre essai se termine bientôt. Pensez à passer
                    à un plan payant.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {expectedStatus === "GRACE" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">
                  Période de grâce — {daysRemaining} jour
                  {daysRemaining !== 1 ? "s" : ""} restant
                </span>{" "}
                avant le passage en mode lecture seule.
              </AlertDescription>
            </Alert>
          )}

          {expectedStatus === "READONLY" && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Votre compte est en mode{" "}
                <span className="font-medium">lecture seule</span>. Toutes les
                modifications sont bloquées. Effectuez une demande de mise à
                niveau pour réactiver votre compte.
              </AlertDescription>
            </Alert>
          )}

          {expectedStatus === "ACTIVE" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Votre abonnement est actif et à jour.
              </AlertDescription>
            </Alert>
          )}

          {expectedStatus === "SUSPENDED" && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Votre compte est suspendu. Contactez le support pour plus
                d&apos;informations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage vs Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Utilisation vs Limites du plan
          </CardTitle>
          <CardDescription>
            Suivez votre consommation par rapport aux limites de votre plan
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <UsageMetric
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            label="Unités"
            current={currentUnits}
            max={plan.maxUnits}
            percentage={unitsPercentage}
          />
          <UsageMetric
            icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
            label="Projets"
            current={currentProjects}
            max={plan.maxProjects}
            percentage={projectsPercentage}
          />
          <UsageMetric
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            label="Membres"
            current={currentMembers}
            max={plan.maxMembers}
            percentage={membersPercentage}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tâches par projet</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatLimit(maxTasksPerProject)}
              </span>
            </div>
            {maxTasksPerProject === null && (
              <p className="text-xs text-muted-foreground">
                Pas de limite pour ce plan
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Mettre à niveau votre plan</CardTitle>
          <CardDescription>
            Passez à un plan supérieur pour bénéficier de plus de
            fonctionnalités et de limites accrues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpgradeRequestDialog companyId={companyId} currentPlan={plan.name} />
        </CardContent>
      </Card>
    </div>
  )
}

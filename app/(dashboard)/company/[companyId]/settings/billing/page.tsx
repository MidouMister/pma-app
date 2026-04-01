import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import {
  getSubscriptionDisplayStatus,
  getGraceDaysRemaining,
} from "@/lib/subscription"
import {
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionStatus,
} from "@/lib/constants"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { UpgradeDialog } from "./upgrade-dialog"

function getStatusBadgeVariant(
  status: SubscriptionStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "TRIAL":
      return "secondary"
    case "ACTIVE":
      return "default"
    case "GRACE":
      return "destructive"
    case "READONLY":
      return "destructive"
    case "SUSPENDED":
      return "outline"
    default:
      return "outline"
  }
}

function getProgressColor(percentage: number): string {
  if (percentage > 90) return "bg-destructive"
  if (percentage >= 70) return "bg-yellow-500"
  return "bg-primary"
}

interface UsageBarProps {
  label: string
  current: number
  max: number | null
}

function UsageBar({ label, current, max }: UsageBarProps) {
  const percentage = max ? Math.min((current / max) * 100, 100) : 0
  const colorClass = max ? getProgressColor(percentage) : "bg-primary"
  const displayMax = max ? max.toString() : "Illimité"
  const displayPercentage = max ? percentage : 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {current} / {displayMax}
        </span>
      </div>
      <div
        className={cn(
          colorClass === "bg-destructive" &&
            "[&_[data-slot=progress-indicator]]:!bg-destructive",
          colorClass === "bg-yellow-500" &&
            "[&_[data-slot=progress-indicator]]:!bg-yellow-500"
        )}
      >
        <Progress value={displayPercentage} className="h-2" />
      </div>
    </div>
  )
}

interface LimitDisplayProps {
  label: string
  value: number | null
}

function LimitDisplay({ label, value }: LimitDisplayProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">
        {value !== null ? value : "Illimité"}
      </span>
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

  // Fetch company with subscription, plan, and counts
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscription: {
        include: { Plan: true },
      },
      _count: {
        select: {
          units: true,
          Project: true,
          users: true,
        },
      },
    },
  })

  if (!company) {
    redirect("/onboarding")
  }

  // Fetch all available plans for upgrade dialog
  const allPlans = await prisma.plan.findMany({
    orderBy: { priceDA: "asc" },
  })

  const subscription = company.subscription
  const plan = subscription?.Plan ?? null
  const counts = company._count

  // Compute display status for trial subscriptions
  let displayStatus: SubscriptionStatus =
    (subscription?.status as SubscriptionStatus) ?? "ACTIVE"
  let daysRemaining = 0

  if (subscription?.status === "TRIAL" && subscription.endAt) {
    const trialInfo = getSubscriptionDisplayStatus(subscription.endAt)
    displayStatus = trialInfo.status
    daysRemaining = trialInfo.daysRemaining
  }

  if (subscription?.status === "GRACE" && subscription.endAt) {
    daysRemaining = getGraceDaysRemaining(subscription.endAt)
  }

  const statusLabel = SUBSCRIPTION_STATUS_LABELS[displayStatus]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Facturation et abonnement"
        description="Gérez votre plan et consultez votre utilisation"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* Trial warning */}
          {displayStatus === "TRIAL" && daysRemaining < 7 && (
            <Alert variant="destructive">
              <AlertTitle>Essai gratuit bientôt expiré</AlertTitle>
              <AlertDescription>
                Il ne vous reste que {daysRemaining} jour
                {daysRemaining > 1 ? "s" : ""} d&apos;essai gratuit. Mettez à
                niveau votre abonnement pour continuer à utiliser toutes les
                fonctionnalités.
              </AlertDescription>
            </Alert>
          )}

          {displayStatus === "GRACE" && (
            <Alert variant="destructive">
              <AlertTitle>Période de grâce</AlertTitle>
              <AlertDescription>
                Votre essai a expiré. Vous disposez de {daysRemaining} jour
                {daysRemaining > 1 ? "s" : ""} supplémentaires avant que votre
                compte ne passe en lecture seule.
              </AlertDescription>
            </Alert>
          )}

          {displayStatus === "READONLY" && (
            <Alert variant="destructive">
              <AlertTitle>Compte en lecture seule</AlertTitle>
              <AlertDescription>
                Votre période d&apos;essai et de grâce est expirée. Mettez à
                niveau votre abonnement pour retrouver un accès complet.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>
                Détails de votre abonnement et statut
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">
                    {plan?.name ?? "Aucun plan"}
                  </span>
                  {plan && (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(plan.priceDA)} / mois
                    </span>
                  )}
                </div>
                <Badge variant={getStatusBadgeVariant(displayStatus)}>
                  {statusLabel}
                </Badge>
              </div>

              {/* Trial countdown */}
              {displayStatus === "TRIAL" && daysRemaining > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Jours restants
                    </span>
                    <span className="font-medium">
                      {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}

              {displayStatus === "GRACE" && daysRemaining > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Jours de grâce restants
                    </span>
                    <span className="font-medium">
                      {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}

              {/* Upgrade CTA */}
              {plan && (
                <div className="pt-2">
                  <UpgradeDialog plans={allPlans} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage vs Limits Card */}
          {plan && (
            <Card>
              <CardHeader>
                <CardTitle>Utilisation vs limites</CardTitle>
                <CardDescription>
                  Consommation actuelle par rapport aux limites de votre plan
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <UsageBar
                  label="Unités"
                  current={counts.units}
                  max={plan.maxUnits}
                />
                <UsageBar
                  label="Projets"
                  current={counts.Project}
                  max={plan.maxProjects}
                />
                <UsageBar
                  label="Membres"
                  current={counts.users}
                  max={plan.maxMembers}
                />

                <Separator />

                {/* Tasks per project — display limit only, not usage */}
                <LimitDisplay
                  label="Tâches par projet"
                  value={plan.maxTasksPerProject}
                />
              </CardContent>
            </Card>
          )}

          {/* No plan state */}
          {!plan && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  Aucun plan actif. Contactez l&apos;administrateur pour
                  configurer un abonnement.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

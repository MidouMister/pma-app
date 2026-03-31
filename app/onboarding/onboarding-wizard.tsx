"use client"

import { useState, useCallback } from "react"
import { useAtom } from "jotai"
import { useRouter } from "next/navigation"
import {
  currentStepAtom,
  companyDataAtom,
  unitDataAtom,
  teamInvitesAtom,
  isSubmittingAtom,
} from "@/lib/atoms/onboarding"
import { completeOnboarding } from "@/actions/onboarding"
import { StepCompany } from "@/components/onboarding/step-company"
import { StepUnit } from "@/components/onboarding/step-unit"
import { StepInvite } from "@/components/onboarding/step-invite"
import { StepTimeline } from "@/components/onboarding/step-timeline"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  ArrowLeft01Icon,
  Building01Icon,
  Factory01Icon,
  UserMultipleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

const STEPS = [
  {
    label: "Entreprise",
    title: "Votre entreprise",
    description:
      "Commencez par enregistrer les informations de votre société. Ces données serviront de base à tous vos projets et factures.",
    icon: Building01Icon,
  },
  {
    label: "Unité",
    title: "Première unité",
    description:
      "Créez votre première agence, chantier ou bureau. Chaque unité gère ses propres projets et son équipe.",
    icon: Factory01Icon,
  },
  {
    label: "Équipe",
    title: "Invitez votre équipe",
    description:
      "Ajoutez les membres qui travailleront avec vous. Vous pourrez toujours inviter d'autres personnes plus tard.",
    icon: UserMultipleIcon,
  },
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom)
  const [companyData] = useAtom(companyDataAtom)
  const [unitData] = useAtom(unitDataAtom)
  const [invites] = useAtom(teamInvitesAtom)
  const [isSubmitting, setIsSubmitting] = useAtom(isSubmittingAtom)
  const router = useRouter()

  const [stepValid, setStepValid] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleStepComplete = useCallback((valid: boolean) => {
    setStepValid(valid)
  }, [])

  const nextStep = () => {
    setSubmitError(null)
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      setStepValid(false)
    }
  }

  const prevStep = () => {
    setSubmitError(null)
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setStepValid(false)
    }
  }

  const handleSkipInvite = async () => {
    await handleSubmit()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await completeOnboarding({
        company: companyData,
        unit: unitData,
        invites: invites.length > 0 ? invites : undefined,
      })

      if (result.success && result.redirectUrl) {
        toast.success("Configuration terminée avec succès")
        router.push(result.redirectUrl)
        router.refresh()
      } else {
        const errorMsg = result.error ?? "Une erreur est survenue"
        setSubmitError(errorMsg)
        toast.error(errorMsg)
      }
    } catch {
      const errorMsg = "Une erreur est survenue lors de la configuration"
      setSubmitError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const current = STEPS[currentStep]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel — Dark sidebar with timeline */}
      <aside className="hidden w-[380px] shrink-0 flex-col bg-[oklch(0.148_0.004_228.8)] text-[oklch(0.987_0.002_197.1)] lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-3 px-8 pt-8 pb-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <HugeiconsIcon icon={Building01Icon} className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">PMA</h1>
            <p className="text-xs text-[oklch(0.723_0.014_214.4)]">
              Gestion de projets BTP
            </p>
          </div>
        </div>

        {/* Step context */}
        <div className="flex-1 px-8">
          <StepTimeline steps={STEPS} currentStep={currentStep} />

          <div className="mt-12 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <HugeiconsIcon icon={current.icon} className="size-5" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                Étape {currentStep + 1}
              </span>
            </div>
            <h2 className="text-2xl leading-tight font-semibold">
              {current.title}
            </h2>
            <p className="text-sm leading-relaxed text-[oklch(0.723_0.014_214.4)]">
              {current.description}
            </p>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="px-8 pb-8">
          <div className="h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
          <p className="mt-4 text-xs text-[oklch(0.56_0.021_213.5)]">
            Essai gratuit de 2 mois — aucune carte bancaire requise
          </p>
        </div>
      </aside>

      {/* Right Panel — Form */}
      <main className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b px-6 py-4 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Building01Icon} className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">PMA</h1>
            <p className="text-xs text-muted-foreground">
              Étape {currentStep + 1}/{STEPS.length} — {current.label}
            </p>
          </div>
        </div>

        {/* Mobile step indicators */}
        <div className="flex gap-1 border-b px-6 py-3 lg:hidden">
          {STEPS.map((step, index) => (
            <div
              key={step.label}
              className={`flex h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="mx-6 mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:mx-8 lg:mt-6">
            {submitError}
          </div>
        )}

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-xl">
            {currentStep === 0 && (
              <StepCompany onComplete={handleStepComplete} />
            )}
            {currentStep === 1 && <StepUnit onComplete={handleStepComplete} />}
            {currentStep === 2 && <StepInvite onSkip={handleSkipInvite} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 lg:px-12">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0 || isSubmitting}
            className="gap-2"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              data-icon="inline-start"
              className="size-4"
            />
            Retour
          </Button>

          {currentStep === 2 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner />
                  Configuration...
                </>
              ) : (
                <>
                  Terminer
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    data-icon="inline-end"
                    className="size-4"
                  />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!stepValid}>
              Suivant
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

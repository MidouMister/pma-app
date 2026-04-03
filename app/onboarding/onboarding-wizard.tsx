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
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

const STEPS = [
  { label: "Entreprise", icon: "📋" },
  { label: "Unité", icon: "🏢" },
  { label: "Équipe", icon: "👥" },
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom)
  const [companyData] = useAtom(companyDataAtom)
  const [unitData] = useAtom(unitDataAtom)
  const [invites] = useAtom(teamInvitesAtom)
  const [isSubmitting, setIsSubmitting] = useAtom(isSubmittingAtom)
  const router = useRouter()

  const [stepValid, setStepValid] = useState(false)

  const handleStepComplete = useCallback((valid: boolean) => {
    setStepValid(valid)
  }, [])

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      setStepValid(false)
    }
  }

  const prevStep = () => {
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
    try {
      const result = await completeOnboarding({
        company: companyData,
        unit: unitData,
        invites: invites.length > 0 ? invites : undefined,
      })

      if (result.success && result.redirectUrl) {
        toast.success("Configuration terminée avec succès")
        router.push(result.redirectUrl)
      } else {
        toast.error(result.error ?? "Une erreur est survenue")
      }
    } catch {
      toast.error("Une erreur est survenue lors de la configuration")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                className="size-6 text-primary"
              />
            </div>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
            Bienvenue sur <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">PMA</span>
          </h1>
          <p className="mt-1 text-lg font-semibold text-muted-foreground">
            Project Management App
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            Configurons votre espace de travail en quelques étapes simples
          </p>
        </div>

        {/* Main Content Card */}
        <div className="rounded-2xl border border-border bg-card shadow-lg backdrop-blur-sm">
          {/* Progress Section */}
          <div className="border-b border-border px-8 py-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Étape {currentStep + 1} de {STEPS.length}
              </span>
              <span className="text-xs font-medium text-primary">
                {STEPS[currentStep].label}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Step Indicators */}
          <div className="border-b border-border px-8 py-6">
            <div className="flex gap-3">
              {STEPS.map((step, index) => (
                <div key={step.label} className="flex flex-1 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground shadow-md"
                        : index === currentStep
                          ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        className="size-5"
                      />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`hidden text-sm font-medium transition-colors duration-300 sm:block ${
                      index === currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 border-t-2 transition-colors duration-300 ${
                        index < currentStep
                          ? "border-primary"
                          : "border-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px] px-8 py-8">
            {currentStep === 0 && (
              <StepCompany onComplete={handleStepComplete} />
            )}
            {currentStep === 1 && <StepUnit onComplete={handleStepComplete} />}
            {currentStep === 2 && <StepInvite onSkip={handleSkipInvite} />}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border bg-muted/30 px-8 py-6">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="min-w-32"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  className="mr-2 size-4"
                />
                Retour
              </Button>

              {currentStep === 2 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-32"
                >
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
                        className="ml-2 size-4"
                      />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!stepValid}
                  className="min-w-32"
                >
                  Suivant
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="ml-2 size-4"
                  />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress indicator for mobile */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Besoin d&apos;aide ? Visitez notre centre d&apos;aide
        </div>
      </div>
    </div>
  )
}

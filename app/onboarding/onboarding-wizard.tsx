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

const STEPS = [{ label: "Entreprise" }, { label: "Unité" }, { label: "Équipe" }]

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-2xl flex-col gap-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="size-6 text-primary"
            />
            <h1 className="text-2xl font-bold">Bienvenue sur PMA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configurons votre espace de travail en quelques étapes
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Étape {currentStep + 1} sur {STEPS.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {STEPS[currentStep].label}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div key={step.label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="size-3"
                    />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    index === currentStep
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 border-t border-dashed" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          {currentStep === 0 && <StepCompany onComplete={handleStepComplete} />}
          {currentStep === 1 && <StepUnit onComplete={handleStepComplete} />}
          {currentStep === 2 && <StepInvite onSkip={handleSkipInvite} />}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
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
                  />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!stepValid}>
              Suivant
              <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

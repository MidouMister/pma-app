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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Building01Icon,
  MapPinIcon,
  UserGroup02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

const STEPS = [
  {
    label: "Entreprise",
    subtitle: "Informations légales",
    description:
      "Renseignez les détails de votre entreprise pour configurer votre espace de travail.",
    icon: Building01Icon,
  },
  {
    label: "Unité",
    subtitle: "Première unité",
    description:
      "Créez votre première unité de production ou agence pour commencer à gérer vos projets.",
    icon: MapPinIcon,
  },
  {
    label: "Équipe",
    subtitle: "Invitations",
    description:
      "Invitez les membres de votre équipe à collaborer sur vos projets.",
    icon: UserGroup02Icon,
  },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom)
  const [companyData] = useAtom(companyDataAtom)
  const [unitData] = useAtom(unitDataAtom)
  const [invites] = useAtom(teamInvitesAtom)
  const [isSubmitting, setIsSubmitting] = useAtom(isSubmittingAtom)
  const router = useRouter()

  const [stepValid, setStepValid] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [direction, setDirection] = useState(0)

  const handleStepComplete = useCallback(
    (valid: boolean) => {
      setStepValid(valid)
      if (valid) {
        setCompletedSteps((prev) => new Set(prev).add(currentStep))
      }
    },
    [currentStep]
  )

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
      setStepValid(completedSteps.has(currentStep + 1))
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
      setStepValid(completedSteps.has(currentStep - 1))
    }
  }

  const handleSkipInvite = async () => {
    await handleSubmit()
  }

  const handleSubmit = async () => {
    console.log("Submitting onboarding data:", {
      company: companyData,
      unit: unitData,
      invites,
    })

    setIsSubmitting(true)
    try {
      const result = await completeOnboarding({
        company: companyData,
        unit: unitData,
        invites: invites.length > 0 ? invites : undefined,
      })

      console.log("Onboarding result:", result)

      if (result.success && result.redirectUrl) {
        toast.success("Configuration terminée avec succès")
        router.push(result.redirectUrl)
      } else {
        toast.error(result.error ?? "Une erreur est survenue")
      }
    } catch (error) {
      console.error("Onboarding error:", error)
      toast.error("Une erreur est survenue lors de la configuration")
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStepData = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Step Progress & Info */}
      <div className="relative hidden w-5/12 flex-col justify-between p-10 text-primary-foreground lg:flex">
        {/* Background - Light mode: rich primary gradient, Dark mode: deep dark with primary accents */}
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary/80 dark:from-background dark:via-primary/10 dark:to-primary/5" />
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-white/10 blur-3xl"
          />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary-foreground)/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary-foreground)/0.06)_1px,transparent_1px)] bg-size-[32px_32px]" />

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 right-12 h-24 w-24 rounded-lg border border-white/10"
          />
          <motion.div
            animate={{ rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-24 left-12 h-16 w-16 rounded-full border border-white/10"
          />
        </div>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">PMA</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">PMA</h2>
              <p className="text-sm text-white/70">Gestion de projets</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="relative z-10 space-y-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <span>
                Étape {currentStep + 1} sur {STEPS.length}
              </span>
            </div>
            <h1 className="text-3xl leading-tight font-bold text-white">
              {currentStepData.label}
            </h1>
            <p className="mt-3 max-w-md text-base text-white/70">
              {currentStepData.description}
            </p>
          </motion.div>

          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-white/80"
              initial={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Step list */}
          <div className="space-y-4">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const isPending = index > currentStep

              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className={`flex items-center gap-3 transition-opacity ${
                    isPending ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isCompleted
                        ? "bg-white/20 text-white"
                        : isActive
                          ? "bg-white text-primary"
                          : "bg-white/10 text-white/50"
                    }`}
                  >
                    {isCompleted ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        className="h-5 w-5"
                      />
                    ) : (
                      <HugeiconsIcon icon={step.icon} className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${isActive ? "text-white" : "text-white/70"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-white/50">{step.subtitle}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-white/50">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
          <span>Vos données sont sécurisées et chiffrées</span>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex w-full flex-col bg-background lg:w-7/12">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b px-6 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                PMA
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {currentStepData.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>

        {/* Mobile progress */}
        <div className="h-1 w-full bg-muted lg:hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Form content */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-xl">
            {/* Desktop header */}
            {/* <div className="mb-8 hidden lg:block">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {currentStepData.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            </div> */}

            {/* Step content with animation */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
              >
                {currentStep === 0 && (
                  <StepCompany onComplete={handleStepComplete} />
                )}
                {currentStep === 1 && (
                  <StepUnit onComplete={handleStepComplete} />
                )}
                {currentStep === 2 && <StepInvite onSkip={handleSkipInvite} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  data-icon="inline-start"
                  className="mr-2 h-4 w-4"
                />
                Retour
              </Button>

              {currentStep === 2 ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSkipInvite}
                    disabled={isSubmitting}
                  >
                    Passer
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2" />
                        Configuration...
                      </>
                    ) : (
                      <>
                        Terminer
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          data-icon="inline-end"
                          className="ml-2 h-4 w-4"
                        />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button onClick={nextStep} disabled={!stepValid}>
                  Suivant
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    data-icon="inline-end"
                    className="ml-2 h-4 w-4"
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

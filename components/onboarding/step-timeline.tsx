"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building01Icon,
  Factory01Icon,
  UserMultipleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"

const ICONS = [Building01Icon, Factory01Icon, UserMultipleIcon]

interface StepTimelineProps {
  steps: { label: string }[]
  currentStep: number
}

export function StepTimeline({ steps, currentStep }: StepTimelineProps) {
  return (
    <nav className="flex flex-col gap-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const Icon = ICONS[index]

        return (
          <div key={step.label} className="flex gap-3">
            {/* Line + dot column */}
            <div className="flex flex-col items-center">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[oklch(0.56_0.021_213.5)] bg-transparent text-[oklch(0.56_0.021_213.5)]"
                }`}
              >
                {isCompleted ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-4"
                  />
                ) : (
                  <HugeiconsIcon icon={Icon} className="size-3.5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-10 w-px transition-colors ${
                    index < currentStep
                      ? "bg-primary/40"
                      : "bg-[oklch(0.56_0.021_213.5)]/30"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <div className="flex flex-col justify-center py-1">
              <span
                className={`text-sm font-medium transition-colors ${
                  isCurrent
                    ? "text-[oklch(0.987_0.002_197.1)]"
                    : isCompleted
                      ? "text-[oklch(0.723_0.014_214.4)]"
                      : "text-[oklch(0.56_0.021_213.5)]"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

"use client"

import { useState } from "react"
import { useAtom } from "jotai"
import { unitDataAtom } from "@/lib/atoms/onboarding"
import { unitSchema } from "@/lib/validators"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Building02Icon,
  LocationIcon,
  PhoneIcon,
  MailIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type StepUnitProps = {
  onComplete: (valid: boolean) => void
}

export function StepUnit({ onComplete }: StepUnitProps) {
  const [data, setData] = useAtom(unitDataAtom)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const updateField = (field: string, value: string) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    setTouched((prev) => new Set(prev).add(field))

    const result = unitSchema.safeParse(updated)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join(".")
        fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
    } else {
      setErrors({})
    }
  }

  const isValid = unitSchema.safeParse(data).success

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground">
          Première unité
        </h2>
        <p className="text-base text-muted-foreground">
          Créez votre première unité de production ou agence
        </p>
      </div>

      {/* Section 1: Informations Générales */}
      <div className="space-y-4 rounded-xl border border-border bg-gradient-to-br from-blue-50/50 to-transparent p-6 dark:from-blue-950/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <HugeiconsIcon
              icon={Building02Icon}
              className="size-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Informations générales
            </h3>
            <p className="text-xs text-muted-foreground">
              Identité de l&apos;unité
            </p>
          </div>
        </div>

        <FieldGroup>
          <Field data-invalid={!!errors.name && touched.has("name")}>
            <FieldLabel htmlFor="unit-name">
              Nom de l&apos;unité <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="unit-name"
              value={data.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={!!errors.name && touched.has("name")}
              placeholder="Ex: Unité Alger Centre"
              className="transition-all duration-200"
            />
            {errors.name && touched.has("name") && (
              <FieldError>{errors.name}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </div>

      {/* Section 2: Localisation et Contact */}
      <div className="space-y-4 rounded-xl border border-border bg-gradient-to-br from-green-50/50 to-transparent p-6 dark:from-green-950/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <HugeiconsIcon
              icon={LocationIcon}
              className="size-5 text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Localisation et contact
            </h3>
            <p className="text-xs text-muted-foreground">
              Adresse et moyens de communication
            </p>
          </div>
        </div>

        <FieldGroup>
          <Field data-invalid={!!errors.address && touched.has("address")}>
            <FieldLabel htmlFor="unit-address">
              Adresse <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="unit-address"
              value={data.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
              aria-invalid={!!errors.address && touched.has("address")}
              placeholder="Adresse de l'unité"
              className="transition-all duration-200"
            />
            {errors.address && touched.has("address") && (
              <FieldError>{errors.address}</FieldError>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.phone && touched.has("phone")}>
              <FieldLabel htmlFor="unit-phone">
                Téléphone <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="unit-phone"
                value={data.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                aria-invalid={!!errors.phone && touched.has("phone")}
                placeholder="0555 12 34 56"
                className="transition-all duration-200"
              />
              {errors.phone && touched.has("phone") && (
                <FieldError>{errors.phone}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.email && touched.has("email")}>
              <FieldLabel htmlFor="unit-email">
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="unit-email"
                type="email"
                value={data.email ?? ""}
                onChange={(e) => updateField("email", e.target.value)}
                aria-invalid={!!errors.email && touched.has("email")}
                placeholder="unite@entreprise.dz"
                className="transition-all duration-200"
              />
              {errors.email && touched.has("email") && (
                <FieldError>{errors.email}</FieldError>
              )}
            </Field>
          </div>
        </FieldGroup>
      </div>

      <button
        type="button"
        className="hidden"
        onClick={() => onComplete(isValid)}
        aria-hidden
      />
    </div>
  )
}

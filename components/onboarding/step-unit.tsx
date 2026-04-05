"use client"

import { useState, useEffect } from "react"
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
  Building01Icon,
  MapPinIcon,
  TelephoneIcon,
  Mail01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type { IconSvgElement } from "@hugeicons/react"

type StepUnitProps = {
  onComplete: (valid: boolean) => void
}

function FieldWithIcon({
  icon,
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  touched,
}: {
  icon: IconSvgElement
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  error?: string
  touched: boolean
}) {
  const hasError = !!error && touched
  const isValid = !hasError && touched && value.length > 0

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
          <HugeiconsIcon
            icon={icon}
            className={cn(
              "h-4 w-4 transition-colors",
              hasError
                ? "text-destructive"
                : isValid
                  ? "text-green-500"
                  : "text-muted-foreground"
            )}
          />
        </div>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={hasError}
          placeholder={placeholder}
          className={cn(
            "h-12 pl-10",
            hasError && "border-destructive",
            isValid && "border-green-500"
          )}
        />
        {isValid && (
          <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="h-4 w-4 text-green-500"
            />
          </div>
        )}
      </div>
      {hasError && <FieldError>{error}</FieldError>}
    </Field>
  )
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

  useEffect(() => {
    onComplete(isValid)
  }, [isValid, onComplete])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Première unité</h2>
        <p className="text-sm text-muted-foreground">
          Créez votre première unité de production ou agence
        </p>
      </div>

      <FieldGroup className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {/* Name - full width */}
        <div className="sm:col-span-2">
          <FieldWithIcon
            icon={Building01Icon}
            label="Nom de l'unité"
            id="unit-name"
            value={data.name ?? ""}
            onChange={(v) => updateField("name", v)}
            placeholder="Ex: Unité Alger Centre"
            error={errors.name}
            touched={touched.has("name")}
          />
        </div>

        {/* Address - full width */}
        <div className="sm:col-span-2">
          <FieldWithIcon
            icon={MapPinIcon}
            label="Adresse"
            id="unit-address"
            value={data.address ?? ""}
            onChange={(v) => updateField("address", v)}
            placeholder="Adresse de l'unité"
            error={errors.address}
            touched={touched.has("address")}
          />
        </div>

        {/* Phone */}
        <FieldWithIcon
          icon={TelephoneIcon}
          label="Téléphone"
          id="unit-phone"
          value={data.phone ?? ""}
          onChange={(v) => updateField("phone", v)}
          placeholder="0555 12 34 56"
          error={errors.phone}
          touched={touched.has("phone")}
        />

        {/* Email */}
        <FieldWithIcon
          icon={Mail01Icon}
          label="Email"
          id="unit-email"
          type="email"
          value={data.email ?? ""}
          onChange={(v) => updateField("email", v)}
          placeholder="unite@entreprise.dz"
          error={errors.email}
          touched={touched.has("email")}
        />
      </FieldGroup>
    </div>
  )
}

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

      <button
        type="button"
        className="hidden"
        onClick={() => onComplete(isValid)}
        aria-hidden
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
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
  Location01Icon,
  Phone,
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

  // Notify parent wizard whenever validity changes
  useEffect(() => {
    onComplete(isValid)
  }, [isValid, onComplete])

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Première unité
        </h2>
        <p className="text-sm text-muted-foreground">
          Créez votre première agence, chantier ou bureau
        </p>
      </div>

      {/* Section: Identity */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Building02Icon} className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Identité</h3>
            <p className="text-xs text-muted-foreground">Nom de l&apos;unité</p>
          </div>
        </div>

        <FieldGroup>
          <Field data-invalid={!!errors.name && touched.has("name")}>
            <FieldLabel htmlFor="unit-name">Nom de l&apos;unité</FieldLabel>
            <Input
              id="unit-name"
              className="h-12 text-base"
              value={data.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={!!errors.name && touched.has("name")}
              placeholder="Ex: Unité Alger Centre"
            />
            {errors.name && touched.has("name") && (
              <FieldError>{errors.name}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Section: Address */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Location01Icon} className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Adresse</h3>
            <p className="text-xs text-muted-foreground">
              Localisation de l&apos;unité
            </p>
          </div>
        </div>

        <FieldGroup>
          <Field data-invalid={!!errors.address && touched.has("address")}>
            <FieldLabel htmlFor="unit-address">Adresse</FieldLabel>
            <Input
              id="unit-address"
              className="h-12 text-base"
              value={data.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
              aria-invalid={!!errors.address && touched.has("address")}
              placeholder="Adresse complète"
            />
            {errors.address && touched.has("address") && (
              <FieldError>{errors.address}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Section: Contact */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Phone} className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Contact</h3>
            <p className="text-xs text-muted-foreground">Téléphone et email</p>
          </div>
        </div>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.phone && touched.has("phone")}>
            <FieldLabel htmlFor="unit-phone">Téléphone</FieldLabel>
            <Input
              id="unit-phone"
              className="h-12 text-base"
              value={data.phone ?? ""}
              onChange={(e) => updateField("phone", e.target.value)}
              aria-invalid={!!errors.phone && touched.has("phone")}
              placeholder="0555 12 34 56"
            />
            {errors.phone && touched.has("phone") && (
              <FieldError>{errors.phone}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.email && touched.has("email")}>
            <FieldLabel htmlFor="unit-email">Email</FieldLabel>
            <Input
              id="unit-email"
              className="h-12 text-base"
              type="email"
              value={data.email ?? ""}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={!!errors.email && touched.has("email")}
              placeholder="unite@entreprise.dz"
            />
            {errors.email && touched.has("email") && (
              <FieldError>{errors.email}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      <button
        type="button"
        className="hidden"
        onClick={() => onComplete(isValid)}
        aria-hidden
      />
    </div>
  )
}

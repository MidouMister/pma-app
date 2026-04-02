"use client"

import { useState } from "react"
import { useAtom } from "jotai"
import { companyDataAtom } from "@/lib/atoms/onboarding"
import { companySchema } from "@/lib/validators"
import { WILAYAS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UploadButton } from "@uploadthing/react"
import type { UploadthingRouter } from "@/app/api/uploadthing/core"

type StepCompanyProps = {
  onComplete: (valid: boolean) => void
}

const LEGAL_FORMS = [
  "SARL",
  "SPA",
  "SNC",
  "SCS",
  "EURL",
  "Auto-entrepreneur",
  "Personne physique",
]

export function StepCompany({ onComplete }: StepCompanyProps) {
  const [data, setData] = useAtom(companyDataAtom)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const updateField = (field: string, value: string) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    setTouched((prev) => new Set(prev).add(field))

    const result = companySchema.safeParse(updated)
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

  const isValid = companySchema.safeParse(data).success

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Profil de l&apos;entreprise</h2>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de votre entreprise
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!errors.name && touched.has("name")}>
          <FieldLabel htmlFor="company-name">
            Nom de l&apos;entreprise
          </FieldLabel>
          <Input
            id="company-name"
            value={data.name ?? ""}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={!!errors.name && touched.has("name")}
            placeholder="Ex: SARL Construction Plus"
          />
          {errors.name && touched.has("name") && (
            <FieldError>{errors.name}</FieldError>
          )}
        </Field>

        <Field
          data-invalid={!!errors.companyEmail && touched.has("companyEmail")}
        >
          <FieldLabel htmlFor="company-email">Email</FieldLabel>
          <Input
            id="company-email"
            type="email"
            value={data.companyEmail ?? ""}
            onChange={(e) => updateField("companyEmail", e.target.value)}
            aria-invalid={!!errors.companyEmail && touched.has("companyEmail")}
            placeholder="contact@entreprise.dz"
          />
          {errors.companyEmail && touched.has("companyEmail") && (
            <FieldError>{errors.companyEmail}</FieldError>
          )}
        </Field>

        <Field
          data-invalid={!!errors.companyPhone && touched.has("companyPhone")}
        >
          <FieldLabel htmlFor="company-phone">Téléphone</FieldLabel>
          <Input
            id="company-phone"
            value={data.companyPhone ?? ""}
            onChange={(e) => updateField("companyPhone", e.target.value)}
            aria-invalid={!!errors.companyPhone && touched.has("companyPhone")}
            placeholder="0555 12 34 56"
          />
          {errors.companyPhone && touched.has("companyPhone") && (
            <FieldError>{errors.companyPhone}</FieldError>
          )}
        </Field>

        <Field
          data-invalid={
            !!errors.companyAddress && touched.has("companyAddress")
          }
        >
          <FieldLabel htmlFor="company-address">Adresse</FieldLabel>
          <Input
            id="company-address"
            value={data.companyAddress ?? ""}
            onChange={(e) => updateField("companyAddress", e.target.value)}
            aria-invalid={
              !!errors.companyAddress && touched.has("companyAddress")
            }
            placeholder="Rue Didouche Mourad, Alger"
          />
          {errors.companyAddress && touched.has("companyAddress") && (
            <FieldError>{errors.companyAddress}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.wilaya && touched.has("wilaya")}>
          <FieldLabel htmlFor="company-wilaya">Wilaya</FieldLabel>
          <Select
            value={data.wilaya ?? ""}
            onValueChange={(v) => updateField("wilaya", v)}
          >
            <SelectTrigger
              id="company-wilaya"
              className={cn(
                errors.wilaya && touched.has("wilaya") && "border-destructive"
              )}
            >
              <SelectValue placeholder="Sélectionner une wilaya" />
            </SelectTrigger>
            <SelectContent>
              {WILAYAS.map((w) => (
                <SelectItem key={w.code} value={w.name}>
                  {w.code} - {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wilaya && touched.has("wilaya") && (
            <FieldError>{errors.wilaya}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.formJur && touched.has("formJur")}>
          <FieldLabel htmlFor="company-form">Forme juridique</FieldLabel>
          <Select
            value={data.formJur ?? ""}
            onValueChange={(v) => updateField("formJur", v)}
          >
            <SelectTrigger
              id="company-form"
              className={cn(
                errors.formJur && touched.has("formJur") && "border-destructive"
              )}
            >
              <SelectValue placeholder="Sélectionner une forme" />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_FORMS.map((form) => (
                <SelectItem key={form} value={form}>
                  {form}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.formJur && touched.has("formJur") && (
            <FieldError>{errors.formJur}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.nif && touched.has("nif")}>
          <FieldLabel htmlFor="company-nif">NIF</FieldLabel>
          <Input
            id="company-nif"
            value={data.nif ?? ""}
            onChange={(e) => updateField("nif", e.target.value)}
            aria-invalid={!!errors.nif && touched.has("nif")}
            placeholder="Numéro d'identification fiscale"
          />
          {errors.nif && touched.has("nif") && (
            <FieldError>{errors.nif}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.registre && touched.has("registre")}>
          <FieldLabel htmlFor="company-registre">
            Registre de commerce
          </FieldLabel>
          <Input
            id="company-registre"
            value={data.registre ?? ""}
            onChange={(e) => updateField("registre", e.target.value)}
            aria-invalid={!!errors.registre && touched.has("registre")}
            placeholder="Numéro de registre"
          />
          {errors.registre && touched.has("registre") && (
            <FieldError>{errors.registre}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.secteur && touched.has("secteur")}>
          <FieldLabel htmlFor="company-secteur">
            Secteur d&apos;activité
          </FieldLabel>
          <Input
            id="company-secteur"
            value={data.secteur ?? ""}
            onChange={(e) => updateField("secteur", e.target.value)}
            aria-invalid={!!errors.secteur && touched.has("secteur")}
            placeholder="Ex: BTP, Informatique, Commerce..."
          />
          {errors.secteur && touched.has("secteur") && (
            <FieldError>{errors.secteur}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>Logo de l&apos;entreprise</FieldLabel>
          <UploadButton<UploadthingRouter, "companyLogo">
            endpoint="companyLogo"
            onClientUploadComplete={(res) => {
              if (res?.[0]?.url) {
                updateField("logo", res[0].url)
              }
            }}
            onUploadError={() => {
              setErrors((prev) => ({
                ...prev,
                logo: "Erreur lors du téléchargement du logo",
              }))
            }}
            className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/80 ut-button:w-full ut-button:h-10 ut-button:rounded-md ut-button:text-xs ut-button:font-medium ut-allowed-content:text-muted-foreground ut-allowed-content:text-xs"
          />
          {errors.logo && <FieldError>{errors.logo}</FieldError>}
        </Field>
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

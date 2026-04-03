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
import {
  Building01Icon,
  LocationIcon,
  LegalDocumentIcon,
  BriefcaseIcon,
  ImageAddIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground">
          Profil de l&apos;entreprise
        </h2>
        <p className="text-base text-muted-foreground">
          Renseignez les informations clés de votre entreprise
        </p>
      </div>

      {/* Section 1: Information de Base */}
      <div className="space-y-4 rounded-xl border border-border bg-gradient-to-br from-blue-50/50 to-transparent p-6 dark:from-blue-950/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <HugeiconsIcon
              icon={Building01Icon}
              className="size-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Informations de base
            </h3>
            <p className="text-xs text-muted-foreground">
              Identité et contact principal
            </p>
          </div>
        </div>

        <FieldGroup>
        <Field data-invalid={!!errors.name && touched.has("name")}>
          <FieldLabel htmlFor="company-name">
            Nom de l&apos;entreprise <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="company-name"
            value={data.name ?? ""}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={!!errors.name && touched.has("name")}
            placeholder="Ex: SARL Construction Plus"
            className="transition-all duration-200"
          />
          {errors.name && touched.has("name") && (
            <FieldError>{errors.name}</FieldError>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            data-invalid={
              !!errors.companyEmail && touched.has("companyEmail")
            }
          >
            <FieldLabel htmlFor="company-email">
              Email <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="company-email"
              type="email"
              value={data.companyEmail ?? ""}
              onChange={(e) => updateField("companyEmail", e.target.value)}
              aria-invalid={
                !!errors.companyEmail && touched.has("companyEmail")
              }
              placeholder="contact@entreprise.dz"
              className="transition-all duration-200"
            />
            {errors.companyEmail && touched.has("companyEmail") && (
              <FieldError>{errors.companyEmail}</FieldError>
            )}
          </Field>

          <Field
            data-invalid={
              !!errors.companyPhone && touched.has("companyPhone")
            }
          >
            <FieldLabel htmlFor="company-phone">
              Téléphone <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="company-phone"
              value={data.companyPhone ?? ""}
              onChange={(e) => updateField("companyPhone", e.target.value)}
              aria-invalid={
                !!errors.companyPhone && touched.has("companyPhone")
              }
              placeholder="0555 12 34 56"
              className="transition-all duration-200"
            />
            {errors.companyPhone && touched.has("companyPhone") && (
              <FieldError>{errors.companyPhone}</FieldError>
            )}
          </Field>
        </div>

        </FieldGroup>
      </div>

      {/* Section 2: Localisation */}
      <div className="space-y-4 rounded-xl border border-border bg-gradient-to-br from-blue-50/50 to-transparent p-6 dark:from-blue-950/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <HugeiconsIcon
              icon={LocationIcon}
              className="size-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Localisation</h3>
            <p className="text-xs text-muted-foreground">
              Adresse et région d&apos;activité
            </p>
          </div>
        </div>

        <FieldGroup>
          <Field
            data-invalid={
              !!errors.companyAddress && touched.has("companyAddress")
            }
          >
            <FieldLabel htmlFor="company-address">
              Adresse <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="company-address"
              value={data.companyAddress ?? ""}
              onChange={(e) => updateField("companyAddress", e.target.value)}
              aria-invalid={
                !!errors.companyAddress && touched.has("companyAddress")
              }
              placeholder="Rue Didouche Mourad, Alger"
              className="transition-all duration-200"
            />
            {errors.companyAddress && touched.has("companyAddress") && (
              <FieldError>{errors.companyAddress}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.wilaya && touched.has("wilaya")}>
            <FieldLabel htmlFor="company-wilaya">
              Wilaya <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={data.wilaya ?? ""}
              onValueChange={(v) => updateField("wilaya", v)}
            >
              <SelectTrigger
                id="company-wilaya"
                className={cn(
                  "transition-all duration-200",
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
        </FieldGroup>
      </div>

      {/* Section 3: Informations Juridiques */}
      <div className="space-y-4 rounded-xl border border-border bg-gradient-to-br from-blue-50/50 to-transparent p-6 dark:from-blue-950/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <HugeiconsIcon
              icon={LegalDocumentIcon}
              className="size-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Informations juridiques
            </h3>
            <p className="text-xs text-muted-foreground">
              Détails légaux et fiscaux
            </p>
          </div>
        </div>

        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.formJur && touched.has("formJur")}>
              <FieldLabel htmlFor="company-form">
                Forme juridique <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={data.formJur ?? ""}
                onValueChange={(v) => updateField("formJur", v)}
              >
                <SelectTrigger
                  id="company-form"
                  className={cn(
                    "transition-all duration-200",
                    errors.formJur &&
                      touched.has("formJur") &&
                      "border-destructive"
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
              <FieldLabel htmlFor="company-nif">
                NIF <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="company-nif"
                value={data.nif ?? ""}
                onChange={(e) => updateField("nif", e.target.value)}
                aria-invalid={!!errors.nif && touched.has("nif")}
                placeholder="Numéro d'identification fiscale"
                className="transition-all duration-200"
              />
              {errors.nif && touched.has("nif") && (
                <FieldError>{errors.nif}</FieldError>
              )}
            </Field>
          </div>

          <Field data-invalid={!!errors.registre && touched.has("registre")}>
            <FieldLabel htmlFor="company-registre">
              Registre de commerce <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="company-registre"
              value={data.registre ?? ""}
              onChange={(e) => updateField("registre", e.target.value)}
              aria-invalid={!!errors.registre && touched.has("registre")}
              placeholder="Numéro de registre"
              className="transition-all duration-200"
            />
            {errors.registre && touched.has("registre") && (
              <FieldError>{errors.registre}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </div>

      {/* Section 4: Secteur et Branding */}
      <div className="space-y-4 rounded-xl border border-border bg-gradient-to-br from-blue-50/50 to-transparent p-6 dark:from-blue-950/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <HugeiconsIcon
              icon={BriefcaseIcon}
              className="size-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Secteur et branding
            </h3>
            <p className="text-xs text-muted-foreground">
              Type d&apos;activité et identité visuelle
            </p>
          </div>
        </div>

        <FieldGroup>
          <Field data-invalid={!!errors.secteur && touched.has("secteur")}>
            <FieldLabel htmlFor="company-secteur">
              Secteur d&apos;activité <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="company-secteur"
              value={data.secteur ?? ""}
              onChange={(e) => updateField("secteur", e.target.value)}
              aria-invalid={!!errors.secteur && touched.has("secteur")}
              placeholder="Ex: BTP, Informatique, Commerce..."
              className="transition-all duration-200"
            />
            {errors.secteur && touched.has("secteur") && (
              <FieldError>{errors.secteur}</FieldError>
            )}
          </Field>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 transition-all duration-200 hover:border-blue-400/50 hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <HugeiconsIcon
                  icon={ImageAddIcon}
                  className="size-4 text-blue-600 dark:text-blue-400"
                />
              </div>
              <Field className="flex-1">
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
                  className="ut-button:rounded-md ut-button:bg-blue-600 ut-button:px-3 ut-button:py-1.5 ut-button:text-xs ut-button:font-medium ut-button:text-white ut-button:transition-all ut-button:hover:bg-blue-700 ut-button:hover:shadow-md ut-allowed-content:hidden"
                />
                {errors.logo && <FieldError>{errors.logo}</FieldError>}
              </Field>
            </div>
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

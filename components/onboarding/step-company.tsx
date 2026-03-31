"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"
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
  Building02Icon,
  Mail01Icon,
  Certificate01Icon,
  ImageIcon,
  DeleteIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

/** Detect client-only rendering to avoid hydration mismatch with Radix Select */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

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
  const [isUploading, setIsUploading] = useState(false)
  const isClient = useIsClient()

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

  // Notify parent wizard whenever validity changes
  useEffect(() => {
    onComplete(isValid)
  }, [isValid, onComplete])

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Profil de l&apos;entreprise
        </h2>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de votre société
        </p>
      </div>

      {/* Section: Identité */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Building02Icon} className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Identité</h3>
            <p className="text-xs text-muted-foreground">
              Nom, forme juridique, wilaya et secteur
            </p>
          </div>
        </div>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field
            className="sm:col-span-2"
            data-invalid={!!errors.name && touched.has("name")}
          >
            <FieldLabel htmlFor="company-name">
              Nom de l&apos;entreprise
            </FieldLabel>
            <Input
              id="company-name"
              className="h-12 text-base"
              value={data.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={!!errors.name && touched.has("name")}
              placeholder="Ex: SARL Construction Plus"
            />
            {errors.name && touched.has("name") && (
              <FieldError>{errors.name}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.formJur && touched.has("formJur")}>
            <FieldLabel htmlFor="company-form">Forme juridique</FieldLabel>
            {isClient ? (
              <Select
                value={data.formJur ?? ""}
                onValueChange={(v) => updateField("formJur", v)}
              >
                <SelectTrigger
                  id="company-form"
                  className={cn(
                    "h-12 text-base",
                    errors.formJur &&
                      touched.has("formJur") &&
                      "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_FORMS.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-12 rounded-md border bg-muted/50" />
            )}
            {errors.formJur && touched.has("formJur") && (
              <FieldError>{errors.formJur}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.state && touched.has("state")}>
            <FieldLabel htmlFor="company-wilaya">Wilaya</FieldLabel>
            {isClient ? (
              <Select
                value={data.state ?? ""}
                onValueChange={(v) => updateField("state", v)}
              >
                <SelectTrigger
                  id="company-wilaya"
                  className={cn(
                    "h-12 text-base",
                    errors.state && touched.has("state") && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Sélectionner une wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.name}>
                      {w.code} — {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-12 rounded-md border bg-muted/50" />
            )}
            {errors.state && touched.has("state") && (
              <FieldError>{errors.state}</FieldError>
            )}
          </Field>

          <Field
            className="sm:col-span-2"
            data-invalid={!!errors.secteur && touched.has("secteur")}
          >
            <FieldLabel htmlFor="company-secteur">
              Secteur d&apos;activité
            </FieldLabel>
            <Input
              id="company-secteur"
              className="h-12 text-base"
              value={data.secteur ?? ""}
              onChange={(e) => updateField("secteur", e.target.value)}
              aria-invalid={!!errors.secteur && touched.has("secteur")}
              placeholder="Ex: BTP, Informatique, Commerce..."
            />
            {errors.secteur && touched.has("secteur") && (
              <FieldError>{errors.secteur}</FieldError>
            )}
          </Field>
        </FieldGroup>

        {/* Logo upload */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <FieldLabel className="mb-2 block">
            Logo de l&apos;entreprise
          </FieldLabel>
          {data.logo ? (
            <div className="flex items-center gap-4">
              <div className="relative size-20 overflow-hidden rounded-lg border bg-background">
                <Image
                  src={data.logo}
                  alt="Logo de l'entreprise"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  Logo téléchargé avec succès
                </p>
                <button
                  type="button"
                  onClick={() => updateField("logo", "")}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline"
                >
                  <HugeiconsIcon icon={DeleteIcon} className="size-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  icon={ImageIcon}
                  className="size-5 text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isUploading
                  ? "Téléchargement en cours..."
                  : "Cliquez pour télécharger votre logo"}
              </p>
              <UploadButton<UploadthingRouter, "companyLogo">
                endpoint="companyLogo"
                onUploadBegin={() => setIsUploading(true)}
                onUploadProgress={() => setIsUploading(true)}
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.url) {
                    updateField("logo", res[0].url)
                  }
                  setIsUploading(false)
                }}
                onUploadError={() => {
                  setErrors((prev) => ({
                    ...prev,
                    logo: "Erreur lors du téléchargement du logo",
                  }))
                  setIsUploading(false)
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/80 ut-button:w-full ut-button:h-11 ut-button:rounded-md ut-button:text-sm ut-button:font-medium ut-allowed-content:text-muted-foreground ut-allowed-content:text-xs"
              />
            </div>
          )}
          {errors.logo && (
            <FieldError className="mt-2">{errors.logo}</FieldError>
          )}
        </div>
      </section>

      {/* Section: Contact */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Mail01Icon} className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Contact</h3>
            <p className="text-xs text-muted-foreground">
              Adresse et coordonnées
            </p>
          </div>
        </div>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field
            className="sm:col-span-2"
            data-invalid={
              !!errors.companyAddress && touched.has("companyAddress")
            }
          >
            <FieldLabel htmlFor="company-address">Adresse</FieldLabel>
            <Input
              id="company-address"
              className="h-12 text-base"
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

          <Field
            data-invalid={!!errors.companyEmail && touched.has("companyEmail")}
          >
            <FieldLabel htmlFor="company-email">Email</FieldLabel>
            <Input
              id="company-email"
              className="h-12 text-base"
              type="email"
              value={data.companyEmail ?? ""}
              onChange={(e) => updateField("companyEmail", e.target.value)}
              aria-invalid={
                !!errors.companyEmail && touched.has("companyEmail")
              }
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
              className="h-12 text-base"
              value={data.companyPhone ?? ""}
              onChange={(e) => updateField("companyPhone", e.target.value)}
              aria-invalid={
                !!errors.companyPhone && touched.has("companyPhone")
              }
              placeholder="0555 12 34 56"
            />
            {errors.companyPhone && touched.has("companyPhone") && (
              <FieldError>{errors.companyPhone}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </section>

      {/* Section: Informations légales */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Certificate01Icon} className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Informations légales</h3>
            <p className="text-xs text-muted-foreground">
              Registre de commerce et identification fiscale
            </p>
          </div>
        </div>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.nif && touched.has("nif")}>
            <FieldLabel htmlFor="company-nif">NIF</FieldLabel>
            <Input
              id="company-nif"
              className="h-12 text-base"
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
              className="h-12 text-base"
              value={data.registre ?? ""}
              onChange={(e) => updateField("registre", e.target.value)}
              aria-invalid={!!errors.registre && touched.has("registre")}
              placeholder="Numéro de registre"
            />
            {errors.registre && touched.has("registre") && (
              <FieldError>{errors.registre}</FieldError>
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

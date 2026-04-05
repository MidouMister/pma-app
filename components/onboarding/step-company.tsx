"use client"

import { useState, useEffect } from "react"
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
import { UploadButton } from "@/utils/uploadthing"
import {
  Building01Icon,
  Mail01Icon,
  TelephoneIcon,
  MapPinIcon,
  File01Icon,
  UserIcon,
  CheckmarkCircle01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
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

function SelectWithIcon({
  icon,
  label,
  id,
  value,
  onChange,
  placeholder,
  children,
  error,
  touched,
}: {
  icon: IconSvgElement
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  children: React.ReactNode
  error?: string
  touched: boolean
}) {
  const hasError = !!error && touched
  const isValid = !hasError && touched && value.length > 0

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <div className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2">
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
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            className={cn("h-12 pl-10", hasError && "border-destructive")}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
      {hasError && <FieldError>{error}</FieldError>}
    </Field>
  )
}

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

  useEffect(() => {
    onComplete(isValid)
  }, [isValid, onComplete])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Profil de l&apos;entreprise</h2>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de votre entreprise
        </p>
      </div>

      <FieldGroup className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {/* Name - full width */}
        <div className="sm:col-span-2">
          <FieldWithIcon
            icon={Building01Icon}
            label="Nom de l'entreprise"
            id="company-name"
            value={data.name ?? ""}
            onChange={(v) => updateField("name", v)}
            placeholder="Ex: SARL Construction Plus"
            error={errors.name}
            touched={touched.has("name")}
          />
        </div>

        {/* Email */}
        <FieldWithIcon
          icon={Mail01Icon}
          label="Email"
          id="company-email"
          type="email"
          value={data.companyEmail ?? ""}
          onChange={(v) => updateField("companyEmail", v)}
          placeholder="contact@entreprise.dz"
          error={errors.companyEmail}
          touched={touched.has("companyEmail")}
        />

        {/* Phone */}
        <FieldWithIcon
          icon={TelephoneIcon}
          label="Téléphone"
          id="company-phone"
          value={data.companyPhone ?? ""}
          onChange={(v) => updateField("companyPhone", v)}
          placeholder="0555 12 34 56"
          error={errors.companyPhone}
          touched={touched.has("companyPhone")}
        />

        {/* Address - full width */}
        <div className="sm:col-span-2">
          <FieldWithIcon
            icon={MapPinIcon}
            label="Adresse"
            id="company-address"
            value={data.companyAddress ?? ""}
            onChange={(v) => updateField("companyAddress", v)}
            placeholder="Rue Didouche Mourad, Alger"
            error={errors.companyAddress}
            touched={touched.has("companyAddress")}
          />
        </div>

        {/* Wilaya */}
        <SelectWithIcon
          icon={MapPinIcon}
          label="Wilaya"
          id="company-wilaya"
          value={data.wilaya ?? ""}
          onChange={(v) => updateField("wilaya", v)}
          placeholder="Sélectionner une wilaya"
          error={errors.wilaya}
          touched={touched.has("wilaya")}
        >
          {WILAYAS.map((w) => (
            <SelectItem key={w.code} value={w.name}>
              {w.code} - {w.name}
            </SelectItem>
          ))}
        </SelectWithIcon>

        {/* Legal form */}
        <SelectWithIcon
          icon={File01Icon}
          label="Forme juridique"
          id="company-form"
          value={data.formJur ?? ""}
          onChange={(v) => updateField("formJur", v)}
          placeholder="Sélectionner une forme"
          error={errors.formJur}
          touched={touched.has("formJur")}
        >
          {LEGAL_FORMS.map((form) => (
            <SelectItem key={form} value={form}>
              {form}
            </SelectItem>
          ))}
        </SelectWithIcon>

        {/* NIF */}
        <FieldWithIcon
          icon={File01Icon}
          label="NIF"
          id="company-nif"
          value={data.nif ?? ""}
          onChange={(v) => updateField("nif", v)}
          placeholder="Numéro d'identification fiscale"
          error={errors.nif}
          touched={touched.has("nif")}
        />

        {/* Registre */}
        <FieldWithIcon
          icon={File01Icon}
          label="Registre de commerce"
          id="company-registre"
          value={data.registre ?? ""}
          onChange={(v) => updateField("registre", v)}
          placeholder="Numéro de registre"
          error={errors.registre}
          touched={touched.has("registre")}
        />

        {/* Secteur - full width */}
        <div className="sm:col-span-2">
          <FieldWithIcon
            icon={UserIcon}
            label="Secteur d'activité"
            id="company-secteur"
            value={data.secteur ?? ""}
            onChange={(v) => updateField("secteur", v)}
            placeholder="Ex: BTP, Informatique, Commerce..."
            error={errors.secteur}
            touched={touched.has("secteur")}
          />
        </div>

        {/* Logo upload - full width */}
        <div className="sm:col-span-2">
          <Field>
            <FieldLabel>Logo de l&apos;entreprise</FieldLabel>
            <div className="flex items-center gap-4">
              {data.logo ? (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.logo}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-input">
                  <HugeiconsIcon
                    icon={Image01Icon}
                    className="h-8 w-8 text-muted-foreground"
                  />
                </div>
              )}
              <div className="flex-1">
                <UploadButton
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
                  appearance={{
                    container: "w-full",
                    button:
                      "bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-lg text-sm font-medium transition-all duration-300 w-full",
                    allowedContent: "text-muted-foreground text-xs mt-1",
                  }}
                />
              </div>
            </div>
            {errors.logo && <FieldError>{errors.logo}</FieldError>}
          </Field>
        </div>
      </FieldGroup>
    </div>
  )
}

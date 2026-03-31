"use client"

import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { UploadButton } from "@uploadthing/react"
import type { UploadthingRouter } from "@/app/api/uploadthing/core"
import { WILAYAS } from "@/lib/constants"
import { updateCompanySchema } from "@/lib/validators"
import { updateCompany } from "@/actions/company"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ImageIcon, DeleteIcon, SaveIcon } from "lucide-react"

const LEGAL_FORMS = [
  "SARL",
  "SPA",
  "SNC",
  "SCS",
  "EURL",
  "Auto-entrepreneur",
  "Personne physique",
]

type CompanySettingsFormProps = {
  company: {
    id: string
    name: string
    logo: string
    companyAddress: string
    companyPhone: string
    companyEmail: string
    formJur: string
    registre: string
    nif: string
    secteur: string
    state: string
    productionAlertThreshold: number
  }
  companyId: string
}

export function CompanySettingsForm({
  company,
  companyId,
}: CompanySettingsFormProps) {
  const [formData, setFormData] = useState({
    name: company.name,
    companyEmail: company.companyEmail,
    companyAddress: company.companyAddress,
    companyPhone: company.companyPhone,
    state: company.state,
    formJur: company.formJur,
    nif: company.nif,
    secteur: company.secteur,
    logo: company.logo,
    productionAlertThreshold: company.productionAlertThreshold,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = updateCompanySchema.safeParse(formData)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message
      }
      setErrors(fieldErrors)
      toast.error("Veuillez corriger les erreurs dans le formulaire")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateCompany({
        companyId,
        data: formData,
      })

      if (result.success) {
        toast.success("Entreprise mise à jour avec succès")
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour")
      }
    } catch {
      toast.error("Une erreur est survenue lors de la mise à jour")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Informations de l&apos;entreprise
            </h2>
            <p className="text-sm text-muted-foreground">
              Modifiez les détails de votre entreprise
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FieldGroup className="flex flex-col gap-4">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="company-name">
                  Nom de l&apos;entreprise
                </FieldLabel>
                <Input
                  id="company-name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex: SARL Construction Plus"
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>

              <div className="rounded-lg border bg-muted/20 p-4">
                <FieldLabel className="mb-2 block">
                  Logo de l&apos;entreprise
                </FieldLabel>
                {formData.logo ? (
                  <div className="flex items-center gap-4">
                    <div className="relative size-20 overflow-hidden rounded-lg border bg-background">
                      <Image
                        src={formData.logo}
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
                        <DeleteIcon className="size-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <ImageIcon className="size-5 text-muted-foreground" />
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
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Coordonnées</h2>
            <p className="text-sm text-muted-foreground">
              Adresse et informations de contact
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field
                className="sm:col-span-2"
                data-invalid={!!errors.companyAddress}
              >
                <FieldLabel htmlFor="company-address">Adresse</FieldLabel>
                <Input
                  id="company-address"
                  value={formData.companyAddress}
                  onChange={(e) =>
                    updateField("companyAddress", e.target.value)
                  }
                  placeholder="Rue Didouche Mourad, Alger"
                />
                {errors.companyAddress && (
                  <FieldError>{errors.companyAddress}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.companyEmail}>
                <FieldLabel htmlFor="company-email">Email</FieldLabel>
                <Input
                  id="company-email"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => updateField("companyEmail", e.target.value)}
                  placeholder="contact@entreprise.dz"
                />
                {errors.companyEmail && (
                  <FieldError>{errors.companyEmail}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.companyPhone}>
                <FieldLabel htmlFor="company-phone">Téléphone</FieldLabel>
                <Input
                  id="company-phone"
                  value={formData.companyPhone}
                  onChange={(e) => updateField("companyPhone", e.target.value)}
                  placeholder="0555 12 34 56"
                />
                {errors.companyPhone && (
                  <FieldError>{errors.companyPhone}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Informations légales</h2>
            <p className="text-sm text-muted-foreground">
              Forme juridique, NIF et secteur d&apos;activité
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.formJur}>
                <FieldLabel htmlFor="company-formJur">
                  Forme juridique
                </FieldLabel>
                <Select
                  value={formData.formJur}
                  onValueChange={(v) => updateField("formJur", v)}
                >
                  <SelectTrigger
                    id="company-formJur"
                    className={cn(errors.formJur && "border-destructive")}
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
                {errors.formJur && <FieldError>{errors.formJur}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.nif}>
                <FieldLabel htmlFor="company-nif">NIF</FieldLabel>
                <Input
                  id="company-nif"
                  value={formData.nif}
                  onChange={(e) => updateField("nif", e.target.value)}
                  placeholder="Numéro d'identification fiscale"
                />
                {errors.nif && <FieldError>{errors.nif}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.secteur}>
                <FieldLabel htmlFor="company-secteur">
                  Secteur d&apos;activité
                </FieldLabel>
                <Input
                  id="company-secteur"
                  value={formData.secteur}
                  onChange={(e) => updateField("secteur", e.target.value)}
                  placeholder="Ex: BTP, Informatique, Commerce..."
                />
                {errors.secteur && <FieldError>{errors.secteur}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.state}>
                <FieldLabel htmlFor="company-state">Wilaya</FieldLabel>
                <Select
                  value={formData.state}
                  onValueChange={(v) => updateField("state", v)}
                >
                  <SelectTrigger
                    id="company-state"
                    className={cn(errors.state && "border-destructive")}
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
                {errors.state && <FieldError>{errors.state}</FieldError>}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Seuil d&apos;alerte production
            </h2>
            <p className="text-sm text-muted-foreground">
              Seuil (%) en dessous duquel une alerte de sous-performance est
              déclenchée (PROD-09)
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FieldGroup className="flex flex-col gap-4">
              <Field data-invalid={!!errors.productionAlertThreshold}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="company-threshold">
                    Seuil d&apos;alerte
                  </FieldLabel>
                  <span className="text-sm font-medium tabular-nums">
                    {formData.productionAlertThreshold}%
                  </span>
                </div>
                <Slider
                  id="company-threshold"
                  min={1}
                  max={100}
                  step={1}
                  value={[formData.productionAlertThreshold]}
                  onValueChange={([value]) =>
                    updateField("productionAlertThreshold", value)
                  }
                  className={cn(
                    errors.productionAlertThreshold && "[&>span]:bg-destructive"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>100%</span>
                </div>
                {errors.productionAlertThreshold && (
                  <FieldError>{errors.productionAlertThreshold}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <SaveIcon className="size-4" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  )
}

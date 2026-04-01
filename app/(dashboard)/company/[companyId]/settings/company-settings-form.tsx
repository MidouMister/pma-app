"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Company } from "@prisma/client"
import { toast } from "sonner"
import { updateCompanySchema } from "@/lib/validators"
import { updateCompany } from "@/actions/company"
import { WILAYAS } from "@/lib/constants"
import { UploadButton } from "@/utils/uploadthing"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CompanySettingsFormProps {
  company: Company
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(company.logo || "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: company.name,
    companyEmail: company.companyEmail,
    companyAddress: company.companyAddress,
    companyPhone: company.companyPhone,
    state: company.state,
    formJur: company.formJur,
    registre: company.registre,
    nif: company.nif,
    secteur: company.secteur,
    logo: company.logo || "",
    productionAlertThreshold: company.productionAlertThreshold,
  })

  function handleChange(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = updateCompanySchema.safeParse({
      ...formData,
      logo: logoUrl || "",
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join(".")
        if (path) {
          fieldErrors[path] = issue.message
        }
      }
      if (Object.keys(fieldErrors).length === 0) {
        fieldErrors.form =
          result.error.issues[0]?.message ?? "Données invalides"
      }
      setErrors(fieldErrors)
      return
    }

    startTransition(async () => {
      const res = await updateCompany({
        ...result.data,
        logo: logoUrl || "",
      })
      if (res.success) {
        toast.success("Paramètres mis à jour avec succès")
        router.refresh()
      } else {
        toast.error(res.error ?? "Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-6"
    >
      {/* Logo section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo de l&apos;entreprise</CardTitle>
          <CardDescription>Image PNG ou JPG, 4 Mo maximum</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={logoUrl || undefined} alt={company.name} />
              <AvatarFallback>
                {company.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <UploadButton
              endpoint="companyLogo"
              onClientUploadComplete={(res: { url: string }[]) => {
                if (res?.[0]) {
                  const url = res[0].url
                  setLogoUrl(url)
                  toast.success("Logo téléchargé avec succès")
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Erreur : ${error.message}`)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Nom, email, téléphone et adresse de l&apos;entreprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nom de l&apos;entreprise</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <FieldDescription>{errors.name}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.companyEmail}>
              <FieldLabel htmlFor="companyEmail">Adresse email</FieldLabel>
              <Input
                id="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={(e) => handleChange("companyEmail", e.target.value)}
                aria-invalid={!!errors.companyEmail}
              />
              {errors.companyEmail && (
                <FieldDescription>{errors.companyEmail}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.companyPhone}>
              <FieldLabel htmlFor="companyPhone">
                Numéro de téléphone
              </FieldLabel>
              <Input
                id="companyPhone"
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => handleChange("companyPhone", e.target.value)}
                aria-invalid={!!errors.companyPhone}
              />
              {errors.companyPhone && (
                <FieldDescription>{errors.companyPhone}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.companyAddress}>
              <FieldLabel htmlFor="companyAddress">Adresse</FieldLabel>
              <Input
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => handleChange("companyAddress", e.target.value)}
                aria-invalid={!!errors.companyAddress}
              />
              {errors.companyAddress && (
                <FieldDescription>{errors.companyAddress}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.state}>
              <FieldLabel htmlFor="state">Wilaya</FieldLabel>
              <Select
                value={formData.state}
                onValueChange={(value) => handleChange("state", value)}
              >
                <SelectTrigger id="state">
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
              {errors.state && (
                <FieldDescription>{errors.state}</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Informations légales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations légales</CardTitle>
          <CardDescription>
            Forme juridique, registre, NIF et secteur d&apos;activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.formJur}>
              <FieldLabel htmlFor="formJur">Forme juridique</FieldLabel>
              <Input
                id="formJur"
                value={formData.formJur}
                onChange={(e) => handleChange("formJur", e.target.value)}
                aria-invalid={!!errors.formJur}
              />
              {errors.formJur && (
                <FieldDescription>{errors.formJur}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.registre}>
              <FieldLabel htmlFor="registre">Registre de commerce</FieldLabel>
              <Input
                id="registre"
                value={formData.registre}
                onChange={(e) => handleChange("registre", e.target.value)}
                aria-invalid={!!errors.registre}
              />
              {errors.registre && (
                <FieldDescription>{errors.registre}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.nif}>
              <FieldLabel htmlFor="nif">NIF</FieldLabel>
              <Input
                id="nif"
                value={formData.nif}
                onChange={(e) => handleChange("nif", e.target.value)}
                aria-invalid={!!errors.nif}
              />
              {errors.nif && <FieldDescription>{errors.nif}</FieldDescription>}
            </Field>

            <Field data-invalid={!!errors.secteur}>
              <FieldLabel htmlFor="secteur">Secteur d&apos;activité</FieldLabel>
              <Input
                id="secteur"
                value={formData.secteur}
                onChange={(e) => handleChange("secteur", e.target.value)}
                aria-invalid={!!errors.secteur}
              />
              {errors.secteur && (
                <FieldDescription>{errors.secteur}</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Alertes production */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes de production</CardTitle>
          <CardDescription>
            Seuil d&apos;alerte pour le suivi de production
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>
              Seuil d&apos;alerte ({formData.productionAlertThreshold}%)
            </FieldLabel>
            <Slider
              value={[formData.productionAlertThreshold]}
              onValueChange={([value]) =>
                handleChange("productionAlertThreshold", value)
              }
              min={1}
              max={100}
              step={1}
            />
            <FieldDescription>
              Valeur entre 1 et 100. Par défaut : 80%
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      {/* Submit */}
      {errors.form && (
        <FieldDescription className="text-destructive">
          {errors.form}
        </FieldDescription>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

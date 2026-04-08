"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Unit } from "@prisma/client"
import { toast } from "sonner"
import Image from "next/image"
import { Building2 } from "lucide-react"
import { updateUnitSchema } from "@/lib/validators"
import { updateUnit } from "@/actions/unit"
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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { TagManager } from "@/components/kanban/tag-manager"
import type { Tag } from "@prisma/client"

interface CompanyInfo {
  id: string
  name: string
  logo: string | null
  companyEmail: string
  companyPhone: string
  companyAddress: string
  wilaya: string
  nif: string
  registre: string
  secteur: string
}

interface UnitSettingsFormProps {
  unit: Unit
  company: CompanyInfo
  tags: Tag[]
}

export function UnitSettingsForm({ unit, company, tags }: UnitSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: unit.name,
    address: unit.address,
    phone: unit.phone,
    email: unit.email,
  })

  function handleChange(field: string, value: string) {
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

    const result = updateUnitSchema.safeParse({
      id: unit.id,
      ...formData,
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
      const res = await updateUnit(result.data)
      if (res.success) {
        toast.success("Unité mise à jour avec succès")
        router.refresh()
      } else {
        toast.error(res.error ?? "Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {/* Company info — read-only */}
        <Card>
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
            <CardDescription>
              Informations de votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-muted overflow-hidden">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-muted-foreground">{company.companyEmail}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Téléphone</span>
                <p className="font-medium">{company.companyPhone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Wilaya</span>
                <p className="font-medium">{company.wilaya}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Secteur</span>
                <p className="font-medium">{company.secteur}</p>
              </div>
              <div>
                <span className="text-muted-foreground">NIF</span>
                <p className="font-medium">{company.nif}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Adresse</span>
                <p className="font-medium">{company.companyAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Nom, adresse, téléphone et email de l&apos;unité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Nom de l&apos;unité</FieldLabel>
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

              <Field data-invalid={!!errors.address}>
                <FieldLabel htmlFor="address">Adresse</FieldLabel>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  aria-invalid={!!errors.address}
                />
                {errors.address && (
                  <FieldDescription>{errors.address}</FieldDescription>
                )}
              </Field>

              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">Numéro de téléphone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <FieldDescription>{errors.phone}</FieldDescription>
                )}
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Adresse email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <FieldDescription>{errors.email}</FieldDescription>
                )}
              </Field>
            </FieldGroup>
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

      {/* Tag Management */}
      <TagManager unitId={unit.id} initialTags={tags} />
    </div>
  )
}

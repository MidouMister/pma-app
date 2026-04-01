"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Unit } from "@prisma/client"
import { toast } from "sonner"
import { updateUnitSchema } from "@/lib/validators"
import { updateUnit } from "@/actions/unit"
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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UnitSettingsFormProps {
  unit: Unit
}

export function UnitSettingsForm({ unit }: UnitSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(unit.logo || "")
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
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-6"
    >
      {/* Logo section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo de l&apos;unité</CardTitle>
          <CardDescription>Image PNG ou JPG, 4 Mo maximum</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={logoUrl || undefined} alt={unit.name} />
              <AvatarFallback>
                {unit.name.slice(0, 2).toUpperCase()}
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
  )
}

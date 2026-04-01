"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { clientSchema } from "@/lib/validators"
import { createClient, updateClient } from "@/actions/client"
import { type Client } from "@prisma/client"

interface ClientDialogProps {
  unitId: string
  companyId: string
  client?: Client // If provided, we're in edit mode
  trigger?: React.ReactNode // Custom trigger button if needed
}

export function ClientDialog({
  unitId,
  companyId,
  client,
  trigger,
}: ClientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!client
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    wilaya: client?.wilaya ?? "",
    unitId,
    companyId,
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

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && !isEditing) {
      // Reset form if closing create dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        wilaya: "",
        unitId,
        companyId,
      })
      setErrors({})
    }
    setOpen(newOpen)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = clientSchema.safeParse(formData)

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
      let res
      if (isEditing) {
        res = await updateClient({ ...result.data, id: client.id })
      } else {
        res = await createClient(result.data)
      }

      if (res.success) {
        toast.success(
          isEditing ? "Client mis à jour" : "Client créé avec succès"
        )
        handleOpenChange(false)
        router.refresh()
      } else {
        toast.error(res.error || "Une erreur est survenue")
        if (res.error) {
          setErrors({ form: res.error })
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le client" : "Ajouter un client"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du client ci-dessous."
              : "Créez un nouveau client pour cette unité."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nom du client *</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={!!errors.name}
                placeholder="SARL Exemple"
              />
              {errors.name && (
                <FieldDescription>{errors.name}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.wilaya}>
              <FieldLabel htmlFor="wilaya">Wilaya</FieldLabel>
              <Input
                id="wilaya"
                value={formData.wilaya}
                onChange={(e) => handleChange("wilaya", e.target.value)}
                aria-invalid={!!errors.wilaya}
                placeholder="Ex: Alger"
              />
              {errors.wilaya && (
                <FieldDescription>{errors.wilaya}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                aria-invalid={!!errors.email}
                placeholder="contact@exemple.com"
              />
              {errors.email && (
                <FieldDescription>{errors.email}</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                aria-invalid={!!errors.phone}
                placeholder="0555 00 00 00"
              />
              {errors.phone && (
                <FieldDescription>{errors.phone}</FieldDescription>
              )}
            </Field>
          </FieldGroup>

          {errors.form && (
            <FieldDescription className="mt-2 text-destructive">
              {errors.form}
            </FieldDescription>
          )}

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

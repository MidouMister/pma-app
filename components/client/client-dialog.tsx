"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { clientSchema } from "@/lib/validators"
import { createClient, updateClient } from "@/actions/client"
import { type Client } from "@prisma/client"
import { FormModal } from "@/components/shared/form-modal"

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

  function handleReset() {
    if (!isEditing) {
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
  }

  const handleSubmit = (e: React.FormEvent) => {
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
        setOpen(false)
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
    <FormModal
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? "Modifier le client" : "Ajouter un client"}
      description={
        isEditing
          ? "Modifiez les informations du client ci-dessous."
          : "Créez un nouveau client pour cette unité."
      }
      trigger={
        trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        )
      }
      size="lg"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitLabel={isEditing ? "Enregistrer" : "Créer"}
      submitPendingLabel="Enregistrement..."
      showCancel={!isEditing}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field data-invalid={!!errors.name} className="md:col-span-2">
          <FieldLabel htmlFor="name">Nom du client *</FieldLabel>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            aria-invalid={!!errors.name}
            className="h-11"
            placeholder="SARL Exemple"
          />
          {errors.name && <FieldDescription>{errors.name}</FieldDescription>}
        </Field>

        <Field data-invalid={!!errors.wilaya}>
          <FieldLabel htmlFor="wilaya">Wilaya</FieldLabel>
          <Input
            id="wilaya"
            value={formData.wilaya}
            onChange={(e) => handleChange("wilaya", e.target.value)}
            aria-invalid={!!errors.wilaya}
            className="h-11"
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
            className="h-11"
            placeholder="contact@exemple.com"
          />
          {errors.email && <FieldDescription>{errors.email}</FieldDescription>}
        </Field>

        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            className="h-11"
            placeholder="0555 00 00 00"
          />
          {errors.phone && <FieldDescription>{errors.phone}</FieldDescription>}
        </Field>
      </div>

      {errors.form && (
        <FieldDescription className="mt-2 text-destructive">
          {errors.form}
        </FieldDescription>
      )}
    </FormModal>
  )
}

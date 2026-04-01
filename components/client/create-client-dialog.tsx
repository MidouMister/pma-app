"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createClient } from "@/actions/client"
import { WILAYAS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

interface CreateClientDialogProps {
  unitId: string
}

export function CreateClientDialog({ unitId }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [wilaya, setWilaya] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  function resetForm() {
    setName("")
    setWilaya("")
    setPhone("")
    setEmail("")
    setErrors({})
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères"
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    startTransition(async () => {
      const result = await createClient({
        name: name.trim(),
        wilaya: wilaya || null,
        phone: phone || null,
        email: email || null,
        unitId,
        companyId: "",
      })

      if (result.success) {
        toast.success("Client créé avec succès")
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.error ?? "Une erreur est survenue")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
          Créer un client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Remplissez les informations du client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="Nom du client"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                required
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="wilaya">Wilaya</FieldLabel>
              <Select value={wilaya} onValueChange={setWilaya}>
                <SelectTrigger id="wilaya">
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
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
              <Input
                id="phone"
                placeholder="Numéro de téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

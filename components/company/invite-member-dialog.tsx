"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendInvitation } from "@/actions/invitation"

interface UnitOption {
  id: string
  name: string
}

interface InviteMemberDialogProps {
  units: UnitOption[]
}

export function InviteMemberDialog({ units }: InviteMemberDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState("")
  const [unitId, setUnitId] = useState("")
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")
  const [jobTitle, setJobTitle] = useState("")

  const resetForm = () => {
    setEmail("")
    setUnitId("")
    setRole("USER")
    setJobTitle("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !unitId) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setPending(true)

    try {
      const result = await sendInvitation({
        email,
        unitId,
        role,
        jobTitle: jobTitle || undefined,
      })

      if (result.success) {
        toast.success("Invitation envoyée avec succès")
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de l'envoi de l'invitation")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Inviter un membre</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour rejoindre votre entreprise.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="membre@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={unitId} onValueChange={setUnitId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "ADMIN" | "USER")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="USER">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobTitle">Poste (optionnel)</Label>
              <Input
                id="jobTitle"
                placeholder="Ingénieur, Chef de projet..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

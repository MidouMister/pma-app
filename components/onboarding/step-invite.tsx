"use client"

import { useAtom } from "jotai"
import { teamInvitesAtom } from "@/lib/atoms/onboarding"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Delete01Icon, Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type StepInviteProps = {
  onSkip: () => void
}

export function StepInvite({ onSkip }: StepInviteProps) {
  const [invites, setInvites] = useAtom(teamInvitesAtom)

  const addEntry = () => {
    setInvites([...invites, { email: "", role: "USER" }])
  }

  const removeEntry = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index))
  }

  const updateEntry = (
    index: number,
    field: "email" | "role",
    value: string
  ) => {
    const updated = [...invites]
    updated[index] = { ...updated[index], [field]: value }
    setInvites(updated)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground">
          Inviter l&apos;équipe
        </h2>
        <p className="text-base text-muted-foreground">
          Invitez les membres de votre équipe à rejoindre l&apos;entreprise
          (optionnel)
        </p>
      </div>

      {invites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center transition-all duration-200 hover:border-primary/50 hover:bg-muted/50">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <HugeiconsIcon icon={Add01Icon} className="size-6 text-primary" />
          </div>
          <p className="mb-4 text-base font-medium text-foreground">
            Aucun membre invité pour le moment
          </p>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Vous pouvez ajouter des membres maintenant ou continuer plus tard
          </p>
          <Button
            onClick={addEntry}
            className="min-w-40"
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
            Ajouter un membre
          </Button>
        </div>
      )}

      {invites.length > 0 && (
        <FieldGroup>
          {invites.map((entry, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Membre {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeEntry(index)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`invite-email-${index}`}>
                    Email <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={`invite-email-${index}`}
                    type="email"
                    value={entry.email}
                    onChange={(e) =>
                      updateEntry(index, "email", e.target.value)
                    }
                    placeholder="membre@entreprise.dz"
                    className="transition-all duration-200"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`invite-role-${index}`}>
                    Rôle <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={entry.role}
                    onValueChange={(v) =>
                      updateEntry(index, "role", v as "ADMIN" | "USER")
                    }
                  >
                    <SelectTrigger
                      id={`invite-role-${index}`}
                      className="transition-all duration-200"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Utilisateur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addEntry}
            className="w-full transition-all duration-200 hover:bg-muted"
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
            Ajouter un autre membre
          </Button>
        </FieldGroup>
      )}

      <div className="flex flex-col gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onSkip}
          className="transition-all duration-200 hover:bg-muted"
        >
          Passer pour le moment
        </Button>
      </div>
    </div>
  )
}

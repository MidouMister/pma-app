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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Inviter l&apos;équipe</h2>
        <p className="text-sm text-muted-foreground">
          Invitez les membres de votre équipe à rejoindre l&apos;entreprise
          (optionnel)
        </p>
      </div>

      {invites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun membre invité pour le moment
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={addEntry}
            className="mt-4"
          >
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
            Ajouter un membre
          </Button>
        </div>
      )}

      {invites.length > 0 && (
        <FieldGroup>
          {invites.map((entry, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Membre {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeEntry(index)}
                >
                  <HugeiconsIcon icon={Delete01Icon} data-icon="inline-start" />
                </Button>
              </div>
              <Field>
                <FieldLabel htmlFor={`invite-email-${index}`}>Email</FieldLabel>
                <Input
                  id={`invite-email-${index}`}
                  type="email"
                  value={entry.email}
                  onChange={(e) => updateEntry(index, "email", e.target.value)}
                  placeholder="membre@entreprise.dz"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`invite-role-${index}`}>Rôle</FieldLabel>
                <Select
                  value={entry.role}
                  onValueChange={(v) =>
                    updateEntry(index, "role", v as "ADMIN" | "USER")
                  }
                >
                  <SelectTrigger id={`invite-role-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ))}

          <Button variant="outline" onClick={addEntry}>
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
            Ajouter un autre membre
          </Button>
        </FieldGroup>
      )}

      <Button variant="outline" onClick={onSkip}>
        Passer pour le moment
      </Button>
    </div>
  )
}

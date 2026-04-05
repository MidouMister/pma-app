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
import {
  Delete01Icon,
  Add01Icon,
  Mail01Icon,
  UserIcon,
  UserGroup02Icon,
} from "@hugeicons/core-free-icons"
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={UserGroup02Icon}
              className="h-6 w-6 text-muted-foreground"
            />
          </div>
          <p className="text-sm font-medium text-foreground">
            Aucun membre invité pour le moment
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vous pourrez inviter des membres plus tard depuis les paramètres
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
        <FieldGroup className="space-y-4">
          {invites.map((entry, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Membre {index + 1}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeEntry(index)}
                >
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    data-icon="inline-start"
                    className="h-4 w-4"
                  />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`invite-email-${index}`}>
                    Email
                  </FieldLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </div>
                    <Input
                      id={`invite-email-${index}`}
                      type="email"
                      value={entry.email}
                      onChange={(e) =>
                        updateEntry(index, "email", e.target.value)
                      }
                      placeholder="membre@entreprise.dz"
                      className="h-12 pl-10"
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`invite-role-${index}`}>Rôle</FieldLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2">
                      <HugeiconsIcon
                        icon={UserIcon}
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </div>
                    <Select
                      value={entry.role}
                      onValueChange={(v) =>
                        updateEntry(index, "role", v as "ADMIN" | "USER")
                      }
                    >
                      <SelectTrigger
                        id={`invite-role-${index}`}
                        className="h-12 pl-10"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Utilisateur</SelectItem>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addEntry} className="w-fit">
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
            Ajouter un autre membre
          </Button>
        </FieldGroup>
      )}

      <Button variant="outline" onClick={onSkip} className="w-full">
        Passer pour le moment
      </Button>
    </div>
  )
}

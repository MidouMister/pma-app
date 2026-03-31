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
import { Badge } from "@/components/ui/badge"
import {
  Delete01Icon,
  Add01Icon,
  UserPlus,
  Shield01Icon,
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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Inviter l&apos;équipe
        </h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez les membres qui travailleront avec vous — vous pourrez
          toujours en inviter d&apos;autres plus tard
        </p>
      </div>

      {/* Empty state */}
      {invites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={UserPlus} className="size-6" />
          </div>
          <h3 className="text-base font-medium">Aucun invité</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Commencez par ajouter un membre de votre équipe
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={addEntry}
            className="mt-5 gap-2"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Ajouter un membre
          </Button>
        </div>
      )}

      {/* Invite cards */}
      {invites.length > 0 && (
        <div className="flex flex-col gap-3">
          {invites.map((entry, index) => (
            <div
              key={index}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Membre {index + 1}
                  </span>
                  <Badge
                    variant={entry.role === "ADMIN" ? "default" : "secondary"}
                    className="gap-1 text-xs"
                  >
                    <HugeiconsIcon icon={Shield01Icon} className="size-3" />
                    {entry.role === "ADMIN" ? "Admin" : "Utilisateur"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeEntry(index)}
                  className="opacity-60 transition-opacity hover:opacity-100"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                </Button>
              </div>

              <FieldGroup className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`invite-email-${index}`}>
                    Email
                  </FieldLabel>
                  <Input
                    id={`invite-email-${index}`}
                    type="email"
                    value={entry.email}
                    onChange={(e) =>
                      updateEntry(index, "email", e.target.value)
                    }
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
              </FieldGroup>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addEntry}
            className="w-fit gap-2 self-start"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Ajouter un autre membre
          </Button>
        </div>
      )}

      {/* Skip */}
      <div className="border-t pt-4">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Passer pour le moment
        </Button>
      </div>
    </div>
  )
}

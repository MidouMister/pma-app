"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { createPhase, updatePhase } from "@/actions/phase"
import type { Status } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { FormModal } from "@/components/shared/form-modal"

interface PhaseDialogProps {
  projectId: string
  projectODS: Date | null
  projectMontantHT: number
  currentPhasesSum: number
  phase?: {
    id: string
    name: string
    code: string
    montantHT: number
    startDate: Date | null
    endDate: Date | null
    status: string
    obs: string | null
    progress: number
  }
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PhaseDialog({
  projectId,
  projectODS,
  projectMontantHT,
  currentPhasesSum,
  phase,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: PhaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const open = externalOpen ?? internalOpen
  const setOpen = externalOnOpenChange ?? setInternalOpen

  const [formData, setFormData] = useState({
    name: phase?.name ?? "",
    code: phase?.code ?? "",
    montantHT: phase?.montantHT?.toString() ?? "",
    startDate: phase?.startDate ?? null,
    endDate: phase?.endDate ?? null,
    status: phase?.status ?? "New",
    obs: phase?.obs ?? "",
    progress: phase?.progress?.toString() ?? "0",
  })

  const remainingBudget = projectMontantHT - currentPhasesSum
  const duration =
    formData.startDate && formData.endDate
      ? Math.ceil(
          (new Date(formData.endDate).getTime() -
            new Date(formData.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        name: formData.name,
        code: formData.code,
        montantHT: Number(formData.montantHT),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status as Status,
        obs: formData.obs || null,
        progress: Number(formData.progress),
        projectId,
      }

      let result
      if (phase) {
        result = await updatePhase({ id: phase.id, ...data })
      } else {
        result = await createPhase(data)
      }

      if (result.success) {
        toast.success(phase ? "Phase mise à jour" : "Phase créée avec succès")
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Une erreur est survenue")
      }
    })
  }

  return (
    <FormModal
      open={open}
      onOpenChange={setOpen}
      title={phase ? "Modifier la phase" : "Ajouter une phase"}
      description={
        phase
          ? "Modifiez les informations de la phase."
          : "Ajoutez une nouvelle phase au projet."
      }
      trigger={<Button>{phase ? "Modifier" : "Ajouter une phase"}</Button>}
      size="md"
      isPending={isPending}
      onSubmit={handleSubmit}
      submitLabel={phase ? "Enregistrer" : "Créer"}
      submitPendingLabel="En cours..."
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la phase *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="montantHT">Montant HT (DA) *</Label>
          <Input
            id="montantHT"
            type="number"
            value={formData.montantHT}
            onChange={(e) =>
              setFormData({ ...formData, montantHT: e.target.value })
            }
            required
            min="0"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            Budget restant disponible:{" "}
            {formatCurrency(remainingBudget - Number(formData.montantHT || 0))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date de début</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {formData.startDate
                    ? format(formData.startDate, "dd MMM yyyy")
                    : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startDate ?? undefined}
                  onSelect={(date) =>
                    setFormData({ ...formData, startDate: date ?? null })
                  }
                  disabled={(date) =>
                    projectODS ? date < new Date(projectODS) : false
                  }
                />
              </PopoverContent>
            </Popover>
            {projectODS && (
              <p className="text-xs text-muted-foreground">
                La date doit être ≥ {format(projectODS, "dd MMM yyyy")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {formData.endDate
                    ? format(formData.endDate, "dd MMM yyyy")
                    : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.endDate ?? undefined}
                  onSelect={(date) =>
                    setFormData({ ...formData, endDate: date ?? null })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {duration !== null && (
          <p className="text-xs text-muted-foreground">
            Durée: {duration} jours
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "New" | "InProgress" | "Pause" | "Complete",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">Nouveau</SelectItem>
                <SelectItem value="InProgress">En cours</SelectItem>
                <SelectItem value="Pause">En pause</SelectItem>
                <SelectItem value="Complete">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="progress">Progression (%)</Label>
            <Input
              id="progress"
              type="number"
              value={formData.progress}
              onChange={(e) =>
                setFormData({ ...formData, progress: e.target.value })
              }
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="obs">Observations</Label>
          <Textarea
            id="obs"
            value={formData.obs}
            onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
            placeholder="Observations optionnelles..."
          />
        </div>
      </div>
    </FormModal>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
  })
    .format(amount)
    .replace("DZD", "DA")
}

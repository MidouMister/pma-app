"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createSubPhase, updateSubPhase } from "@/actions/subphase"
import type { SubPhaseStatus } from "@prisma/client"

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { FormModal } from "@/components/shared/form-modal"

interface SubPhaseDialogProps {
  phaseId: string
  phaseStartDate: Date | null
  phaseEndDate: Date | null
  subPhase?: {
    id: string
    name: string
    code: string
    status: string
    progress: number
    startDate: Date | null
    endDate: Date | null
  }
  onSuccess?: () => void
}

export function SubPhaseDialog({
  phaseId,
  phaseStartDate,
  phaseEndDate,
  subPhase,
  onSuccess,
}: SubPhaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: subPhase?.name ?? "",
    code: subPhase?.code ?? "",
    status: subPhase?.status ?? "TODO",
    progress: subPhase?.progress?.toString() ?? "0",
    startDate: subPhase?.startDate ?? null,
    endDate: subPhase?.endDate ?? null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        name: formData.name,
        code: formData.code,
        status: formData.status as SubPhaseStatus,
        progress: Number(formData.progress),
        startDate: formData.startDate,
        endDate: formData.endDate,
        phaseId,
      }

      let result
      if (subPhase) {
        result = await updateSubPhase({ id: subPhase.id, ...data })
      } else {
        result = await createSubPhase(data)
      }

      if (result.success) {
        toast.success(
          subPhase ? "Sous-phase mise à jour" : "Sous-phase créée avec succès"
        )
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
      title={subPhase ? "Modifier la sous-phase" : "Ajouter une sous-phase"}
      description={
        phaseStartDate && phaseEndDate
          ? `La phase parente va du ${format(phaseStartDate, "dd MMM yyyy")} au ${format(phaseEndDate, "dd MMM yyyy")}`
          : undefined
      }
      trigger={
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une sous-phase
        </Button>
      }
      size="md"
      isPending={isPending}
      onSubmit={handleSubmit}
      submitLabel={subPhase ? "Enregistrer" : "Créer"}
      submitPendingLabel="En cours..."
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "TODO" | "COMPLETED",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">À faire</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
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
                />
              </PopoverContent>
            </Popover>
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
      </div>
    </FormModal>
  )
}

"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Flag } from "lucide-react"
import { createGanttMarker, updateGanttMarker } from "@/actions/gantt-marker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { FormModal } from "@/components/shared/form-modal"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  { name: "Bleu", hex: "#3b82f6" },
  { name: "Rouge", hex: "#ef4444" },
  { name: "Vert", hex: "#22c55e" },
  { name: "Orange", hex: "#f97316" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Rose", hex: "#ec4899" },
  { name: "Ambre", hex: "#f59e0b" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Émeraude", hex: "#10b981" },
  { name: "Ardoise", hex: "#64748b" },
]

interface GanttMarkerDialogProps {
  projectId: string
  marker?: {
    id: string
    label: string
    date: Date
    className?: string | null
  }
  defaultDate?: Date | null
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function extractColor(className?: string | null): string {
  if (!className) return "#3b82f6"
  if (className.startsWith("color:")) return className.slice(6)
  return "#3b82f6"
}

export function GanttMarkerDialog({
  projectId,
  marker,
  defaultDate,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: GanttMarkerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const open = externalOpen ?? internalOpen
  const setOpen = externalOnOpenChange ?? setInternalOpen

  const [label, setLabel] = useState(marker?.label ?? "")
  const [date, setDate] = useState<Date | null>(
    marker?.date ?? defaultDate ?? null
  )
  const [color, setColor] = useState(extractColor(marker?.className))

  function handleReset() {
    setLabel("")
    setDate(null)
    setColor("#3b82f6")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!label.trim()) {
      toast.error("Le libellé est requis")
      return
    }
    if (!date) {
      toast.error("La date est requise")
      return
    }

    startTransition(async () => {
      const payload = {
        projectId,
        label: label.trim(),
        date,
        className: `color:${color}`,
      }

      let result
      if (marker) {
        result = await updateGanttMarker({ id: marker.id, ...payload })
      } else {
        result = await createGanttMarker(payload)
      }

      if (result.success) {
        toast.success(
          marker ? "Marqueur mis à jour" : "Marqueur créé avec succès"
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
      title={marker ? "Modifier le marqueur" : "Ajouter un marqueur"}
      description="Les marqueurs apparaissent comme des lignes verticales sur le diagramme de Gantt."
      icon={<Flag className="size-5" />}
      size="sm"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitLabel={marker ? "Enregistrer" : "Créer"}
      submitPendingLabel="En cours..."
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="label">Libellé *</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Réception béton, Livraison acier..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start font-normal"
              >
                {date ? format(date, "dd MMM yyyy") : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date ?? undefined}
                onSelect={(d) => setDate(d ?? null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Couleur</Label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                title={preset.name}
                className={cn(
                  "h-8 w-full rounded-md border-2 transition-all hover:scale-110",
                  color === preset.hex
                    ? "border-foreground ring-2 ring-foreground/30"
                    : "border-transparent"
                )}
                style={{ backgroundColor: preset.hex }}
                onClick={() => setColor(preset.hex)}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded-md border"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {color}
            </span>
            <div
              className="ml-auto h-6 w-10 rounded-md border"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    </FormModal>
  )
}

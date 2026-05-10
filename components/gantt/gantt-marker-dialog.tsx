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

interface GanttMarkerDialogProps {
  projectId: string
  marker?: {
    id: string
    label: string
    date: Date
    className?: string | null
  }
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function GanttMarkerDialog({
  projectId,
  marker,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: GanttMarkerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const open = externalOpen ?? internalOpen
  const setOpen = externalOnOpenChange ?? setInternalOpen

  const [label, setLabel] = useState(marker?.label ?? "")
  const [date, setDate] = useState<Date | null>(marker?.date ?? null)
  const [cssClass, setCssClass] = useState(marker?.className ?? "")

  function handleReset() {
    setLabel("")
    setDate(null)
    setCssClass("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!label.trim()) {
      toast.error("Le libell\u00e9 est requis")
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
        className: cssClass.trim() || null,
      }

      let result
      if (marker) {
        result = await updateGanttMarker({ id: marker.id, ...payload })
      } else {
        result = await createGanttMarker(payload)
      }

      if (result.success) {
        toast.success(
          marker
            ? "Marqueur mis \u00e0 jour"
            : "Marqueur cr\u00e9\u00e9 avec succ\u00e8s"
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
      submitLabel={marker ? "Enregistrer" : "Cr\u00e9er"}
      submitPendingLabel="En cours..."
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="label">Libell\u00e9 *</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: R\u00e9ception b\u00e9ton, Livraison acier..."
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
                {date
                  ? format(date, "dd MMM yyyy")
                  : "S\u00e9lectionner une date"}
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
          <Label htmlFor="className">Classe CSS (optionnel)</Label>
          <Input
            id="className"
            value={cssClass}
            onChange={(e) => setCssClass(e.target.value)}
            placeholder="Ex: text-red-500, border-dashed..."
          />
          <p className="text-xs text-muted-foreground">
            Classe Tailwind pour personnaliser l&apos;apparence du marqueur
          </p>
        </div>
      </div>
    </FormModal>
  )
}

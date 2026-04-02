"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { FormModal } from "@/components/shared/form-modal"
import { FormSection } from "@/components/shared/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGanttMarker, updateGanttMarker } from "@/actions/gantt-marker"

interface GanttMarkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  marker?: {
    id: string
    label: string
    date: Date
    className: string | null
  } | null
}

export function GanttMarkerDialog({
  open,
  onOpenChange,
  projectId,
  marker,
}: GanttMarkerDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!marker

  const [label, setLabel] = useState(marker?.label ?? "")
  const [date, setDate] = useState(
    marker?.date ? marker.date.toISOString().slice(0, 16) : ""
  )
  const [className, setClassName] = useState(marker?.className ?? "")

  function handleReset() {
    setLabel("")
    setDate("")
    setClassName("")
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

    const payload = {
      projectId,
      label: label.trim(),
      date: new Date(date),
      className: className.trim() || null,
      ...(isEditing && marker ? { id: marker.id } : {}),
    }

    startTransition(async () => {
      const action = isEditing ? updateGanttMarker : createGanttMarker
      const result = await action(payload)

      if (result.success) {
        toast.success(isEditing ? "Marqueur mis à jour" : "Marqueur créé")
        handleReset()
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Une erreur est survenue")
      }
    })
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Modifier le marqueur" : "Nouveau marqueur"}
      description={
        isEditing
          ? "Modifiez les informations du marqueur Gantt"
          : "Ajoutez un marqueur visuel sur le diagramme de Gantt"
      }
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitLabel={isEditing ? "Mettre à jour" : "Créer"}
    >
      <div className="flex flex-col gap-4">
        <FormSection number="1" title="Informations">
          <div className="flex flex-col gap-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Réception béton, Livraison acier..."
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="className">Classe CSS (optionnel)</Label>
            <Input
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Ex: bg-red-500, border-dashed..."
            />
            <p className="text-xs text-muted-foreground">
              Classe Tailwind pour personnaliser l&apos;apparence du marqueur
            </p>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}

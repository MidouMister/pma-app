"use client"

import { useState, useTransition, useCallback, type ReactNode } from "react"
import { createLane, updateLane, deleteLane } from "@/actions/lane"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormModal } from "@/components/shared/form-modal"
import { Columns3, Plus } from "lucide-react"

export interface LaneDialogProps {
  lane?: {
    id: string
    name: string
    color: string | null
  }
  unitId: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
}

export function LaneDialog({
  lane,
  unitId,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger,
}: LaneDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = externalOnOpenChange ?? setInternalOpen

  const [formData, setFormData] = useState({
    name: lane?.name ?? "",
    color: lane?.color ?? "#6366f1",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const action = lane?.id ? updateLane : createLane
      const result = await action({
        ...formData,
        id: lane?.id,
        unitId,
      })

      if (result.success) {
        toast.success(lane ? "Colonne mise à jour" : "Colonne créée")
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  const handleDelete = () => {
    if (!lane?.id) return
    startTransition(async () => {
      const result = await deleteLane(lane.id)
      if (result.success) {
        toast.success("Colonne supprimée")
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  const isEdit = !!lane?.id

  const resetForm = useCallback(() => {
    setFormData({ name: "", color: "#6366f1" })
  }, [])

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setIsOpen}
      title={isEdit ? "Modifier la colonne" : "Nouvelle colonne"}
      description={
        isEdit
          ? "Modifiez les détails de la colonne"
          : "Créez une nouvelle colonne pour le tableau Kanban"
      }
      icon={<Columns3 className="size-5" />}
      size="sm"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={resetForm}
      submitLabel={isEdit ? "Enregistrer" : "Créer"}
      submitPendingLabel={isEdit ? "Enregistrement..." : "Création..."}
      trigger={
        trigger !== undefined ? (
          trigger
        ) : externalOpen === undefined ? (
          <Button className="gap-2">
            <Plus className="size-4" />
            {isEdit ? "Modifier" : "Nouvelle colonne"}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 py-4">
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nom de la colonne"
            required
          />
        </div>

        <div>
          <Label htmlFor="color">Couleur</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="color"
              value={formData.color ?? "#6366f1"}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="h-10 w-14 cursor-pointer rounded border"
            />
            <Input
              value={formData.color ?? "#6366f1"}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              placeholder="#6366f1"
              className="flex-1"
            />
          </div>
        </div>

        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            Supprimer
          </Button>
        )}
      </div>
    </FormModal>
  )
}

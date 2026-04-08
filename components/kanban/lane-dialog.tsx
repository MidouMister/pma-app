"use client"

import { useState, useTransition } from "react"
import { createLane, updateLane, deleteLane } from "@/actions/lane"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

export interface LaneDialogProps {
  lane?: {
    id: string
    name: string
    color: string | null
  }
  unitId: string
  onSuccess?: () => void
}

export function LaneDialog({ lane, unitId, onSuccess }: LaneDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

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
        setOpen(false)
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
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  const isEdit = !!lane?.id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{isEdit ? "Modifier" : "Nouvelle colonne"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier la colonne" : "Nouvelle colonne"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifiez les détails de la colonne"
                : "Créez une nouvelle colonne pour le tableau Kanban"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
          </div>

          <DialogFooter className="flex justify-between">
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
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner className="size-4" /> : null}
                {isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

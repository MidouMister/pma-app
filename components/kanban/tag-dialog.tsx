"use client"

import { useState, useTransition } from "react"
import { createTag, deleteTag } from "@/actions/tag"
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
import { Spinner } from "@/components/ui/spinner"

export interface TagDialogProps {
  tag?: {
    id: string
    name: string
    color: string
  }
  unitId: string
  onSuccess?: () => void
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
]

export function TagDialog({ tag, unitId, onSuccess }: TagDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: tag?.name ?? "",
    color: tag?.color ?? "#6366f1",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await createTag({
        ...formData,
        id: tag?.id,
        unitId,
      })

      if (result.success) {
        toast.success(tag ? "Tag mis à jour" : "Tag créé")
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  const handleDelete = () => {
    if (!tag?.id) return
    startTransition(async () => {
      const result = await deleteTag(tag.id)
      if (result.success) {
        toast.success("Tag supprimé")
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  const isEdit = !!tag?.id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{isEdit ? "Modifier" : "Nouveau tag"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier le tag" : "Nouveau tag"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifiez les détails du tag"
                : "Créez un nouveau tag pour vos tâches"}
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
                placeholder="Nom du tag"
                required
              />
            </div>

            <div>
              <Label>Couleur</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && (
                      <span className="text-xs text-white">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-8 w-10 cursor-pointer rounded"
                />
                <Input
                  value={formData.color}
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

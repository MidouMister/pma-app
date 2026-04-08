"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, X, Tag as TagIcon, Loader2 } from "lucide-react"
import type { Tag } from "@prisma/client"
import { createTag, deleteTag } from "@/actions/tag"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FieldGroup,
  Field,
  FieldLabel,
} from "@/components/ui/field"

interface TagManagerProps {
  unitId: string
  initialTags: Tag[]
}

const PRESET_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#71717a", // zinc-500
]

export function TagManager({ unitId, initialTags }: TagManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [tagName, setTagName] = useState("")
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0])

  const handleCreate = () => {
    if (!tagName.trim()) return

    startTransition(async () => {
      const res = await createTag({
        name: tagName.trim(),
        color: tagColor,
        unitId,
      })

      if (res.success) {
        toast.success("Tag créé")
        setTagName("")
        setIsOpen(false)
      } else {
        toast.error(res.error ?? "Erreur")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce tag ? Il sera retiré de toutes les tâches.")) return

    startTransition(async () => {
      const res = await deleteTag(id)
      if (res.success) {
        toast.success("Tag supprimé")
      } else {
        toast.error(res.error ?? "Erreur")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>Gestion des Tags</CardTitle>
          <CardDescription>
            Créez et gérez les tags pour organiser vos tâches
          </CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nouveau Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau tag</DialogTitle>
              <DialogDescription>
                Définissez un nom et une couleur pour votre tag.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>Nom du tag</FieldLabel>
                <Input
                  placeholder="Ex: Urgent, Design, Bug..."
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                  }}
                />
              </Field>
              <Field>
                <FieldLabel>Couleur</FieldLabel>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTagColor(color)}
                      className="size-8 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: tagColor === color ? "white" : "transparent",
                        boxShadow: tagColor === color ? "0 0 0 2px " + color : "none",
                      }}
                    />
                  ))}
                </div>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !tagName.trim()}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer le tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {initialTags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 italic">
              Aucun tag créé pour cette unité.
            </p>
          ) : (
            initialTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="group relative flex items-center gap-1.5 px-3 py-1 text-sm font-medium transition-all"
                style={{
                  backgroundColor: tag.color + "15",
                  color: tag.color,
                  borderColor: tag.color + "30",
                }}
              >
                <TagIcon className="size-3" />
                {tag.name}
                <button
                  onClick={() => handleDelete(tag.id)}
                  disabled={isPending}
                  className="ml-1 rounded-full p-0.5 opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

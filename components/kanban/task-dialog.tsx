"use client"

import { useState, useTransition } from "react"
import { createTask, updateTask } from "@/actions/task"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

export interface TaskDialogProps {
  task?: {
    id: string
    title: string
    description: string | null
    projectId: string
    phaseId: string | null
    subPhaseId: string | null
    laneId: string | null
    assignedUserId: string | null
  }
  unitId: string
  companyId: string
  projects: Array<{
    id: string
    name: string
    phases: Array<{
      id: string
      name: string
      SubPhases: Array<{ id: string; name: string }>
    }>
  }>
  lanes: Array<{ id: string; name: string }>
  teamMembers: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export function TaskDialog({
  task,
  unitId,
  companyId,
  projects,
  lanes,
  teamMembers,
  onSuccess,
}: TaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    projectId: task?.projectId ?? "",
    phaseId: task?.phaseId ?? "",
    subPhaseId: task?.subPhaseId ?? "",
    laneId: task?.laneId ?? "",
    assignedUserId: task?.assignedUserId ?? "",
  })

  const selectedProject = projects.find((p) => p.id === formData.projectId)
  const projectPhases = selectedProject?.phases ?? []
  const selectedPhase = projectPhases.find((ph) => ph.id === formData.phaseId)
  const phaseSubPhases = selectedPhase?.SubPhases ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const action = task?.id ? updateTask : createTask
      const result = await action({
        ...formData,
        id: task?.id,
        unitId,
        companyId,
      })

      if (result.success) {
        toast.success(task ? "Tâche mise à jour" : "Tâche créée")
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  const isEdit = !!task?.id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{isEdit ? "Modifier" : "Nouvelle tâche"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier la tâche" : "Nouvelle tâche"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifiez les détails de la tâche"
                : "Créez une nouvelle tâche pour ce projet"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Titre de la tâche"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la tâche"
                rows={3}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="projectId">Projet</Label>
              <Select
                value={formData.projectId}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    projectId: v,
                    phaseId: "",
                    subPhaseId: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phaseId">Phase</Label>
              <Select
                value={formData.phaseId}
                onValueChange={(v) =>
                  setFormData({ ...formData, phaseId: v, subPhaseId: "" })
                }
                disabled={!formData.projectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une phase" />
                </SelectTrigger>
                <SelectContent>
                  {projectPhases.map((ph) => (
                    <SelectItem key={ph.id} value={ph.id}>
                      {ph.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subPhaseId">Sous-phase</Label>
              <Select
                value={formData.subPhaseId ?? ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, subPhaseId: v })
                }
                disabled={!formData.phaseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une sous-phase (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {phaseSubPhases.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label htmlFor="laneId">Colonne</Label>
              <Select
                value={formData.laneId ?? ""}
                onValueChange={(v) => setFormData({ ...formData, laneId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  {lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedUserId">Assigné à</Label>
              <Select
                value={formData.assignedUserId ?? ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, assignedUserId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

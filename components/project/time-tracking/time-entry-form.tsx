"use client"

import { useCallback, useState, useTransition } from "react"
import { Clock } from "lucide-react"
import { toast } from "sonner"

import { FormModal } from "@/components/shared/form-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { createTimeEntry, updateTimeEntry } from "@/actions/time-entry"

import { formatDuration } from "@/lib/format"

interface TimeEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Array<{ id: string; name: string }>
  projectId?: string
  onSuccess?: () => void
  entry?: {
    id: string
    projectId: string
    taskId: string | null
    description: string | null
    startTime: Date | string
    endTime: Date | string | null
  }
  tasks?: Array<{ id: string; title: string }>
}

function computeDurationMinutes(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / 60000)
}

export function TimeEntryForm({
  open,
  onOpenChange,
  projects,
  projectId: preselectedProjectId,
  onSuccess,
  entry,
  tasks,
}: TimeEntryFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!entry

  const [selectedProjectId, setSelectedProjectId] = useState(
    entry?.projectId ?? preselectedProjectId ?? ""
  )
  const [selectedTaskId, setSelectedTaskId] = useState(entry?.taskId ?? "")
  const [description, setDescription] = useState(entry?.description ?? "")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const durationMinutes =
    startTime && endTime ? computeDurationMinutes(startTime, endTime) : 0

  const resetForm = useCallback(() => {
    setSelectedProjectId(preselectedProjectId ?? "")
    setSelectedTaskId("")
    setDescription("")
    setStartTime("")
    setEndTime("")
    setValidationError(null)
  }, [preselectedProjectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!selectedProjectId) {
      setValidationError("Veuillez sélectionner un projet")
      return
    }

    if (!startTime || !endTime) {
      setValidationError("Veuillez renseigner les heures de début et de fin")
      return
    }

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    if (endDate <= startDate) {
      setValidationError(
        "L'heure de fin doit être postérieure à l'heure de début"
      )
      return
    }

    startTransition(async () => {
      let result: { success: boolean; error?: string }

      if (isEdit) {
        result = await updateTimeEntry(entry!.id, {
          description: description || null,
          startTime: startDate,
          endTime: endDate,
          taskId: selectedTaskId || null,
        })
      } else {
        result = await createTimeEntry({
          projectId: selectedProjectId,
          taskId: selectedTaskId || null,
          description: description || null,
          startTime: startDate,
          endTime: endDate,
        })
      }

      if (result.success) {
        toast.success(
          isEdit ? "Entrée de temps modifiée" : "Entrée de temps ajoutée"
        )
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit ? "Modifier l'entrée de temps" : "Ajouter une entrée de temps"
      }
      description="Enregistrez manuellement du temps passé sur un projet"
      icon={<Clock className="size-5" />}
      size="md"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={resetForm}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="te-project">
            Projet <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            disabled={isEdit}
          >
            <SelectTrigger id="te-project">
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="te-task" className="text-xs text-muted-foreground">
            Tâche (optionnel)
          </Label>
          <Select
            value={selectedTaskId}
            onValueChange={setSelectedTaskId}
            disabled={!selectedProjectId}
          >
            <SelectTrigger id="te-task">
              <SelectValue placeholder="Aucune tâche" />
            </SelectTrigger>
            <SelectContent>
              {tasks?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="te-description"
            className="text-xs text-muted-foreground"
          >
            Description (optionnel)
          </Label>
          <Textarea
            id="te-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du travail effectué"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="te-start">
              Début <span className="text-destructive">*</span>
            </Label>
            <Input
              id="te-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="te-end">
              Fin <span className="text-destructive">*</span>
            </Label>
            <Input
              id="te-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {startTime && endTime && durationMinutes > 0 && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Durée : </span>
            <span className="font-semibold tabular-nums">
              {formatDuration(durationMinutes)}
            </span>
          </div>
        )}

        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
      </div>
    </FormModal>
  )
}

"use client"

import { useState } from "react"
import { Play, Square, Timer, ListTodo } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useTimer } from "@/hooks/use-timer"

import { cn } from "@/lib/utils"

interface TimerWidgetProps {
  projectId: string
  projects?: Array<{ id: string; name: string }>
  tasks?: Array<{ id: string; title: string }>
  onTimerComplete?: () => void
}

export function TimerWidget({
  projectId,
  projects,
  tasks,
  onTimerComplete,
}: TimerWidgetProps) {
  const { isRunning, formattedTime, start, stop } = useTimer()
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "")
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [description, setDescription] = useState("")
  const [statusText, setStatusText] = useState("Chronomètre prêt")

  const canStart = !!selectedProjectId && !isRunning

  const handleStart = async () => {
    if (!selectedProjectId) {
      toast.error("Veuillez sélectionner un projet")
      return
    }
    setStatusText("En cours...")
    const result = await start({
      projectId: selectedProjectId,
      taskId: selectedTaskId || null,
      description: description || null,
    })
    if (!result.success) {
      toast.error(result.error ?? "Erreur")
      setStatusText("Chronomètre prêt")
    }
  }

  const handleStop = async () => {
    const result = await stop()
    if (result.success) {
      setStatusText("Arrêté")
      onTimerComplete?.()
    } else {
      toast.error(result.error ?? "Erreur")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="size-4" />
          Chronomètre
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "font-mono text-3xl tracking-wider tabular-nums transition-colors",
              isRunning && "text-primary"
            )}
          >
            {formattedTime}
          </div>
          <p className="text-xs text-muted-foreground">{statusText}</p>
        </div>

        <div className="flex justify-center">
          {isRunning ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              size="icon"
              className="size-12 rounded-full shadow-lg"
            >
              <Square className="size-5" />
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="icon"
              className="size-12 rounded-full bg-green-600 shadow-lg hover:bg-green-700 disabled:opacity-40"
            >
              <Play className="ml-0.5 size-5" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timer-project">
            Projet <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedProjectId}
            onValueChange={(v) => {
              setSelectedProjectId(v)
              setSelectedTaskId("")
            }}
            disabled={isRunning}
          >
            <SelectTrigger id="timer-project">
              <SelectValue placeholder="Sélectionner un projet" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="timer-task"
            className="flex items-center gap-1 text-muted-foreground"
          >
            <ListTodo className="size-3.5" />
            Tâche
            <span className="text-xs">(optionnel)</span>
          </Label>
          <Select
            value={selectedTaskId}
            onValueChange={setSelectedTaskId}
            disabled={isRunning || !selectedProjectId}
          >
            <SelectTrigger id="timer-task">
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
            htmlFor="timer-description"
            className="text-xs text-muted-foreground"
          >
            Description (optionnel)
          </Label>
          <Input
            id="timer-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Que faites-vous ?"
            disabled={isRunning}
          />
        </div>
      </CardContent>
    </Card>
  )
}

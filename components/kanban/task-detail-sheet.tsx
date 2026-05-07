"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ChevronRight, Trash2, AlignLeft } from "lucide-react"

import { getTaskDetailsData } from "@/actions/task-details"
import { createComment } from "@/actions/comment"
import { completeTask, updateTask, deleteTask } from "@/actions/task"

import { type TaskDetailData } from "./types"
import { TaskMetadata } from "./task-metadata"
import { TaskComments } from "./task-comments"
import { TaskTimeEntries } from "./task-time-entries"

interface TaskDetailSheetTask {
  id: string
  title: string
  description: string | null
  complete: boolean
  laneId?: string | null
  laneName?: string | null
  assignedUserId?: string | null
  assignedUserName?: string | null
  assignedUserAvatar?: string | null
  dueDate: Date | null
  projectId: string
  projectName?: string
  phaseName?: string | null
  subPhaseName?: string | null
  tagNames?: string[]
  tagColors?: string[]
  Tags?: { id: string; name: string; color: string }[]
  Project?: { name: string } | null
  Phase?: { name: string } | null
  SubPhase?: { name: string } | null
}

interface TaskDetailSheetProps {
  task: TaskDetailSheetTask | null
  isOpen: boolean
  onClose: () => void
  canEdit?: boolean
  lanes?: { id: string; name: string; color: string | null }[]
  currentUser?: { name: string | null; avatarUrl: string | null } | null
}

export function TaskDetailSheet({
  task,
  isOpen,
  onClose,
  canEdit = true,
  lanes: _lanes = [],
  currentUser: _currentUser = null,
}: TaskDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("details")

  const [data, setData] = useState<TaskDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Local state for editing fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [newComment, setNewComment] = useState("")

  // Normalize task data for display
  const _tags =
    task?.Tags ??
    task?.tagNames?.map((name, i) => ({
      id: i.toString(),
      name,
      color: task.tagColors?.[i] ?? "#888",
    })) ??
    []

  useEffect(() => {
    if (!task) return
    let isMounted = true
    if (isOpen && task?.id) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setDueDate(task.dueDate ? new Date(task.dueDate) : null)
      const load = async () => {
        setIsLoading(true)
        try {
          const result = await getTaskDetailsData(task.id, task.projectId)
          if (isMounted) setData(result as TaskDetailData)
        } catch (e) {
          console.error(e)
        } finally {
          if (isMounted) setIsLoading(false)
        }
      }
      load()
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, task])

  const handleUpdateTask = (fields: Record<string, unknown>) => {
    if (!task || !canEdit) return
    startTransition(async () => {
      try {
        const result = await updateTask({ id: task.id, ...fields })
        if (result.success) {
          toast.success("Tâche mise à jour")
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour")
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Une erreur est survenue"
        )
      }
    })
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !task) return

    startTransition(async () => {
      try {
        await createComment(task.id, newComment.trim())
        setNewComment("")
        // Refresh data
        const newData = await getTaskDetailsData(task.id, task.projectId)
        setData(newData as TaskDetailData)
        toast.success("Commentaire ajouté")
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de l'ajout du commentaire"
        )
      }
    })
  }

  const toggleComplete = () => {
    if (!task) return
    startTransition(async () => {
      try {
        await completeTask(task.id)
        toast.success(task.complete ? "Tâche rouverte" : "Tâche complétée")
        onClose()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur")
      }
    })
  }

  const toggleTag = (tagId: string) => {
    const currentTags = data?.taskTagIds || []
    const isNowSelected = currentTags.includes(tagId)
    const newTags = isNowSelected
      ? currentTags.filter((id: string) => id !== tagId)
      : [...currentTags, tagId]

    // Update local state first for instant feedback
    if (data) {
      setData({ ...data, taskTagIds: newTags })
    }
    handleUpdateTask({ tagIds: newTags })
  }

  const handleDelete = () => {
    if (!task || !canEdit) return
    startTransition(async () => {
      try {
        const result = await deleteTask(task.id)
        if (result.success) {
          toast.success("Tâche supprimée")
          onClose()
        } else {
          toast.error(result.error || "Erreur lors de la suppression")
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Une erreur est survenue"
        )
      }
    })
  }

  if (!task) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 space-y-4 border-b p-6">
          <SheetTitle className="sr-only">{task.title}</SheetTitle>
          <div className="mb-2 flex items-center justify-between">
            <Badge
              variant={task.complete ? "secondary" : "default"}
              className="px-3 py-1 text-xs"
            >
              {task.complete ? "Terminé" : task.laneName || "En cours"}
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleComplete}
                disabled={isPending}
                className="h-8 py-0"
              >
                {task.complete ? "Rouvrir" : "Terminer"}
              </Button>
              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 py-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. La tâche &quot;
                        {task.title}&quot; sera définitivement supprimée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="text-destructive-foreground bg-destructive"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== task.title && handleUpdateTask({ title })}
            className="mb-2 h-auto border-none bg-transparent p-0 text-2xl font-bold shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
            placeholder="Titre de la tâche"
          />
          <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {task.Project?.name || task.projectName}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span>{task.Phase?.name || task.phaseName}</span>
            {(task.SubPhase?.name || task.subPhaseName) && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{task.SubPhase?.name || task.subPhaseName}</span>
              </>
            )}
          </div>
          {_lanes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Colonne:</span>
              <Select
                value={(task.laneId ?? "") || ""}
                onValueChange={(val) =>
                  handleUpdateTask({ laneId: val || null })
                }
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  {_lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: lane.color ?? "#71717a" }}
                        />
                        <span>{lane.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </SheetHeader>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6">
          <TaskMetadata
            assignedUserId={task.assignedUserId}
            assignedUserName={task.assignedUserName}
            dueDate={dueDate}
            tags={_tags}
            teamMembers={data?.teamMembers}
            unitTags={data?.unitTags}
            taskTagIds={data?.taskTagIds || []}
            onUpdate={handleUpdateTask}
            onToggleTag={toggleTag}
            onDueDateChange={setDueDate}
          />

          <div className="mb-10 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              <AlignLeft className="h-3.5 w-3.5" /> Description
            </div>
            <Textarea
              placeholder="Ajouter une description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                description !== task.description &&
                handleUpdateTask({ description })
              }
              className="min-h-[140px] resize-none rounded-xl border-border bg-muted/10 p-4 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 h-auto w-full justify-start space-x-6 rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="activity"
                className="rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Activité {data?.comments ? `(${data.comments.length})` : ""}
              </TabsTrigger>
              <TabsTrigger
                value="time"
                className="rounded-xl transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Temps {data?.timeEntries ? `(${data.timeEntries.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <TaskComments
                comments={data?.comments}
                isLoading={isLoading}
                currentUser={_currentUser}
                newComment={newComment}
                isPending={isPending}
                onCommentChange={setNewComment}
                onAddComment={handleAddComment}
              />
            </TabsContent>

            <TabsContent value="time">
              <TaskTimeEntries timeEntries={data?.timeEntries} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  AlignLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Columns3,
  FolderKanban,
  Layers,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { getTaskDetailsData } from "@/actions/task-details"
import { createComment } from "@/actions/comment"
import { completeTask, updateTask, deleteTask } from "@/actions/task"

import { DetailModal } from "@/components/shared/detail-modal"
import { cn } from "@/lib/utils"
import { formatRelativeDueDate } from "@/lib/format"

import { type TaskDetailData } from "@/lib/types"
import { TaskComments } from "./task-comments"
import { TaskTimeEntries } from "./task-time-entries"

interface TaskDetailModalProps {
  task: {
    id: string
    title: string
    description: string | null
    complete: boolean
    laneId: string | null
    laneName: string | null
    assignedUserId: string | null
    assignedUserName: string | null
    assignedUserAvatar: string | null
    dueDate: Date | null
    startDate: Date | null
    projectId: string
    projectName: string
    phaseName: string | null
    subPhaseName: string | null
    tagNames: string[]
    tagColors: string[]
    commentCount: number
  } | null
  isOpen: boolean
  onClose: () => void
  canEdit?: boolean
  lanes?: { id: string; name: string; color: string | null }[]
  currentUser?: { name: string | null; avatarUrl: string | null } | null
  onEdit?: () => void
  /** Called after mutations to refresh parent data (router.refresh) */
  onTaskUpdated?: () => void
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  canEdit = true,
  lanes = [],
  currentUser = null,
  onEdit,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [data, setData] = useState<TaskDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("activity")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!task || !isOpen) return
    let isMounted = true

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

    return () => {
      isMounted = false
    }
  }, [isOpen, task])

  const handleUpdateTask = (fields: Record<string, unknown>) => {
    if (!task || !canEdit) return
    setSaveStatus("saving")
    startTransition(async () => {
      try {
        const result = await updateTask({ id: task.id, ...fields })
        if (result.success) {
          setSaveStatus("saved")
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
          saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000)
          onTaskUpdated?.()
        } else {
          setSaveStatus("idle")
          toast.error(result.error || "Erreur lors de la mise à jour")
        }
      } catch (error) {
        setSaveStatus("idle")
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

  const handleComplete = () => {
    if (!task) return
    startTransition(async () => {
      try {
        await completeTask(task.id)
        toast.success(task.complete ? "Tâche rouverte" : "Tâche complétée")
        onTaskUpdated?.()
        onClose()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur")
      }
    })
  }

  const handleDelete = () => {
    if (!task || !canEdit) return
    startTransition(async () => {
      try {
        const result = await deleteTask(task.id)
        if (result.success) {
          toast.success("Tâche supprimée")
          onTaskUpdated?.()
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

  const toggleTag = (tagId: string) => {
    const currentTags = data?.taskTagIds || []
    const isNowSelected = currentTags.includes(tagId)
    const newTags = isNowSelected
      ? currentTags.filter((id: string) => id !== tagId)
      : [...currentTags, tagId]

    if (data) {
      setData({ ...data, taskTagIds: newTags })
    }
    handleUpdateTask({ tagIds: newTags })
  }

  if (!task) return null

  const dueDateInfo = dueDate ? formatRelativeDueDate(dueDate) : null

  const unitTags = data?.unitTags ?? []
  const currentTagIds = data?.taskTagIds ?? []

  const currentTags = data
    ? unitTags.filter((t) => currentTagIds.includes(t.id))
    : task.tagNames.map((name, i) => ({
        id: `tag-${i}`,
        name,
        color: task.tagColors[i] ?? "#888",
      }))

  return (
    <DetailModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Détails de la tâche"
      icon={<ListTodo className="size-5" />}
      badge={
        <Badge
          variant={task.complete ? "secondary" : "default"}
          className="flex items-center gap-1.5 px-3 py-1 text-xs"
        >
          <span
            className={cn(
              "size-2 rounded-full",
              task.complete ? "bg-emerald-500" : "bg-primary"
            )}
          />
          {task.complete ? "Terminé" : task.laneName || "En cours"}
        </Badge>
      }
      headerActions={
        <div className="flex items-center gap-1">
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose()
                onEdit()
              }}
              className="h-8 w-8 p-0"
            >
              <Pencil className="size-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              disabled={isPending}
              className="h-8 w-8 p-0"
            >
              <CheckCircle2 className="size-4" />
            </Button>
          )}
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
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
      }
      size="2xl"
    >
      {/* Editable title with save indicator */}
      <div className="relative mb-2">
        {canEdit ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== task.title && handleUpdateTask({ title })}
            className="h-auto border-none bg-transparent p-0 pr-8 text-2xl font-bold shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
            placeholder="Titre de la tâche"
          />
        ) : (
          <h2 className="text-2xl font-bold">{task.title}</h2>
        )}
        {saveStatus !== "idle" && (
          <span className="absolute top-1/2 right-0 -translate-y-1/2">
            {saveStatus === "saving" ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Check className="size-4 text-emerald-500 animate-in fade-in" />
            )}
          </span>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{task.projectName}</span>
        {task.phaseName && (
          <>
            <ChevronRight className="size-3" />
            <span>{task.phaseName}</span>
          </>
        )}
        {task.subPhaseName && (
          <>
            <ChevronRight className="size-3" />
            <span>{task.subPhaseName}</span>
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-8">
          {/* Description section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              <AlignLeft className="size-3.5" /> Description
            </div>
            {canEdit ? (
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
            ) : (
              <p className="rounded-xl border border-border bg-muted/10 p-4 text-sm leading-relaxed text-foreground/90">
                {task.description || "Pas de description"}
              </p>
            )}
          </div>

          {/* Tabs: Activity and Time */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
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
                currentUser={currentUser}
                newComment={newComment}
                isPending={isPending}
                onCommentChange={setNewComment}
                onAddComment={handleAddComment}
                mentionableUsers={data?.teamMembers?.map((tm) => ({
                  id: tm.user.id,
                  name: tm.user.name ?? "",
                  avatarUrl: tm.user.avatarUrl,
                }))}
              />
            </TabsContent>

            <TabsContent value="time">
              <TaskTimeEntries
                taskId={task.id}
                timeEntries={data?.timeEntries}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column — Metadata sidebar */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="flex flex-col gap-5 rounded-xl border bg-muted/5 p-5">
            {/* Assigné à */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <User className="size-3.5" /> Assigné à
              </label>
              <Select
                value={task.assignedUserId ?? "unassigned"}
                onValueChange={(val) =>
                  handleUpdateTask({
                    assignedUserId: val === "unassigned" ? null : val,
                  })
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="h-11 w-full border-border bg-muted/20 transition-colors hover:bg-muted/30">
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Non assigné</SelectItem>
                  {data?.teamMembers?.map((tm) => (
                    <SelectItem key={tm.user.id} value={tm.user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarImage src={tm.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {tm.user.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{tm.user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date début */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <CalendarDays className="size-3.5" /> Date début
              </label>
              <span className="text-sm text-muted-foreground">
                {task.startDate
                  ? format(new Date(task.startDate), "d MMMM yyyy", {
                      locale: fr,
                    })
                  : "Non définie"}
              </span>
            </div>

            {/* Échéance */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <CalendarClock className="size-3.5" /> Échéance
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    className={cn(
                      "h-11 w-full justify-start border-border bg-muted/20 text-left font-normal transition-colors hover:bg-muted/30",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
                    <span
                      className={cn(
                        dueDateInfo?.variant === "overdue" &&
                          "font-medium text-destructive",
                        dueDateInfo?.variant === "today" &&
                          "font-medium text-emerald-600"
                      )}
                    >
                      {dueDateInfo?.text || "Définir une date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      setDueDate(date ?? null)
                      handleUpdateTask({ dueDate: date ?? null })
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Colonne */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <Columns3 className="size-3.5" /> Colonne
              </label>
              <Select
                value={task.laneId ?? ""}
                onValueChange={(val) =>
                  handleUpdateTask({ laneId: val || null })
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="h-11 w-full border-border bg-muted/20 transition-colors hover:bg-muted/30">
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  {lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: lane.color ?? "#71717a",
                          }}
                        />
                        <span>{lane.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <Tag className="size-3.5" /> Tags
              </label>
              <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 p-2">
                {currentTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{
                      backgroundColor: tag.color + "15",
                      color: tag.color,
                      borderColor: tag.color + "30",
                    }}
                    variant="outline"
                    className="group flex h-7 items-center gap-1.5 border px-2 py-1 transition-all hover:brightness-95"
                  >
                    {tag.name}
                    {canEdit && (
                      <button
                        className="ml-0.5 rounded-full transition-colors hover:bg-black/10"
                        onClick={() => toggleTag(tag.id)}
                      >
                        <Plus className="size-3 rotate-45" />
                      </button>
                    )}
                  </Badge>
                ))}
                {canEdit && unitTags.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-[10px] font-bold tracking-tight uppercase hover:bg-muted/30"
                      >
                        <Plus className="size-3" /> Ajouter
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="flex flex-col gap-1">
                        {unitTags.map((tag) => {
                          const isSelected = currentTagIds.includes(tag.id)
                          return (
                            <Button
                              key={tag.id}
                              variant="ghost"
                              size="sm"
                              className="h-9 w-full justify-start font-normal"
                              onClick={() => toggleTag(tag.id)}
                            >
                              <div className="flex flex-1 items-center gap-2">
                                <div
                                  className="size-3 rounded-full shadow-sm"
                                  style={{
                                    backgroundColor: tag.color,
                                  }}
                                />
                                <span className="text-sm">{tag.name}</span>
                              </div>
                              {isSelected && (
                                <Check className="ml-auto size-4 text-primary" />
                              )}
                            </Button>
                          )
                        })}
                        {unitTags.length === 0 && (
                          <p className="p-4 text-center text-xs text-muted-foreground">
                            Aucun tag disponible
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Projet (read-only) */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <FolderKanban className="size-3.5" /> Projet
              </label>
              <span className="text-sm font-medium text-foreground">
                {task.projectName}
              </span>
            </div>

            {/* Phase (read-only) */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <Layers className="size-3.5" /> Phase
              </label>
              <span className="text-sm text-muted-foreground">
                {task.phaseName || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DetailModal>
  )
}

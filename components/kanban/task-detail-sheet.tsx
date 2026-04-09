"use client"

import { useState, useEffect, useTransition } from "react"
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import {
  Loader2,
  AlignLeft,
  Send,
  User as UserIcon,
  Calendar as CalendarIcon,
  Tag as TagIcon,
  Check,
  ChevronRight,
  Plus,
} from "lucide-react"

import { getTaskDetailsData } from "@/actions/task-details"
import { createComment } from "@/actions/comment"
import { completeTask, updateTask } from "@/actions/task"
import { cn } from "@/lib/utils"

interface TaskDetailSheetProps {
  task: {
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
    [key: string]: unknown
  } | null
  isOpen: boolean
  onClose: () => void
  canEdit?: boolean
}

export function TaskDetailSheet({
  task,
  isOpen,
  onClose,
  canEdit = true,
}: TaskDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("details")

  interface TeamMember {
    user: {
      id: string
      name: string | null
      avatarUrl: string | null
    }
  }

  interface TaskComment {
    id: string
    body: string
    createdAt: Date
    Author: {
      name: string | null
      avatarUrl: string | null
    }
  }

  interface TimeEntry {
    id: string
    duration: number
    description: string | null
    startTime: Date
    user: {
      name: string | null
      avatarUrl: string | null
    }
  }

  interface TaskTag {
    id: string
    name: string
    color: string
  }

  interface TaskDetailData {
    teamMembers: TeamMember[]
    comments: TaskComment[]
    timeEntries: TimeEntry[]
    unitTags: TaskTag[]
    taskTagIds: string[]
  }

  const [data, setData] = useState<TaskDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Local state for editing fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [newComment, setNewComment] = useState("")

  // Normalize task data for display
  const _laneName = task?.laneName ?? task?.laneId ?? null
  const _assignedUserId = task?.assignedUserId ?? task?.assignedUserName ?? null
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

  if (!task) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 space-y-4 border-b p-6">
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
        </SheetHeader>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Assignee Picker */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <UserIcon className="h-3.5 w-3.5" /> Assigné à
              </label>
              <Select
                value={
                  task.assignedUserId ?? task.assignedUserName ?? "unassigned"
                }
                onValueChange={(val) =>
                  handleUpdateTask({
                    assignedUserId: val === "unassigned" ? null : val,
                  })
                }
              >
                <SelectTrigger className="h-11 w-full border-border bg-muted/20 transition-colors hover:bg-muted/30">
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Non assigné</SelectItem>
                  {data?.teamMembers?.map((tm) => (
                    <SelectItem key={tm.user.id} value={tm.user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={tm.user.avatarUrl || undefined} />
                          <AvatarFallback>{tm.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{tm.user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <CalendarIcon className="h-3.5 w-3.5" /> Échéance
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start border-border bg-muted/20 text-left font-normal transition-colors hover:bg-muted/30",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {dueDate
                      ? format(new Date(dueDate), "d MMMM yyyy", { locale: fr })
                      : "Définir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      handleUpdateTask({ dueDate: date ?? null })
                      setDueDate(date ?? null)
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tags section */}
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <TagIcon className="h-3.5 w-3.5" /> Tags
              </label>
              <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 p-2">
                {task.Tags?.map((tag) => (
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
                    <button
                      className="ml-0.5 rounded-full transition-colors hover:bg-black/10"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Plus className="h-3 w-3 rotate-45" />
                    </button>
                  </Badge>
                ))}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[10px] font-bold tracking-tight uppercase hover:bg-muted/30"
                    >
                      <Plus className="h-3 w-3" /> Ajouter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      {data?.unitTags?.map((tag) => {
                        const isSelected = data.taskTagIds.includes(tag.id)
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
                                className="h-3 w-3 rounded-full shadow-sm"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="text-sm">{tag.name}</span>
                            </div>
                            {isSelected && (
                              <Check className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </Button>
                        )
                      })}
                      {(!data?.unitTags || data.unitTags.length === 0) && (
                        <p className="p-4 text-center text-xs text-muted-foreground">
                          Aucun tag trouvé
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

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

            <TabsContent value="activity" className="mt-0 space-y-8 pb-10">
              <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9 shrink-0 border shadow-sm">
                  <AvatarFallback className="bg-muted font-bold text-muted-foreground">
                    M
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="relative">
                    <Textarea
                      placeholder="Écrivez un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] rounded-xl border-border bg-muted/5 p-4 pr-12 pb-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault()
                          handleAddComment()
                        }
                      }}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <span className="hidden text-[10px] text-muted-foreground sm:inline">
                        Ctrl + Enter pour envoyer
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isPending}
                        className="h-8 w-8 rounded-full p-0"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 opacity-50 grayscale">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="animate-pulse text-xs font-medium">
                      Chargement de l&apos;activité...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {data?.comments?.map((comment) => (
                      <div key={comment.id} className="group flex gap-4">
                        <Avatar className="h-9 w-9 shrink-0 border border-border shadow-sm">
                          <AvatarImage
                            src={comment.Author.avatarUrl || undefined}
                          />
                          <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary">
                            {comment.Author.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {comment.Author.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              •
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {format(
                                new Date(comment.createdAt),
                                "d MMM, HH:mm",
                                { locale: fr }
                              )}
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-tl-none border border-border/60 bg-muted/10 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                            {comment.body}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {data?.comments?.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed py-16 opacity-40">
                    <Send className="h-8 w-8" />
                    <p className="max-w-[200px] text-center text-xs font-medium tracking-widest uppercase">
                      Soyez le premier à laisser un commentaire
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="time" className="mt-0 space-y-4 pb-10">
              {data?.timeEntries?.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-muted/10 p-5 transition-all duration-300 hover:bg-muted/20"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={entry.user.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs font-bold">
                        {entry.user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {entry.user.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(entry.startTime), "d MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {entry.duration
                          ? (entry.duration / 60).toFixed(1) + "h"
                          : "0.0h"}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="max-w-[140px] truncate text-[10px] text-muted-foreground/80 italic">
                        &quot;{entry.description}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {data?.timeEntries?.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed py-20 opacity-40">
                  <CalendarIcon className="h-8 w-8" />
                  <p className="max-w-[200px] text-center text-xs font-medium tracking-widest uppercase">
                    Ce projet n&apos;a pas encore d&apos;activité répertoriée.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

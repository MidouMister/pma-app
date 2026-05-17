"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"

import { KanbanCard } from "@/components/kibo-ui/kanban"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { cn } from "@/lib/utils"
import { formatRelativeDueDate } from "@/lib/format"

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string | null
    complete: boolean
    dueDate: Date | null
    startDate: Date | null
    assignedUserName: string | null
    assignedUserAvatar: string | null
    tagNames: string[]
    tagColors: string[]
    projectName: string
    column: string
    commentCount?: number
  }
  canEdit: boolean
  onComplete: (taskId: string) => void
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TaskCard({
  task,
  canEdit,
  onComplete,
  onClick,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const dueDate = task.dueDate
  const startDate = task.startDate
  const dueInfo = dueDate ? formatRelativeDueDate(dueDate) : null
  const commentCount = task.commentCount ?? 0

  const getDateDisplay = () => {
    if (startDate && dueDate) {
      const start = format(startDate, "d MMM", { locale: fr })
      const end = format(dueDate, "d MMM", { locale: fr })
      return `${start} → ${end}`
    }
    if (dueInfo) {
      return dueInfo.text
    }
    return null
  }

  const dateDisplay = getDateDisplay()
  const isOverdue = dueInfo?.variant === "overdue"

  return (
    <KanbanCard
      id={task.id}
      name={task.title}
      column={task.column}
      onClick={() => {
        if (!task.complete || canEdit) {
          onClick()
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        task.complete && "opacity-50"
      )}
    >
      <div className="flex flex-col gap-3 p-3">
        {/* Tags row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tagNames.length > 0
              ? task.tagNames.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: (task.tagColors[i] ?? "#6b7280") + "20",
                      color: task.tagColors[i] ?? "#6b7280",
                    }}
                  >
                    {tag}
                  </span>
                ))
              : !task.complete && (
                  <span className="text-[11px] text-muted-foreground">
                    Aucun tag
                  </span>
                )}
          </div>

          {/* Mobile kebab menu - always visible on touch */}
          {(onEdit || onDelete) && (
            <div className="shrink-0 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Options de la tâche"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Title */}
        <h4
          className={cn(
            "text-base leading-snug font-semibold",
            task.complete && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        {/* Assignee row */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Assigné :</span>
          <Avatar className="size-6">
            <AvatarImage src={task.assignedUserAvatar ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {task.assignedUserName?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Date + Comments row */}
        {(dateDisplay || commentCount > 0) && (
          <div className="flex items-center justify-between">
            {dateDisplay && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue && !task.complete
                    ? "font-medium text-destructive"
                    : dueInfo?.variant === "today"
                      ? "font-medium text-emerald-600"
                      : "text-muted-foreground"
                )}
              >
                <CalendarDays className="size-3" />
                <span>{dateDisplay}</span>
              </div>
            )}
            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="size-3" />
                <span>
                  {commentCount} Commentaire{commentCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover quick actions - desktop */}
      <div
        className="absolute top-2 right-2 hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex"
        data-no-dnd="true"
      >
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onComplete(task.id)
            }}
            aria-label={
              task.complete ? "Réouvrir la tâche" : "Marquer comme terminée"
            }
          >
            {task.complete ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            aria-label="Modifier la tâche"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Supprimer la tâche"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </KanbanCard>
  )
}

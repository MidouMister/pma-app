"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { KanbanCard } from "@/components/kibo-ui/kanban"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  }
  laneColor: string
  canEdit: boolean
  onComplete: (taskId: string) => void
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TaskCard({
  task,
  laneColor,
  canEdit,
  onComplete,
  onClick,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const dueDate = task.dueDate
  const startDate = task.startDate
  const dueInfo = dueDate ? formatRelativeDueDate(dueDate) : null

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
      className="group relative cursor-pointer border-l-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5"
      style={{ borderLeftColor: laneColor }}
    >
      <div className={cn("flex flex-col gap-2", task.complete && "opacity-60")}>
        {/* Checkbox + Title row */}
        <div className="flex items-start gap-2">
          {canEdit && (
            <Checkbox
              checked={task.complete}
              onCheckedChange={() => onComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
              aria-label={
                task.complete
                  ? "Marquer comme non terminée"
                  : "Marquer comme terminée"
              }
            />
          )}
          <p
            className={cn(
              "text-sm leading-snug font-medium",
              !canEdit && "ml-6",
              task.complete && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        {/* Tag badges */}
        {task.tagNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tagNames.map((tag: string, i: number) => {
              const color = task.tagColors[i] ?? "#6b7280"
              return (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px]"
                  style={{
                    backgroundColor: color + "20",
                    color,
                  }}
                >
                  {tag}
                </Badge>
              )
            })}
          </div>
        )}

        {/* Footer: assignee + date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar className="size-6">
              <AvatarImage src={task.assignedUserAvatar ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {task.assignedUserName?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[100px] truncate text-xs text-muted-foreground">
              {task.assignedUserName ?? "Non assigné"}
            </span>
          </div>

          {dateDisplay && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue && !task.complete
                  ? "font-medium text-destructive"
                  : dueInfo?.variant === "today"
                    ? "font-medium text-emerald-500"
                    : "text-muted-foreground"
              )}
            >
              <span>{dateDisplay}</span>
              {isOverdue && !task.complete && (
                <AlertTriangle className="size-3 text-destructive" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover quick actions - desktop */}
      <div
        className="absolute top-2 right-2 hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex"
        data-no-dnd="true"
      >
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

      {/* Mobile kebab menu - always visible on touch */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 md:hidden">
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
    </KanbanCard>
  )
}

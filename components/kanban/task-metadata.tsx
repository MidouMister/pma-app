"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Plus,
  User as UserIcon,
  Calendar as CalendarIcon,
  Tag as TagIcon,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

import { type KanbanTeamMember, type TaskTag } from "@/lib/types"

interface TaskMetadataProps {
  assignedUserId: string | null | undefined
  assignedUserName: string | null | undefined
  dueDate: Date | null
  tags: { id: string; name: string; color: string }[]
  teamMembers: KanbanTeamMember[] | undefined
  unitTags: TaskTag[] | undefined
  taskTagIds: string[]
  onUpdate: (fields: Record<string, unknown>) => void
  onToggleTag: (tagId: string) => void
  onDueDateChange: (date: Date | null) => void
}

export function TaskMetadata({
  assignedUserId,
  assignedUserName,
  dueDate,
  tags,
  teamMembers,
  unitTags,
  taskTagIds,
  onUpdate,
  onToggleTag,
  onDueDateChange,
}: TaskMetadataProps) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Assignee Picker */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          <UserIcon className="h-3.5 w-3.5" /> Assigné à
        </label>
        <Select
          value={assignedUserId ?? assignedUserName ?? "unassigned"}
          onValueChange={(val) =>
            onUpdate({
              assignedUserId: val === "unassigned" ? null : val,
            })
          }
        >
          <SelectTrigger className="h-11 w-full border-border bg-muted/20 transition-colors hover:bg-muted/30">
            <SelectValue placeholder="Non assigné" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Non assigné</SelectItem>
            {teamMembers?.map((tm) => (
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
                onUpdate({ dueDate: date ?? null })
                onDueDateChange(date ?? null)
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
          {tags.map((tag) => (
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
                onClick={() => onToggleTag(tag.id)}
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
                {unitTags?.map((tag) => {
                  const isSelected = taskTagIds.includes(tag.id)
                  return (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-full justify-start font-normal"
                      onClick={() => onToggleTag(tag.id)}
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
                {(!unitTags || unitTags.length === 0) && (
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
  )
}

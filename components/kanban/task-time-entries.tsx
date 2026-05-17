"use client"

import { useEffect, useState, type FC } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { getTaskTimeEntries } from "@/actions/time-entry"
import { formatDuration } from "@/lib/format"
import { type KanbanTimeEntry } from "@/lib/types"

interface TimeEntryItem {
  id: string
  duration: number | null
  description: string | null
  startTime: string | Date
  endTime?: string | Date | null
  user: {
    name: string | null
    avatarUrl: string | null
  }
}

interface TaskTimeEntriesProps {
  taskId?: string
  timeEntries?: KanbanTimeEntry[] | undefined
  onAddEntry?: () => void
}

export const TaskTimeEntries: FC<TaskTimeEntriesProps> = ({
  taskId,
  timeEntries: propEntries,
  onAddEntry,
}) => {
  const [fetchedEntries, setFetchedEntries] = useState<TimeEntryItem[] | null>(
    null
  )

  useEffect(() => {
    if (!taskId) return
    let cancelled = false

    getTaskTimeEntries(taskId).then((result) => {
      if (cancelled) return
      if (result.success) {
        setFetchedEntries(result.entries as TimeEntryItem[])
      }
    })

    return () => {
      cancelled = true
    }
  }, [taskId])

  const entries: TimeEntryItem[] | undefined | null =
    taskId && fetchedEntries !== null
      ? fetchedEntries
      : taskId
        ? undefined
        : (propEntries as TimeEntryItem[] | undefined)

  const isLoading = !!taskId && fetchedEntries === null && !propEntries

  const totalDuration =
    entries?.reduce((sum, e) => sum + (e.duration ?? 0), 0) ?? 0

  return (
    <div className="mt-0 space-y-4 pb-10">
      {(entries && entries.length > 0) || isLoading ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              Temps total : {formatDuration(totalDuration)}
            </span>
            {onAddEntry && (
              <Button variant="outline" size="sm" onClick={onAddEntry}>
                <Plus className="mr-1 size-3.5" />
                Saisir du temps
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : (
            entries?.map((entry) => (
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
                      {entry.endTime && (
                        <>
                          <span className="text-[10px] text-muted-foreground/60">
                            ·
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(entry.startTime), "HH:mm", {
                              locale: fr,
                            })}
                            {" → "}
                            {format(new Date(entry.endTime), "HH:mm", {
                              locale: fr,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <div className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1">
                    <Clock className="size-3 text-primary" />
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {formatDuration(entry.duration ?? 0)}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="max-w-[140px] truncate text-[10px] text-muted-foreground/80 italic">
                      &quot;{entry.description}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed py-20 opacity-40">
          <CalendarIcon className="h-8 w-8" />
          <p className="max-w-[200px] text-center text-xs font-medium tracking-widest uppercase">
            Ce projet n&apos;a pas encore d&apos;activité répertoriée.
          </p>
        </div>
      )}
    </div>
  )
}

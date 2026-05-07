"use client"

import { type FC } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { type TimeEntry } from "./types"

interface TaskTimeEntriesProps {
  timeEntries: TimeEntry[] | undefined
}

export const TaskTimeEntries: FC<TaskTimeEntriesProps> = ({ timeEntries }) => {
  return (
    <div className="mt-0 space-y-4 pb-10">
      {timeEntries?.map((entry) => (
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
      {timeEntries?.length === 0 && (
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

"use client"

import { useEffect, useState } from "react"
import { Clock, Edit, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { EmptyState } from "@/components/shared/empty-state"

import { deleteTimeEntry, getProjectTimeEntries } from "@/actions/time-entry"

import { formatDate, formatDuration } from "@/lib/format"

import { TimeEntryForm } from "./time-entry-form"
import { TimerWidget } from "./timer-widget"

interface TimeEntryData {
  id: string
  description: string | null
  startTime: Date
  endTime: Date | null
  duration: number | null
  userId: string
  projectId: string
  taskId: string | null
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

interface UserTotalData {
  userId: string
  userName: string
  duration: number
}

interface TimeTrackingTabProps {
  projectId: string
  projectName: string
  canEdit: boolean
  userId: string
  teamMembers: Array<{
    id: string
    name: string | null
    avatarUrl: string | null
  }>
}

export function TimeTrackingTab({
  projectId,
  projectName,
  canEdit,
  userId: _userId,
  teamMembers,
}: TimeTrackingTabProps) {
  const [entries, setEntries] = useState<TimeEntryData[]>([])
  const [userTotals, setUserTotals] = useState<UserTotalData[]>([])
  const [totalDuration, setTotalDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntryData | null>(null)
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)

  function loadEntries() {
    getProjectTimeEntries(projectId).then((result) => {
      if (result.success) {
        setEntries(result.entries as TimeEntryData[])
        setTotalDuration(result.totalDuration ?? 0)
        setUserTotals(result.userTotals ?? [])
      }
    })
  }

  useEffect(() => {
    loadEntries()
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleEdit = (entry: TimeEntryData) => {
    setEditingEntry(entry)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteEntryId) return
    const result = await deleteTimeEntry(deleteEntryId)
    if (result.success) {
      toast.success("Entrée de temps supprimée")
      setDeleteEntryId(null)
      loadEntries()
    } else {
      toast.error(result.error ?? "Erreur")
    }
  }

  const projects = [{ id: projectId, name: projectName }]

  const editingFormEntry = editingEntry
    ? {
        id: editingEntry.id,
        projectId: editingEntry.projectId,
        taskId: editingEntry.taskId,
        description: editingEntry.description,
        startTime: editingEntry.startTime,
        endTime: editingEntry.endTime,
      }
    : undefined

  const groupedByUser = userTotals.map((ut) => ({
    ...ut,
    entries: entries.filter((e) => e.userId === ut.userId),
  }))

  const teamMemberMap = new Map(teamMembers.map((m) => [m.id, m]))
  for (const e of entries) {
    if (!teamMemberMap.has(e.userId)) {
      teamMemberMap.set(e.userId, {
        id: e.userId,
        name: e.user.name,
        avatarUrl: e.user.avatarUrl,
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TimerWidget
            projectId={projectId}
            projects={projects}
            onTimerComplete={loadEntries}
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              Entrées de temps
            </h3>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingEntry(null)
                  setFormOpen(true)
                }}
                size="sm"
              >
                <Plus className="mr-1.5 size-4" />
                Ajouter manuellement
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title="Aucune entrée de temps"
              description="Commencez par utiliser le chronomètre ou ajoutez une entrée manuellement."
              icon={<Clock className="size-6" />}
              action={
                canEdit
                  ? {
                      label: "Ajouter une entrée",
                      onClick: () => {
                        setEditingEntry(null)
                        setFormOpen(true)
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {groupedByUser.map((group) => {
                const member = teamMemberMap.get(group.userId)
                return (
                  <div key={group.userId} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarImage src={member?.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(member?.name?.[0] ?? "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {member?.name ?? "Utilisateur"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDuration(group.duration)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {group.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/20"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <p className="truncate text-sm">
                              {entry.description || (
                                <span className="text-muted-foreground italic">
                                  Aucune description
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>
                                {formatDate(new Date(entry.startTime))}
                              </span>
                              <span className="text-border">·</span>
                              <span className="tabular-nums">
                                {new Date(entry.startTime).toLocaleTimeString(
                                  "fr-FR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}{" "}
                                →{" "}
                                {entry.endTime
                                  ? new Date(entry.endTime).toLocaleTimeString(
                                      "fr-FR",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary tabular-nums">
                              {formatDuration(entry.duration ?? 0)}
                            </span>

                            {canEdit && (
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleEdit(entry)}
                                >
                                  <Edit className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteEntryId(entry.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <TimeEntryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingEntry(null)
          }
        }}
        projects={projects}
        projectId={projectId}
        entry={editingFormEntry}
        onSuccess={loadEntries}
      />

      <AlertDialog
        open={!!deleteEntryId}
        onOpenChange={(open) => {
          if (!open) setDeleteEntryId(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-4 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer l&apos;entrée</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer
              cette entrée de temps ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

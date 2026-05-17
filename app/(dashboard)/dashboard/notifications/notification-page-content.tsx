"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Bell,
  UserPlus,
  FolderKanban,
  ClipboardList,
  Briefcase,
  GitBranch,
  Users,
  Columns3,
  Tag,
  Factory,
  CheckCheck,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/actions/notification"

import type { Notification } from "@prisma/client"

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  INVITATION: UserPlus,
  PROJECT: FolderKanban,
  TASK: ClipboardList,
  CLIENT: Briefcase,
  PHASE: GitBranch,
  TEAM: Users,
  LANE: Columns3,
  TAG: Tag,
  PRODUCTION: Factory,
  GENERAL: Bell,
}

const FILTER_TABS = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "INVITATION", label: "Invitations" },
  { value: "PROJECT", label: "Projets" },
  { value: "TASK", label: "Tâches" },
  { value: "CLIENT", label: "Clients" },
  { value: "PHASE", label: "Phases" },
  { value: "TEAM", label: "Équipe" },
  { value: "LANE", label: "Colonnes" },
  { value: "TAG", label: "Étiquettes" },
  { value: "PRODUCTION", label: "Production" },
  { value: "GENERAL", label: "Général" },
] as const

const TAKE = 20

interface NotificationPageContentProps {
  userId: string
}

export function NotificationPageContent({
  userId,
}: NotificationPageContentProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState("all")
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const fetchNotifications = useCallback(
    async (currentFilter: string, currentSkip: number) => {
      setIsLoading(true)
      try {
        const type =
          currentFilter !== "all" && currentFilter !== "unread"
            ? (currentFilter as Notification["type"])
            : undefined
        const read = currentFilter === "unread" ? false : undefined

        const result = await getNotifications(userId, {
          type,
          read,
          take: TAKE + 1,
          skip: currentSkip,
        })

        const items = result.slice(0, TAKE)
        setHasMore(result.length > TAKE)

        if (currentSkip === 0) {
          setNotifications(items)
        } else {
          setNotifications((prev) => [...prev, ...items])
        }
      } catch {
        toast.error("Erreur lors du chargement des notifications")
      } finally {
        setIsLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    setSkip(0)
    setNotifications([])
    setHasMore(true)
    fetchNotifications(filter, 0)
  }, [filter, fetchNotifications])

  function handleLoadMore() {
    const nextSkip = skip + TAKE
    setSkip(nextSkip)
    fetchNotifications(filter, nextSkip)
  }

  async function handleMarkAsRead(notificationId: string) {
    const prev = notifications
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )

    const result = await markAsRead(notificationId, userId)
    if (!result.success) {
      setNotifications(prev)
      toast.error(result.error ?? "Une erreur est survenue")
    }
  }

  async function handleMarkAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)

    if (unreadIds.length === 0) {
      toast.info("Aucune notification non lue")
      return
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    const result = await markAllAsRead(userId)
    if (result.success) {
      toast.success(
        `${result.count} notification${result.count > 1 ? "s" : ""} marquée${result.count > 1 ? "s" : ""} comme lue${result.count > 1 ? "s" : ""}`
      )
    } else {
      toast.error(result.error ?? "Une erreur est survenue")
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read
    if (filter === "all") return true
    return n.type === filter
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList variant="line" className="w-fit">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="whitespace-nowrap"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={filter} className="mt-0">
          {/* Mark all as read button */}
          {notifications.some((n) => !n.read) && (
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => startTransition(() => handleMarkAllAsRead())}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                Tout marquer comme lu
              </Button>
            </div>
          )}

          {/* Notifications list */}
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-start gap-3 rounded-lg border p-4"
                >
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                  <div className="mt-1 size-4 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              title="Aucune notification"
              description="Vous n'avez aucune notification pour le moment."
              icon={<Bell className="size-6" />}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredNotifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                      !notification.read &&
                        "border-l-2 border-l-primary bg-muted/20"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        !notification.read
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notification.read && "font-medium"
                        )}
                      >
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(notification.createdAt),
                          "d MMMM yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </span>
                    </div>

                    {/* Read indicator */}
                    <div className="mt-1 shrink-0">
                      {notification.read ? (
                        <Check className="size-4 text-muted-foreground/50" />
                      ) : (
                        <span className="block size-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                    Voir plus
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

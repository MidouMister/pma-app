"use client"

import { type FC, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { NotificationList } from "./notification-list"
import { useNotifications } from "@/hooks/use-notifications"
import {
  getLatestUnread,
  markAllAsRead,
  markAsRead,
} from "@/actions/notification"
interface NotificationBellProps {
  userId: string
}

export const NotificationBell: FC<NotificationBellProps> = ({ userId }) => {
  const { unreadCount } = useNotifications(userId)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      type: string
      message: string
      createdAt: Date
      read: boolean
    }>
  >([])
  const [isFetching, setIsFetching] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setIsFetching(true)
    try {
      const data = await getLatestUnread(userId)
      setNotifications(
        data.map((n) => ({
          id: n.id,
          type: n.type,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read,
        }))
      )
    } catch {
      setNotifications([])
    } finally {
      setIsFetching(false)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  async function handleMarkAsRead(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await markAsRead(id, userId)
  }

  async function handleMarkAllAsRead() {
    setIsMarkingAll(true)
    try {
      await markAllAsRead(userId)
      setNotifications([])
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
        </div>
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <NotificationList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            showReadStatus
          />
        )}
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <Link
            href="/dashboard/notifications"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setIsOpen(false)}
          >
            Voir tout
          </Link>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isMarkingAll ? "..." : "Tout marquer comme lu"}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

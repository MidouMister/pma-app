"use client"

import { type FC } from "react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  UserPlus,
  FolderKanban,
  ClipboardList,
  Briefcase,
  GitBranch,
  Users,
  Columns3,
  Tag,
  Factory,
  Bell,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
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

interface NotificationItem {
  id: string
  type: string
  message: string
  createdAt: Date | string
  read: boolean
}

interface NotificationListProps {
  notifications: NotificationItem[]
  onMarkAsRead: (id: string) => void
  showReadStatus?: boolean
  maxItems?: number
}

export const NotificationList: FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  showReadStatus = true,
  maxItems,
}) => {
  const items = maxItems ? notifications.slice(0, maxItems) : notifications

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <Bell className="size-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Aucune notification</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {items.map((notification) => {
        const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell
        return (
          <button
            key={notification.id}
            onClick={() => onMarkAsRead(notification.id)}
            className={cn(
              "flex items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
              !notification.read && "bg-muted/20"
            )}
          >
            <div className="mt-0.5 flex shrink-0">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                <Icon className="size-3.5 text-primary" />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="line-clamp-2 text-xs leading-relaxed text-foreground">
                {notification.message}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            {showReadStatus && !notification.read && (
              <div className="mt-1.5 flex shrink-0">
                <div className="size-2 rounded-full bg-blue-500" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

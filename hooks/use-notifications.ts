"use client"

import * as React from "react"
import { toast } from "sonner"
import { getUnreadCount } from "@/actions/notification"

interface UseNotificationsReturn {
  unreadCount: number
  isLoading: boolean
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)

  const fetchCount = React.useCallback(async () => {
    try {
      const count = await getUnreadCount(userId)
      setUnreadCount(count)
    } catch (error) {
      console.error("Notification poll failed:", error)
      toast.error("Impossible de récupérer les notifications")
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return { unreadCount, isLoading }
}

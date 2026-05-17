"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  startTimer as startTimerAction,
  stopTimer as stopTimerAction,
  getActiveTimer as getActiveTimerAction,
} from "@/actions/time-entry"

interface StartTimerInput {
  projectId: string
  taskId?: string | null
  description?: string | null
}

interface UseTimerReturn {
  isRunning: boolean
  elapsed: number
  formattedTime: string
  start: (data: StartTimerInput) => Promise<{
    success: boolean
    error?: string
    data?: { id: string }
  }>
  stop: () => Promise<{
    success: boolean
    error?: string
    data?: { duration: number }
  }>
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":")
}

export function useTimer(): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [activeTimeEntryId, setActiveTimeEntryId] = useState<string | null>(
    null
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(
    async (data: StartTimerInput) => {
      const result = await startTimerAction(data)
      if (!result.success) {
        return { success: false, error: result.error }
      }

      const timeEntryId = result.timeEntryId!
      setActiveTimeEntryId(timeEntryId)
      setElapsed(0)
      setIsRunning(true)
      clearTimer()
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)

      return { success: true, data: { id: timeEntryId } }
    },
    [clearTimer]
  )

  const stop = useCallback(async () => {
    if (!activeTimeEntryId) {
      return { success: false, error: "Aucun minuteur actif" }
    }

    const finalElapsed = elapsed
    clearTimer()
    setIsRunning(false)
    setActiveTimeEntryId(null)
    setElapsed(0)

    const result = await stopTimerAction(activeTimeEntryId)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: { duration: finalElapsed } }
  }, [activeTimeEntryId, elapsed, clearTimer])

  useEffect(() => {
    getActiveTimerAction().then((result) => {
      if (result.success && result.activeEntry) {
        setActiveTimeEntryId(result.activeEntry.id)
        setElapsed(result.activeEntry.elapsed)
        setIsRunning(true)
        intervalRef.current = setInterval(() => {
          setElapsed((prev) => prev + 1)
        }, 1000)
      }
    })
  }, [])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    isRunning,
    elapsed,
    formattedTime: formatElapsed(elapsed),
    start,
    stop,
  }
}

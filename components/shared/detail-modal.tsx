"use client"

import { type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const SIZE_MAP = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  "2xl": "sm:max-w-7xl",
} as const

interface DetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode
  headerActions?: ReactNode
  size?: keyof typeof SIZE_MAP
  className?: string
  children: ReactNode
}

export function DetailModal({
  open,
  onOpenChange,
  title,
  subtitle,
  icon,
  badge,
  headerActions,
  size = "lg",
  className,
  children,
}: DetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SIZE_MAP[size],
          "max-h-[90vh] overflow-y-auto p-0",
          "gap-0",
          className
        )}
      >
        {/* Header with gradient accent */}
        <DialogHeader className="relative px-6 pt-6 pb-4">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-linear-to-r from-primary/80 via-primary to-primary/80" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {icon && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {title}
                </DialogTitle>
                {subtitle && (
                  <span className="text-sm text-muted-foreground">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
            {(badge || headerActions) && (
              <div className="flex shrink-0 items-center gap-2">
                {badge}
                {headerActions}
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="px-6 py-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

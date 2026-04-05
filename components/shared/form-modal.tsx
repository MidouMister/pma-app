"use client"

import { type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const SIZE_MAP = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  "2xl": "sm:max-w-7xl",
} as const

interface FormModalProps {
  /** Controlled open state */
  open: boolean
  /** Called when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Optional description below the title */
  description?: string
  /** Optional trigger element (renders DialogTrigger) */
  trigger?: ReactNode
  /** Dialog width preset */
  size?: keyof typeof SIZE_MAP
  /** Whether the form is submitting */
  isPending?: boolean
  /** Form submit handler */
  onSubmit: (e: React.FormEvent) => void
  /** Optional reset callback when closing */
  onReset?: () => void
  /** Submit button label */
  submitLabel?: string
  /** Submit button label when pending */
  submitPendingLabel?: string
  /** Cancel button label */
  cancelLabel?: string
  /** Whether to show cancel button — default true */
  showCancel?: boolean
  /** Additional className for DialogContent */
  className?: string
  /** Optional icon for the header */
  icon?: ReactNode
  /** Form fields (children) */
  children: ReactNode
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  size = "md",
  isPending = false,
  onSubmit,
  onReset,
  submitLabel = "Enregistrer",
  submitPendingLabel = "Enregistrement...",
  cancelLabel = "Annuler",
  showCancel = true,
  className,
  icon,
  children,
}: FormModalProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && onReset) {
      onReset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
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
              {description && (
                <DialogDescription className="text-sm">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Form content */}
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="px-6 py-6">{children}</div>

          <Separator />

          {/* Footer */}
          <DialogFooter className="px-6 py-4">
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="min-w-[100px]"
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[140px] shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {isPending && <Spinner />}
              {isPending ? submitPendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

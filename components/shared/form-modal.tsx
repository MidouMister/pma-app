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
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="py-6">{children}</div>

          <DialogFooter>
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {cancelLabel}
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              {isPending ? submitPendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

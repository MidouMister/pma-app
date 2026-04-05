import { type ReactNode } from "react"

interface FormSectionProps {
  /** Section number (displayed as badge) */
  number: string
  /** Section title */
  title: string
  /** Form fields */
  children: ReactNode
  /** Optional subtitle/description */
  description?: string
  /** Optional icon */
  icon?: ReactNode
}

export function FormSection({
  number,
  title,
  description,
  icon,
  children,
}: FormSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
          {number}
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-px flex-1 bg-border/60" />
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

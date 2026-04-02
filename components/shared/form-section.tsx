import { type ReactNode } from "react"

interface FormSectionProps {
  /** Section number (displayed as badge) */
  number: string
  /** Section title */
  title: string
  /** Form fields */
  children: ReactNode
}

export function FormSection({ number, title, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-xs font-bold">{number}</span>
        </div>
        <h3 className="text-sm font-bold tracking-widest text-foreground/80 uppercase">
          {title}
        </h3>
        <div className="h-px flex-1 bg-border/60" />
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

import Link from "next/link"
import { FolderSearch } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon || <FolderSearch className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action &&
        (action.href ? (
          <Button asChild variant="default">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : action.onClick ? (
          <Button onClick={action.onClick} variant="default">
            {action.label}
          </Button>
        ) : null)}
    </div>
  )
}

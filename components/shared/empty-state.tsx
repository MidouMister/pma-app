import { FolderSearch } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-muted/20 border rounded-lg border-dashed">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground mb-4">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}

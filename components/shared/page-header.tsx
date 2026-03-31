import { SidebarTrigger } from "@/components/ui/sidebar"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode // For buttons or actions
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-4 py-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}

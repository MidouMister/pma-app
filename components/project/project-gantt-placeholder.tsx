import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProjectGanttPlaceholderProps {
  projectId: string
}

export function ProjectGanttPlaceholder({
  projectId: _projectId,
}: ProjectGanttPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramme de Gantt</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Module Gantt — à venir dans le jalon 7
        </p>
      </CardContent>
    </Card>
  )
}

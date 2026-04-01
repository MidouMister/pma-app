import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProjectTasksPlaceholderProps {
  projectId: string
}

export function ProjectTasksPlaceholder({
  projectId: _projectId,
}: ProjectTasksPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Module Tâches — à venir dans le jalon 8
        </p>
      </CardContent>
    </Card>
  )
}

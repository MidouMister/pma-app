import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProjectTimeTrackingPlaceholderProps {
  projectId: string
}

export function ProjectTimeTrackingPlaceholder({
  projectId: _projectId,
}: ProjectTimeTrackingPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suivi du temps</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Module Suivi du temps — à venir dans le jalon 9
        </p>
      </CardContent>
    </Card>
  )
}

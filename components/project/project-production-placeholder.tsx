import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProjectProductionPlaceholderProps {
  projectId: string
}

export function ProjectProductionPlaceholder({
  projectId: _projectId,
}: ProjectProductionPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Production</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Module Production — à venir dans le jalon 9
        </p>
      </CardContent>
    </Card>
  )
}

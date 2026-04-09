"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDelai, formatDate } from "@/lib/format"
import { STATUS_COLORS } from "@/lib/constants"
import { UserPlus, Building2, Calendar, CheckCircle2 } from "lucide-react"

interface SimpleProject {
  id: string
  name: string
  code: string
  type: string
  montantHT: number
  montantTTC: number
  ods: Date | null
  delaiMonths: number
  delaiDays: number
  status: string
  signe: boolean
  Client?: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    wilaya?: string | null
  } | null
  phases?: Array<{
    id: string
    name: string
    progress: number
    montantHT: number
  }>
  team?: {
    members?: Array<{
      id: string
      role: string
      user: {
        id: string
        name: string
        email: string
        avatarUrl?: string | null
      }
    }>
  }
}

interface ProjectOverviewProps {
  project: SimpleProject
  userRole: "OWNER" | "ADMIN" | "USER"
  onPhaseUpdate?: () => void
  onMemberUpdate?: () => void
}

const statusLabels: Record<string, string> = {
  New: "Nouveau",
  InProgress: "En cours",
  Pause: "En pause",
  Complete: "Terminé",
}

export function ProjectOverview({
  project,
  userRole,
  onPhaseUpdate: _onPhaseUpdate,
  onMemberUpdate,
}: ProjectOverviewProps) {
  const tvaAmount = project.montantTTC - project.montantHT
  const tvaPercent =
    project.montantHT > 0
      ? ((project.montantTTC - project.montantHT) / project.montantHT) * 100
      : 0

  const totalMontantHT = (project.phases ?? []).reduce(
    (sum, p) => sum + p.montantHT,
    0
  )
  const progress =
    totalMontantHT > 0
      ? Math.round(
          (project.phases ?? []).reduce(
            (sum, p) => sum + p.progress * p.montantHT,
            0
          ) / totalMontantHT
        )
      : 0

  const canEdit = userRole === "OWNER" || userRole === "ADMIN"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant HT</span>
            <span className="font-medium">
              {formatCurrency(project.montantHT)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant TTC</span>
            <span className="font-medium">
              {formatCurrency(project.montantTTC)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA</span>
            <span className="font-medium">
              {formatCurrency(tvaAmount)} ({tvaPercent.toFixed(1)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{progress}%</span>
            <Badge variant="outline">Global</Badge>
          </div>
          <Progress value={progress} className="h-3" />
          {(project.phases ?? []).length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground">Phases:</p>
              {(project.phases ?? []).map((phase) => (
                <div key={phase.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{phase.name}</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Équipe
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={onMemberUpdate}>
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(project.team?.members ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun membre dans l&apos;équipe
            </p>
          ) : (
            <div className="space-y-2">
              {(project.team?.members ?? []).map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {member.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{project.Client?.name ?? "Non défini"}</p>
          {project.Client?.phone && (
            <p className="text-sm text-muted-foreground">
              {project.Client.phone}
            </p>
          )}
          {project.Client?.email && (
            <p className="text-sm text-muted-foreground">
              {project.Client.email}
            </p>
          )}
          {project.Client?.wilaya && (
            <p className="text-sm text-muted-foreground">
              {project.Client.wilaya}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ODS</span>
            <span className="font-medium">
              {project.ods ? formatDate(project.ods) : "Non défini"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Délai</span>
            <span className="font-medium">
              {formatDelai(project.delaiMonths, project.delaiDays)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4" />
            Statut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge
            className={
              STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]
            }
          >
            {statusLabels[project.status] || project.status}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Signé</span>
            <span className="font-medium">{project.signe ? "Oui" : "Non"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

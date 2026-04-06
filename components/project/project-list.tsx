"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/format"
import { STATUS_COLORS } from "@/lib/constants"
import { archiveProject } from "@/actions/project"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  Search,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleProject {
  id: string
  name: string
  code: string
  status: string
  montantTTC: number
  ods: Date | null
  client?: {
    id: string
    name: string
  }
  phases?: Array<{
    montantHT: number
    progress: number
  }>
}

interface ProjectListProps {
  projects: SimpleProject[]
  unitId: string
  companyId: string
  userRole: "OWNER" | "ADMIN" | "USER"
}

const statusLabels: Record<string, string> = {
  New: "Nouveau",
  InProgress: "En cours",
  Pause: "En pause",
  Complete: "Terminé",
}

const statusDotColors: Record<string, string> = {
  New: "bg-blue-500",
  InProgress: "bg-emerald-500",
  Pause: "bg-amber-500",
  Complete: "bg-gray-500",
}

export function ProjectList({
  projects,
  unitId,
  companyId: _companyId,
  userRole,
}: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "montant">("date")
  const [archiveDialogId, setArchiveDialogId] = useState<string | null>(null)

  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>()
    projects.forEach((p) => {
      if (p.client) {
        clients.set(p.client.id, p.client.name)
      }
    })
    return Array.from(clients.entries()).map(([id, name]) => ({ id, name }))
  }, [projects])

  const filteredProjects = useMemo(() => {
    let result = [...projects]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.client?.name.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (clientFilter !== "all") {
      result = result.filter((p) => p.client?.id === clientFilter)
    }

    result.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.ods ? new Date(a.ods).getTime() : 0
        const dateB = b.ods ? new Date(b.ods).getTime() : 0
        return dateB - dateA
      } else {
        return b.montantTTC - a.montantTTC
      }
    })

    return result
  }, [projects, searchQuery, statusFilter, clientFilter, sortBy])

  const calculateProgress = (project: SimpleProject) => {
    const phases = project.phases ?? []
    const totalMontantHT = phases.reduce((sum, p) => sum + p.montantHT, 0)
    if (totalMontantHT === 0) return 0
    return Math.round(
      phases.reduce((sum, p) => sum + p.progress * p.montantHT, 0) /
        totalMontantHT
    )
  }

  const handleArchive = async (projectId: string) => {
    const result = await archiveProject(projectId)
    if (result.success) {
      toast.success("Projet archivé avec succès")
    } else {
      toast.error(result.error ?? "Erreur lors de l'archivage")
    }
    setArchiveDialogId(null)
  }

  const canEdit = userRole === "OWNER" || userRole === "ADMIN"

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, code ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="New">Nouveau</SelectItem>
            <SelectItem value="InProgress">En cours</SelectItem>
            <SelectItem value="Pause">En pause</SelectItem>
            <SelectItem value="Complete">Terminé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {uniqueClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "date" | "montant")}
        >
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date (ODS)</SelectItem>
            <SelectItem value="montant">Montant TTC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredProjects.length} projet
          {filteredProjects.length !== 1 ? "s" : ""}
          {filteredProjects.length !== projects.length &&
            ` sur ${projects.length}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-[200px]">Projet</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="min-w-[140px]">Progression</TableHead>
              <TableHead>ODS</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Search className="size-5 opacity-50" />
                    <span>Aucun projet trouvé</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {
                const progress = calculateProgress(project)
                return (
                  <TableRow
                    key={project.id}
                    className="group/row transition-colors hover:bg-primary/[0.02]"
                  >
                    {/* Project name - link, truncated with tooltip */}
                    <TableCell>
                      <Link
                        href={`/unite/${unitId}/projects/${project.id}`}
                        className="group/link flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                        title={project.name}
                      >
                        <span className="max-w-[250px] truncate">
                          {project.name}
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
                      </Link>
                    </TableCell>

                    {/* Code */}
                    <TableCell>
                      <span className="inline-flex rounded-md bg-muted/50 px-2 py-1 font-mono text-xs font-medium tracking-wide text-muted-foreground">
                        {project.code}
                      </span>
                    </TableCell>

                    {/* Client */}
                    <TableCell className="text-muted-foreground">
                      {project.client?.name ?? (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "flex items-center gap-1.5 font-medium",
                          STATUS_COLORS[
                            project.status as keyof typeof STATUS_COLORS
                          ]
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            statusDotColors[project.status]
                          )}
                        />
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </TableCell>

                    {/* Montant TTC */}
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(project.montantTTC)}
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span
                          className={cn(
                            "shrink-0 text-xs font-medium tabular-nums",
                            progress === 100
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {progress}%
                        </span>
                      </div>
                    </TableCell>

                    {/* ODS */}
                    <TableCell className="text-sm text-muted-foreground">
                      {project.ods ? (
                        formatDate(project.ods)
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 transition-opacity group-hover/row:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/unite/${unitId}/projects/${project.id}`}
                            >
                              <Eye className="mr-2 size-4" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/unite/${unitId}/projects/${project.id}?edit=true`}
                              >
                                <Pencil className="mr-2 size-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canEdit && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setArchiveDialogId(project.id)}
                            >
                              <Archive className="mr-2 size-4" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Archive Confirmation */}
      <AlertDialog
        open={!!archiveDialogId}
        onOpenChange={() => setArchiveDialogId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver le projet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir archiver ce projet ? Cette action peut
              être annulée ultérieurement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveDialogId && handleArchive(archiveDialogId)}
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

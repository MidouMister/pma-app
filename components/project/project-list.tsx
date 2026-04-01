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
import { MoreHorizontal, Eye, Pencil, Archive } from "lucide-react"

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
          p.code.toLowerCase().includes(query)
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
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Rechercher par nom ou code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date (ODS)</SelectItem>
            <SelectItem value="montant">Montant TTC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>ODS</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Aucun projet trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.code}</TableCell>
                  <TableCell>{project.client?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        STATUS_COLORS[
                          project.status as keyof typeof STATUS_COLORS
                        ]
                      }
                    >
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(project.montantTTC)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={calculateProgress(project)}
                        className="h-2 w-24"
                      />
                      <span className="text-xs">
                        {calculateProgress(project)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.ods ? formatDate(project.ods) : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/unite/${unitId}/projects/${project.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/unite/${unitId}/projects/${project.id}?edit=true`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => setArchiveDialogId(project.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

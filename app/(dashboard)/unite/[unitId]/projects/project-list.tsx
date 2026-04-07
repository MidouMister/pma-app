"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { getProjectColumns, type ProjectRow } from "./columns"
import { ProjectToolbar } from "./projects-toolbar"
import { archiveProject } from "@/actions/project"
import { toast } from "sonner"
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

interface ProjectListProps {
  projects: ProjectRow[]
  unitId: string
  canEdit: boolean
  clients: Array<{ id: string; name: string }>
}

export function ProjectList({
  projects,
  unitId,
  canEdit,
  clients,
}: ProjectListProps) {
  const [archiveDialogId, setArchiveDialogId] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  const columns = useMemo(
    () =>
      getProjectColumns({
        unitId,
        canEdit,
        onArchive: (id) => setArchiveDialogId(id),
      }),
    [unitId, canEdit]
  )

  // Apply filters
  const filteredData = useMemo(() => {
    let result = [...projects]

    // Global search
    if (globalFilter) {
      const query = globalFilter.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.clientName?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    // Client filter
    if (clientFilter !== "all") {
      result = result.filter((p) => p.clientName && clients.find((c) => c.id === clientFilter)?.name === p.clientName)
    }

    return result
  }, [projects, globalFilter, statusFilter, clientFilter, clients])

  const hasActiveFilters =
    globalFilter !== "" || statusFilter !== "all" || clientFilter !== "all"

  const resetFilters = () => {
    setGlobalFilter("")
    setStatusFilter("all")
    setClientFilter("all")
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

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredData}
        emptyTitle="Aucun projet trouvé"
        emptyDescription="Aucun projet ne correspond à vos critères de recherche."
        toolbar={
          <ProjectToolbar
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clientFilter={clientFilter}
            setClientFilter={setClientFilter}
            clients={clients}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          />
        }
      />

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
    </>
  )
}

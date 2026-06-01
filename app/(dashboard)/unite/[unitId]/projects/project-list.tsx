"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { getProjectColumns, type ProjectRow } from "./columns"
import { ProjectToolbar } from "./projects-toolbar"
import { archiveProject } from "@/actions/project"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
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
import { ProjectDialog } from "@/components/project/project-dialog"

interface ProjectListProps {
  projects: ProjectRow[]
  unitId: string
  companyId: string
  canEdit: boolean
  clients: Array<{ id: string; name: string }>
}

export function ProjectList({
  projects,
  unitId,
  companyId,
  canEdit,
  clients,
}: ProjectListProps) {
  const router = useRouter()
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null)
  const [archiveDialogId, setArchiveDialogId] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  const handleEdit = useCallback((project: ProjectRow) => {
    setEditingProject(project)
  }, [])

  const columns = useMemo(
    () =>
      getProjectColumns({
        unitId,
        canEdit,
        onArchive: (id) => setArchiveDialogId(id),
        onEdit: handleEdit,
      }),
    [unitId, canEdit, handleEdit]
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
      result = result.filter(
        (p) =>
          p.clientName &&
          clients.find((c) => c.id === clientFilter)?.name === p.clientName
      )
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

  const handleExport = async () => {
    try {
      const { exportProjectsToExcel } = await import("@/lib/excel-export")
      await exportProjectsToExcel(
        filteredData,
        "PMA",
        `Unité ${unitId.slice(0, 8)}`
      )
      toast.success("Export Excel réussi")
    } catch {
      toast.error("Erreur lors de l'export Excel")
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredData}
        emptyTitle="Aucun projet trouvé"
        emptyDescription="Aucun projet ne correspond à vos critères de recherche."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
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
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-10 shrink-0 gap-1.5"
              >
                <FileDown className="size-3.5" />
                Exporter
              </Button>
            )}
          </div>
        }
      />

      {/* Edit Dialog */}
      {editingProject && (
        <ProjectDialog
          key={editingProject.id}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          project={editingProject.rawProject}
          unitId={unitId}
          companyId={companyId}
          clients={clients}
          onSuccess={() => {
            setEditingProject(null)
            router.refresh()
          }}
        />
      )}

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

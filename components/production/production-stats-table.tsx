"use client"

import React, { useTransition, useState, useMemo } from "react"
import { toast } from "sonner"
import { deleteProduction } from "@/actions/production"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FlatProductionStat } from "./production-stats-dashboard"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Calendar,
  BookText,
  Folder,
  Activity,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash,
  Search,
} from "lucide-react"

interface ProductionStatsTableProps {
  data: FlatProductionStat[]
  onEdit?: (production: FlatProductionStat) => void
}

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export function ProductionStatsTable({
  data,
  onEdit,
}: ProductionStatsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredData = useMemo(() => {
    if (!searchQuery) return data
    const query = searchQuery.toLowerCase()
    return data.filter(
      (row) =>
        row.projectName.toLowerCase().includes(query) ||
        row.phaseName.toLowerCase().includes(query) ||
        row.projectCode.toLowerCase().includes(query) ||
        row.phaseCode.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  const handleDelete = (productionId: string | undefined) => {
    if (!productionId) return
    startTransition(async () => {
      const promise = deleteProduction(productionId)
      toast.promise(promise, {
        loading: "Suppression en cours...",
        success: "Production supprimée avec succès",
        error: "Erreur lors de la suppression",
      })
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        Aucune donnée correspondant aux filtres sélectionnés.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par projet, phase ou code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="max-h-125 overflow-auto">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10 bg-muted/50 shadow-sm">
            <TableRow>
              <TableHead className="w-27.5">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Date</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[300px]">
                <div className="flex items-center gap-2">
                  <BookText className="size-4 text-muted-foreground" />
                  <span>Projet & Phase</span>
                </div>
              </TableHead>
              <TableHead className="w-40">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <span>Avancement (%)</span>
                </div>
              </TableHead>
              <TableHead className="w-36">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span>Montant</span>
                </div>
              </TableHead>
              <TableHead className="w-15 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucun résultat pour cette recherche.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => {
                const isUnderperforming =
                row.actualTaux > 0 && row.actualTaux < row.forecastTaux * 0.8
              const varianceTaux = row.actualTaux - row.forecastTaux
              const varianceText = varianceTaux > 0 ? `+${varianceTaux}%` : `${varianceTaux}%`

              return (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {MONTH_LABELS[row.month - 1]} {row.year}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-0">
                    <div className="flex min-w-0 flex-col gap-2 py-1">
                      {/* Project */}
                      <div className="flex min-w-0 items-center gap-2">
                        <BookText className="size-4 shrink-0 text-blue-500" />
                        <span className="text-sm font-semibold text-foreground break-words whitespace-normal" title={row.projectName}>
                          {row.projectName}
                        </span>
                        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                          {row.projectCode}
                        </span>
                      </div>
                      {/* Phase */}
                      <div className="ml-1.5 flex min-w-0 items-center gap-2 border-l-2 border-muted pl-2">
                        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground break-words whitespace-normal" title={row.phaseName}>
                          {row.phaseName}
                        </span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {row.phaseCode}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 pr-2">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            isUnderperforming
                              ? "text-destructive"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {row.actualTaux}%
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                            varianceTaux >= 0
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-destructive/10 text-destructive"
                          )}
                          title="Écart avec le prévisionnel"
                        >
                          {varianceText}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Prévu: {row.forecastTaux}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span
                        className="truncate text-sm font-semibold text-foreground"
                        title={formatCurrency(row.actualMnt)}
                      >
                        {formatCurrency(row.actualMnt)}
                      </span>
                      <span
                        className="truncate text-[10px] font-medium text-muted-foreground"
                        title={`Prévu: ${formatCurrency(row.forecastMnt)}`}
                      >
                        Prévu: {formatCurrency(row.forecastMnt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onEdit?.(row)}
                        >
                          <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => handleDelete(row.productionId)}
                          disabled={isPending || !row.productionId}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
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
    </div>
    </div>
  )
}

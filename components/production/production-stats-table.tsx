"use client"

import React, { useTransition } from "react"
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
import { Progress } from "@/components/ui/progress"
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
    <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="max-h-[500px]">
        <Table className="w-full table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-muted/50 shadow-sm">
            <TableRow>
              <TableHead className="w-[110px]">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Date</span>
                </div>
              </TableHead>
              <TableHead className="w-[32%] min-w-0">
                <div className="flex items-center gap-2">
                  <BookText className="size-4 text-muted-foreground" />
                  <span>Projet</span>
                </div>
              </TableHead>
              <TableHead className="w-[27%] min-w-0">
                <div className="flex items-center gap-2">
                  <Folder className="size-4 text-muted-foreground" />
                  <span>Phase</span>
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <span>% Taux</span>
                </div>
              </TableHead>
              <TableHead className="w-[130px]">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span>Montant</span>
                </div>
              </TableHead>
              <TableHead className="w-[60px] text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const isUnderperforming =
                row.actualTaux > 0 && row.actualTaux < row.forecastTaux * 0.8

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
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-md bg-blue-500/10 p-1.5 text-blue-500">
                        <BookText className="size-4" />
                      </div>
                      <div className="flex w-full min-w-0 flex-col gap-1">
                        <span
                          className="block truncate text-sm font-semibold"
                          title={row.projectName}
                        >
                          {row.projectName}
                        </span>
                        <span className="w-fit truncate rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                          Code: {row.projectCode}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-0">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5 text-muted-foreground">
                        <Folder className="size-4" />
                      </div>
                      <div className="flex w-full min-w-0 flex-col gap-1">
                        <span
                          className="block truncate text-sm font-medium"
                          title={row.phaseName}
                        >
                          {row.phaseName}
                        </span>
                        <span className="w-fit truncate rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          Code: {row.phaseCode}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={row.actualTaux}
                        className={cn(
                          "h-1.5 flex-1 shrink-0",
                          isUnderperforming
                            ? "bg-destructive/20 [&>div]:bg-destructive"
                            : "bg-blue-500/20 [&>div]:bg-blue-500"
                        )}
                      />
                      <span
                        className={cn(
                          "min-w-[3ch] shrink-0 text-xs font-bold",
                          isUnderperforming
                            ? "text-destructive"
                            : "text-blue-500"
                        )}
                      >
                        {row.actualTaux}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-1.5 truncate text-xs font-semibold text-emerald-500"
                      title={formatCurrency(row.actualMnt)}
                    >
                      {formatCurrency(row.actualMnt)}
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
                      <DropdownMenuContent align="end" className="w-[160px]">
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
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

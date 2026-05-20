"use client"

import { Pencil, Trash2, List } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

interface ProductionTableProps {
  productions: Array<{
    id: string
    taux: number
    mntProd: number
    month: number
    year: number
  }>
  forecasts?: Array<{
    month: number
    year: number
    taux: number
    mntProd: number
  }>
  onEdit?: (production: {
    id: string
    taux: number
    month: number
    year: number
  }) => void
  onDelete?: (id: string) => void
  canEdit?: boolean
  productionAlertThreshold?: number
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

export function ProductionTable({
  productions = [],
  forecasts = [],
  onEdit,
  onDelete,
  canEdit = false,
  productionAlertThreshold = 80,
}: ProductionTableProps) {
  if (productions.length === 0) {
    return (
      <EmptyState
        title="Aucune entrée de production"
        description="Aucun état d'avancement réel n'a encore été enregistré pour cette phase."
        icon={<List className="size-6" />}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Période</TableHead>
            <TableHead className="text-right">Taux prévu (%)</TableHead>
            <TableHead className="text-right">Taux réel (%)</TableHead>
            <TableHead className="text-right">Écart (%)</TableHead>
            <TableHead className="text-right font-medium">
              Production réelle
            </TableHead>
            <TableHead className="text-right">Écart montant</TableHead>
            {canEdit && (
              <TableHead className="w-20 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {productions.map((prod) => {
            const matchingForecast = forecasts.find(
              (f) => f.month === prod.month && f.year === prod.year
            )
            const forecastTaux = matchingForecast?.taux ?? 0
            const forecastMnt = matchingForecast?.mntProd ?? 0

            const ecartTaux = prod.taux - forecastTaux
            const ecartMontant = prod.mntProd - forecastMnt

            // Check if it is below the warning threshold (if there was a forecast > 0)
            const isBelowThreshold =
              forecastTaux > 0 &&
              prod.taux < (forecastTaux * productionAlertThreshold) / 100

            const isNegative = ecartTaux < 0

            return (
              <TableRow
                key={prod.id}
                className={cn(
                  isBelowThreshold &&
                    "text-destructive-foreground bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <TableCell className="font-semibold text-foreground">
                  {MONTH_LABELS[prod.month - 1]} {prod.year}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {forecastTaux > 0 ? `${forecastTaux}%` : "—"}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {prod.taux}%
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    isNegative ? "text-destructive" : "text-emerald-600"
                  )}
                >
                  {ecartTaux > 0 ? "+" : ""}
                  {ecartTaux}%
                </TableCell>
                <TableCell className="text-right font-medium text-primary">
                  {formatCurrency(prod.mntProd)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    isNegative ? "text-destructive" : "text-emerald-600"
                  )}
                >
                  {ecartMontant > 0 ? "+" : ""}
                  {formatCurrency(ecartMontant)}
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          onEdit?.({
                            id: prod.id,
                            taux: prod.taux,
                            month: prod.month,
                            year: prod.year,
                          })
                        }
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Modifier</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmer la suppression
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Voulez-vous
                              vraiment supprimer cette entrée de
                              production&nbsp;?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete?.(prod.id)}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

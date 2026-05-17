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
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ProductionTableProps {
  product: { taux: number } | null
  productions: Array<{
    id: string
    taux: number
    mntProd: number
    date: Date
  }>
  onEdit?: (production: { id: string; taux: number; date: Date }) => void
  onDelete?: (id: string) => void
  canEdit?: boolean
}

export function ProductionTable({
  product,
  productions,
  onEdit,
  onDelete,
  canEdit = false,
}: ProductionTableProps) {
  if (!product) return null

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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Taux planifié (%)</TableHead>
            <TableHead className="text-right">Taux réel (%)</TableHead>
            <TableHead className="text-right">Écart (%)</TableHead>
            <TableHead className="text-right">Écart montant</TableHead>
            {canEdit && (
              <TableHead className="w-20 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {productions.map((prod) => {
            const ecartTaux = prod.taux - product.taux
            const ecartMontant =
              prod.mntProd - (product.taux / 100) * prod.mntProd
            const isNegative = ecartTaux < 0

            return (
              <TableRow
                key={prod.id}
                className={cn(isNegative && "bg-red-50/50")}
              >
                <TableCell className="font-medium">
                  {format(new Date(prod.date), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="text-right">{product.taux}%</TableCell>
                <TableCell className="text-right">{prod.taux}%</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    isNegative ? "text-red-600" : "text-emerald-600"
                  )}
                >
                  {ecartTaux > 0 ? "+" : ""}
                  {ecartTaux}%
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    isNegative ? "text-red-600" : "text-emerald-600"
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
                            date: prod.date,
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

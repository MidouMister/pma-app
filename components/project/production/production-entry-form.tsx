"use client"

import { useState, useCallback } from "react"
import { ChartNoAxesColumnIncreasing } from "lucide-react"
import { FormModal } from "@/components/shared/form-modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { createProduction, updateProduction } from "@/actions/production"
import { formatCurrency } from "@/lib/format"

interface ProductionEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  phaseId: string
  phaseMontantHT: number
  productTaux: number
  productionAlertThreshold: number
  production?: { id: string; taux: number; date: Date } | null
  onSuccess?: () => void
}

export function ProductionEntryForm({
  open,
  onOpenChange,
  productId,
  phaseId,
  phaseMontantHT,
  productTaux,
  productionAlertThreshold,
  production,
  onSuccess,
}: ProductionEntryFormProps) {
  const [taux, setTaux] = useState(production?.taux ?? 0)
  const [date, setDate] = useState(
    production?.date ? toDateInputValue(production.date) : ""
  )
  const [isPending, setIsPending] = useState(false)

  const mntProd = phaseMontantHT * (taux / 100)

  const threshold = (productTaux * productionAlertThreshold) / 100
  const showWarning = taux < threshold

  function resetForm() {
    setTaux(production?.taux ?? 0)
    setDate(production?.date ? toDateInputValue(production.date) : "")
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsPending(true)

      try {
        if (production) {
          const result = await updateProduction({
            id: production.id,
            taux,
            date: new Date(date),
          })
          if (!result.success) throw new Error(result.error)
        } else {
          const result = await createProduction({
            productId,
            phaseId,
            taux,
            date: new Date(date),
          })
          if (!result.success) throw new Error(result.error)
        }
        onSuccess?.()
        onOpenChange(false)
      } catch (err) {
        console.error(err)
      } finally {
        setIsPending(false)
      }
    },
    [production, taux, date, productId, phaseId, onSuccess, onOpenChange]
  )

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={production ? "Modifier la production" : "Ajouter une production"}
      description="Enregistrez un état d'avancement réel de la production"
      icon={<ChartNoAxesColumnIncreasing className="size-5" />}
      size="sm"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={resetForm}
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="entry-taux">Taux réel (%)</Label>
          <div className="relative">
            <Input
              id="entry-taux"
              type="number"
              min={0}
              max={100}
              value={taux || ""}
              onChange={(e) => setTaux(Number(e.target.value))}
              className="pr-10"
              placeholder="0"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="entry-date">Date</Label>
          <Input
            id="entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="rounded-lg border bg-card p-3 text-sm">
          <span className="text-muted-foreground">Montant production : </span>
          <span className="font-semibold text-primary">
            {formatCurrency(mntProd)}
          </span>
        </div>

        {showWarning && (
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertTitle className="text-sm font-medium text-amber-800">
              Attention
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              Le taux réel ({taux}%) est en dessous du seuil d&apos;alerte (
              {Math.round(threshold)}%). La production est inférieure au plan
              prévisionnel.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </FormModal>
  )
}

function toDateInputValue(date: Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

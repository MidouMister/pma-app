"use client"

import { useState, useCallback, useEffect } from "react"
import { ChartNoAxesColumnIncreasing } from "lucide-react"
import { FormModal } from "@/components/shared/form-modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProduction, updateProduction } from "@/actions/production"
import { formatCurrency } from "@/lib/format"

interface ProductionEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseId: string
  phaseMontantHT: number
  productionAlertThreshold: number
  production?: { id: string; taux: number; month: number; year: number } | null
  forecasts?: Array<{ month: number; year: number; taux: number }>
  onSuccess?: () => void
}

const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
]

export function ProductionEntryForm({
  open,
  onOpenChange,
  phaseId,
  phaseMontantHT,
  productionAlertThreshold,
  production,
  forecasts = [],
  onSuccess,
}: ProductionEntryFormProps) {
  const currentYear = new Date().getFullYear()
  const [taux, setTaux] = useState(production?.taux ?? 0)
  const [month, setMonth] = useState(
    production?.month ?? new Date().getMonth() + 1
  )
  const [year, setYear] = useState(production?.year ?? currentYear)
  const [isPending, setIsPending] = useState(false)

  // Sync state if production prop changes
  useEffect(() => {
    setTaux(production?.taux ?? 0)
    setMonth(production?.month ?? new Date().getMonth() + 1)
    setYear(production?.year ?? currentYear)
  }, [production, currentYear])

  const mntProd = phaseMontantHT * (taux / 100)

  // Find corresponding forecast to calculate the alert threshold dynamically
  const matchingForecast = forecasts.find(
    (f) => f.month === month && f.year === year
  )
  const forecastTaux = matchingForecast?.taux ?? 0
  const threshold = (forecastTaux * productionAlertThreshold) / 100
  const showWarning = taux < threshold && forecastTaux > 0

  // Years select range (e.g. ± 5 years)
  const yearsList = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  function resetForm() {
    setTaux(production?.taux ?? 0)
    setMonth(production?.month ?? new Date().getMonth() + 1)
    setYear(production?.year ?? currentYear)
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
            month,
            year,
          })
          if (!result.success) throw new Error(result.error)
        } else {
          const result = await createProduction({
            phaseId,
            taux,
            month,
            year,
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
    [production, taux, month, year, phaseId, onSuccess, onOpenChange]
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

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="entry-month">Mois</Label>
            <Select
              value={String(month)}
              onValueChange={(val) => setMonth(Number(val))}
            >
              <SelectTrigger id="entry-month">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="entry-year">Année</Label>
            <Select
              value={String(year)}
              onValueChange={(val) => setYear(Number(val))}
            >
              <SelectTrigger id="entry-year">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {yearsList.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3 text-sm">
          <span className="text-muted-foreground">Montant production : </span>
          <span className="font-semibold text-primary">
            {formatCurrency(mntProd)}
          </span>
        </div>

        {forecastTaux > 0 && (
          <div className="flex justify-between rounded-lg border bg-muted/30 p-3 text-xs">
            <span className="text-muted-foreground">Prévision planifiée :</span>
            <span className="font-medium text-foreground">
              {forecastTaux}% (
              {formatCurrency(phaseMontantHT * (forecastTaux / 100))})
            </span>
          </div>
        )}

        {showWarning && (
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertTitle className="text-sm font-medium text-amber-800">
              Attention
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-700">
              Le taux réel ({taux}%) est en dessous du seuil d&apos;alerte (
              {Math.round(threshold)}%). La production est inférieure au plan
              prévisionnel ({forecastTaux}%).
            </AlertDescription>
          </Alert>
        )}
      </div>
    </FormModal>
  )
}

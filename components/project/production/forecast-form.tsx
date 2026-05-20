"use client"

import { useState, useEffect, useCallback } from "react"
import { Target } from "lucide-react"
import { FormModal } from "@/components/shared/form-modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPhaseForecasts, bulkCreateForecasts } from "@/actions/production"
import { formatCurrency } from "@/lib/format"

interface ForecastFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseId: string
  phaseMontantHT: number
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

export function ForecastForm({
  open,
  onOpenChange,
  phaseId,
  phaseMontantHT,
  onSuccess,
}: ForecastFormProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [forecastsMap, setForecastsMap] = useState<Record<number, number>>({})
  const [allForecasts, setAllForecasts] = useState<
    Array<{ month: number; year: number; taux: number }>
  >([])
  const [isPending, setIsPending] = useState(false)

  // Generate a list of years (currentYear - 2 to currentYear + 4)
  const yearsList = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i)

  const fetchForecasts = useCallback(async () => {
    try {
      const result = await getPhaseForecasts(phaseId)
      if (result.success && result.data) {
        setAllForecasts(result.data)
      }
    } catch (err) {
      console.error("Error fetching forecasts:", err)
    }
  }, [phaseId])

  useEffect(() => {
    if (open) {
      fetchForecasts()
    }
  }, [open, fetchForecasts])

  // Update current forecasts map when year or allForecasts changes
  useEffect(() => {
    const map: Record<number, number> = {}
    // Initialize months with 0
    MONTHS.forEach((m) => {
      map[m.value] = 0
    })
    // Overlay database values for the selected year
    allForecasts
      .filter((f) => f.year === selectedYear)
      .forEach((f) => {
        map[f.month] = f.taux
      })
    setForecastsMap(map)
  }, [selectedYear, allForecasts])

  const handleTauxChange = (month: number, value: string) => {
    const numValue = Math.min(100, Math.max(0, Number(value) || 0))
    setForecastsMap((prev) => ({
      ...prev,
      [month]: numValue,
    }))
  }

  const resetForm = () => {
    const map: Record<number, number> = {}
    MONTHS.forEach((m) => {
      map[m.value] = 0
    })
    allForecasts
      .filter((f) => f.year === selectedYear)
      .forEach((f) => {
        map[f.month] = f.taux
      })
    setForecastsMap(map)
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsPending(true)

      const payload = {
        phaseId,
        year: selectedYear,
        forecasts: Object.entries(forecastsMap).map(([month, taux]) => ({
          month: Number(month),
          taux: Number(taux),
        })),
      }

      try {
        const result = await bulkCreateForecasts(payload)
        if (!result.success) throw new Error(result.error)
        onSuccess?.()
        onOpenChange(false)
      } catch (err) {
        console.error(err)
      } finally {
        setIsPending(false)
      }
    },
    [phaseId, selectedYear, forecastsMap, onSuccess, onOpenChange]
  )

  const totalTaux = Object.values(forecastsMap).reduce((acc, t) => acc + t, 0)

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Prévisions de production"
      description="Définissez le plan de production mensuel prévisionnel pour l'année"
      icon={<Target className="size-5" />}
      size="xl"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={resetForm}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="forecast-year" className="text-sm font-semibold">
              Année de planification :
            </Label>
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(Number(val))}
            >
              <SelectTrigger className="w-[140px]">
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
          <div className="text-right">
            <span className="block text-xs text-muted-foreground">
              Total cumulé planifié
            </span>
            <span
              className={`text-sm font-bold ${
                totalTaux > 100
                  ? "text-destructive"
                  : totalTaux === 100
                    ? "text-emerald-600"
                    : "text-muted-foreground"
              }`}
            >
              {totalTaux}% / 100%
            </span>
          </div>
        </div>

        <div className="grid max-h-[400px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 md:grid-cols-3">
          {MONTHS.map((m) => {
            const taux = forecastsMap[m.value] ?? 0
            const mnt = phaseMontantHT * (taux / 100)

            return (
              <div
                key={m.value}
                className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-card-foreground">
                    {m.label}
                  </span>
                </div>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={taux || ""}
                    onChange={(e) => handleTauxChange(m.value, e.target.value)}
                    className="h-8 pr-8 text-xs"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px] text-muted-foreground">
                    %
                  </span>
                </div>
                <span className="mt-1 block text-[10px] text-muted-foreground/80">
                  {formatCurrency(mnt)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </FormModal>
  )
}

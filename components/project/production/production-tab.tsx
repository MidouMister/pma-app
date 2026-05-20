"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getPhaseProduction,
  deleteProduction,
  getPhaseForecasts,
} from "@/actions/production"
import { ForecastForm } from "./forecast-form"
import { ProductionEntryForm } from "./production-entry-form"
import { ProductionCharts } from "./production-charts"
import { ProductionTable } from "./production-table"
import { formatCurrency } from "@/lib/format"

interface ProductionTabProps {
  projectId: string
  phaseId: string
  phaseName: string
  phaseMontantHT: number
  canEdit: boolean
  productionAlertThreshold: number
}

interface ProductData {
  id: string
  taux: number
  montantProd: number
  Productions: Array<{
    id: string
    taux: number
    mntProd: number
    month: number
    year: number
  }>
}

interface ForecastData {
  id: string
  phaseId: string
  month: number
  year: number
  taux: number
  mntProd: number
}

export function ProductionTab({
  projectId: _projectId,
  phaseId,
  phaseName,
  phaseMontantHT,
  canEdit,
  productionAlertThreshold,
}: ProductionTabProps) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [forecasts, setForecasts] = useState<ForecastData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [forecastFormOpen, setForecastFormOpen] = useState(false)
  const [entryFormOpen, setEntryFormOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<{
    id: string
    taux: number
    month: number
    year: number
  } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [prodResult, forecastResult] = await Promise.all([
        getPhaseProduction(phaseId),
        getPhaseForecasts(phaseId),
      ])

      if (prodResult.success && prodResult.data) {
        setProduct(prodResult.data as ProductData)
      } else {
        setProduct(null)
      }

      if (forecastResult.success && forecastResult.data) {
        setForecasts(forecastResult.data as ForecastData[])
      } else {
        setForecasts([])
      }
    } catch (err) {
      console.error("Error fetching production data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [phaseId])

  useEffect(() => {
    setIsLoading(true)
    fetchData()
  }, [phaseId, fetchData])

  async function handleDeleteProduction(productionId: string) {
    const result = await deleteProduction(productionId)
    if (result.success) {
      fetchData()
    } else {
      console.error(result.error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const annualForecastTaux = forecasts
    .filter((f) => f.year === currentYear)
    .reduce((acc, f) => acc + f.taux, 0)

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 p-4">
        <h3 className="text-lg font-semibold text-foreground">{phaseName}</h3>
        <span className="text-sm font-medium text-muted-foreground">
          Budget : {formatCurrency(phaseMontantHT)}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border bg-card px-3 py-2 text-xs">
            <span className="text-muted-foreground">Taux cumulé réel : </span>
            <span className="font-semibold text-emerald-600">
              {product?.taux ?? 0}%
            </span>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Montant cumulé réel :{" "}
            </span>
            <span className="font-semibold text-primary">
              {formatCurrency(product?.montantProd ?? 0)}
            </span>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Prévision cumulée ({currentYear}) :{" "}
            </span>
            <span className="font-semibold text-blue-600">
              {annualForecastTaux}%
            </span>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForecastFormOpen(true)}
            >
              <Target className="mr-2 size-4 text-blue-500" />
              Prévisions
            </Button>
            <Button size="sm" onClick={() => setEntryFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              Nouvelle production
            </Button>
          </div>
        )}
      </div>

      {/* Production Chart */}
      <ProductionCharts
        forecasts={forecasts}
        productions={product?.Productions ?? []}
        phaseMontantHT={phaseMontantHT}
      />

      {/* Production Table */}
      <ProductionTable
        productions={product?.Productions ?? []}
        forecasts={forecasts}
        onEdit={(prod) => {
          setEditingProduction(prod)
          setEntryFormOpen(true)
        }}
        onDelete={handleDeleteProduction}
        canEdit={canEdit}
        productionAlertThreshold={productionAlertThreshold}
      />

      {/* Forms */}
      <ForecastForm
        open={forecastFormOpen}
        onOpenChange={setForecastFormOpen}
        phaseId={phaseId}
        phaseMontantHT={phaseMontantHT}
        onSuccess={fetchData}
      />

      <ProductionEntryForm
        open={entryFormOpen}
        onOpenChange={(open) => {
          setEntryFormOpen(open)
          if (!open) setEditingProduction(null)
        }}
        phaseId={phaseId}
        phaseMontantHT={phaseMontantHT}
        productionAlertThreshold={productionAlertThreshold}
        production={editingProduction}
        forecasts={forecasts}
        onSuccess={fetchData}
      />
    </div>
  )
}

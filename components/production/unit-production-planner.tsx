"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  Factory,
  Banknote,
  Target,
  Loader2,
  Save,
  CalendarDays,
  TrendingUp,
  BarChart2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/shared/stat-card"
import { formatCurrency } from "@/lib/format"
import { ProductionStatsDashboard } from "./production-stats-dashboard"
import { PhaseData } from "./types"
import {
  bulkUpdateUnitForecasts,
  bulkUpdateUnitProductions,
} from "@/actions/production"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface UnitProductionPlannerProps {
  unitId: string
  phases: PhaseData[]
  canEdit?: boolean
  companyName: string
  unitName: string
}

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
]

export function UnitProductionPlanner({
  unitId,
  phases,
  canEdit = false,
  companyName,
  unitName,
}: UnitProductionPlannerProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [isPending, setIsPending] = useState(false)
  const [activeTab, setActiveTab] = useState<"forecast" | "actual" | "stats">(
    "forecast"
  )

  // Map to store edited values: Map<phaseId, Map<month, taux>>
  const [editedForecasts, setEditedForecasts] = useState<
    Record<string, Record<number, number>>
  >({})
  const [editedActuals, setEditedActuals] = useState<
    Record<string, Record<number, number>>
  >({})

  // Years list (currentYear - 2 to currentYear + 4)
  const yearsList = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i)

  // Group phases by project
  const projectsMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; phases: PhaseData[] }
    >()
    phases.forEach((phase) => {
      const p = phase.Project
      if (!map.has(p.id)) {
        map.set(p.id, { id: p.id, name: p.name, phases: [] })
      }
      map.get(p.id)!.phases.push(phase)
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [phases])

  // Get current value for a cell based on active tab
  const getCellTaux = useCallback(
    (phase: PhaseData, month: number, type: "forecast" | "actual") => {
      if (type === "forecast") {
        if (editedForecasts[phase.id]?.[month] !== undefined) {
          return editedForecasts[phase.id][month]
        }
        const dbVal = phase.ProductionForecasts.find(
          (f) => f.year === selectedYear && f.month === month
        )
        return dbVal?.taux ?? 0
      } else {
        if (editedActuals[phase.id]?.[month] !== undefined) {
          return editedActuals[phase.id][month]
        }
        const dbVal = phase.Production.find(
          (p) => p.year === selectedYear && p.month === month
        )
        return dbVal?.taux ?? 0
      }
    },
    [editedForecasts, editedActuals, selectedYear]
  )

  const handleTauxChange = (phaseId: string, month: number, value: string) => {
    const numValue = Math.min(100, Math.max(0, Number(value) || 0))
    if (activeTab === "forecast") {
      setEditedForecasts((prev) => ({
        ...prev,
        [phaseId]: { ...(prev[phaseId] || {}), [month]: numValue },
      }))
    } else {
      setEditedActuals((prev) => ({
        ...prev,
        [phaseId]: { ...(prev[phaseId] || {}), [month]: numValue },
      }))
    }
  }

  // Calculate stats for the selected year
  const stats = useMemo(() => {
    let totalPlannedMnt = 0
    let totalActualMnt = 0

    phases.forEach((phase) => {
      // Forecasts
      let phasePlannedTaux = 0
      for (let m = 1; m <= 12; m++)
        phasePlannedTaux += getCellTaux(phase, m, "forecast")
      totalPlannedMnt += phase.montantHT * (phasePlannedTaux / 100)

      // Actuals
      let phaseActualTaux = 0
      for (let m = 1; m <= 12; m++)
        phaseActualTaux += getCellTaux(phase, m, "actual")
      totalActualMnt += phase.montantHT * (phaseActualTaux / 100)
    })

    return { totalPlannedMnt, totalActualMnt }
  }, [phases, getCellTaux])

  const hasChanges =
    activeTab === "forecast"
      ? Object.keys(editedForecasts).length > 0
      : Object.keys(editedActuals).length > 0

  const handleSave = async () => {
    if (!hasChanges) return
    setIsPending(true)

    try {
      if (activeTab === "forecast") {
        const payload = {
          unitId,
          year: selectedYear,
          phases: phases.map((phase) => {
            const forecasts = []
            for (let m = 1; m <= 12; m++)
              forecasts.push({
                month: m,
                taux: getCellTaux(phase, m, "forecast"),
              })
            return { phaseId: phase.id, forecasts }
          }),
        }
        const result = await bulkUpdateUnitForecasts(payload)
        if (!result.success) throw new Error(result.error)
        toast.success("Plan prévisionnel enregistré avec succès")
        setEditedForecasts({})
      } else {
        const payload = {
          unitId,
          year: selectedYear,
          phases: phases.map((phase) => {
            const productions = []
            for (let m = 1; m <= 12; m++)
              productions.push({
                month: m,
                taux: getCellTaux(phase, m, "actual"),
              })
            return { phaseId: phase.id, productions }
          }),
        }
        const result = await bulkUpdateUnitProductions(payload)
        if (!result.success) throw new Error(result.error)
        toast.success("Production réelle enregistrée avec succès")
        setEditedActuals({})
      }
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'enregistrement"
      )
    } finally {
      setIsPending(false)
    }
  }

  // When changing year, clear local edits
  const handleYearChange = (val: string) => {
    setSelectedYear(Number(val))
    setEditedForecasts({})
    setEditedActuals({})
  }

  // The matrix rendering logic for a specific tab type
  const renderMatrix = (type: "forecast" | "actual") => {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
              <tr>
                <th className="min-w-50 border-b px-4 py-3">Projet / Phase</th>
                {MONTH_LABELS.map((m) => (
                  <th
                    key={m}
                    className="w-17.5 border-b border-l px-2 py-3 text-center"
                  >
                    {m}
                  </th>
                ))}
                <th className="w-20 border-b border-l bg-muted/20 px-3 py-3 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {projectsMap.map((project) => (
                <React.Fragment key={project.id}>
                  <tr className="bg-muted/20">
                    <td
                      colSpan={14}
                      className="border-t border-b border-border/50 px-4 py-2 font-semibold text-foreground"
                    >
                      <Factory className="mr-2 inline-block size-4 text-primary" />
                      {project.name}
                    </td>
                  </tr>

                  {project.phases.map((phase) => {
                    let totalTaux = 0
                    const cells = []

                    for (let month = 1; month <= 12; month++) {
                      const inputTaux = getCellTaux(phase, month, type)
                      const referenceTaux = getCellTaux(
                        phase,
                        month,
                        type === "forecast" ? "actual" : "forecast"
                      )
                      totalTaux += inputTaux

                      const isReferencePresent =
                        type === "forecast"
                          ? phase.Production.some(
                              (p) =>
                                p.year === selectedYear && p.month === month
                            )
                          : phase.ProductionForecasts.some(
                              (f) =>
                                f.year === selectedYear && f.month === month
                            )

                      cells.push(
                        <td
                          key={month}
                          className="border-b border-l px-1 py-2 text-center align-top"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={inputTaux || ""}
                              onChange={(e) =>
                                handleTauxChange(
                                  phase.id,
                                  month,
                                  e.target.value
                                )
                              }
                              disabled={!canEdit}
                              className={cn(
                                "h-7 w-full min-w-12.5 px-1 text-center text-xs",
                                type === "actual" && inputTaux > 0
                                  ? "border-violet-200 bg-violet-50 focus-visible:ring-violet-500"
                                  : "",
                                type === "forecast" && inputTaux > 0
                                  ? "border-blue-200 bg-blue-50 focus-visible:ring-blue-500"
                                  : ""
                              )}
                              placeholder="0"
                            />
                            <div className="flex h-4 items-center justify-center">
                              {isReferencePresent ? (
                                <span
                                  className={cn(
                                    "rounded px-1 text-[10px] font-medium",
                                    type === "forecast"
                                      ? "bg-violet-100 text-violet-600"
                                      : "bg-blue-100 text-blue-600"
                                  )}
                                >
                                  {referenceTaux}%{" "}
                                  {type === "forecast" ? "R" : "P"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-transparent">
                                  -
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    }

                    return (
                      <tr
                        key={phase.id}
                        className="transition-colors hover:bg-muted/10"
                      >
                        <td className="border-b border-border/50 px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {phase.name}
                            </span>
                            <span className="mt-1 text-[10px] text-muted-foreground">
                              Montant: {formatCurrency(phase.montantHT)}
                            </span>
                          </div>
                        </td>
                        {cells}
                        <td
                          className={cn(
                            "border-b border-l bg-muted/10 px-3 py-3 text-right align-top text-xs font-bold",
                            totalTaux > 100
                              ? "text-destructive"
                              : totalTaux === 100
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {totalTaux}%
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}

              {projectsMap.length === 0 && (
                <tr>
                  <td
                    colSpan={14}
                    className="border-b px-4 py-8 text-center text-muted-foreground"
                  >
                    Aucun projet ou phase trouvé pour cette unité.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Select value={String(selectedYear)} onValueChange={handleYearChange}>
            <SelectTrigger className="w-35 bg-background text-lg font-semibold">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {yearsList.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Année {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canEdit && activeTab !== "stats" && (
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Enregistrer{" "}
            {activeTab === "forecast" ? "les prévisions" : "les réalisations"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={`Montant global prévu (${selectedYear})`}
          value={formatCurrency(stats.totalPlannedMnt)}
          icon={<Target className="size-4" />}
          accent="primary"
        />
        <StatCard
          label={`Montant global réalisé (${selectedYear})`}
          value={formatCurrency(stats.totalActualMnt)}
          icon={<Banknote className="size-4" />}
          accent="violet"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as "forecast" | "actual" | "stats")
        }
        className="w-full"
      >
        <TabsList className="mb-4 grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="forecast" className="gap-2">
            <CalendarDays className="size-4" />
            Prévisionnelle
          </TabsTrigger>
          <TabsTrigger value="actual" className="gap-2">
            <TrendingUp className="size-4" />
            Réalisée
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart2 className="size-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>
        <TabsContent value="forecast">{renderMatrix("forecast")}</TabsContent>
        <TabsContent value="actual">{renderMatrix("actual")}</TabsContent>
        <TabsContent value="stats">
          <ProductionStatsDashboard
            unitId={unitId}
            phases={phases}
            companyName={companyName}
            unitName={unitName}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

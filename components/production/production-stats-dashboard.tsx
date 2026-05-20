"use client"

import React, { useState, useMemo } from "react"
import { ProductionStatsTable } from "./production-stats-table"
import { ProductionStatsChart } from "./production-stats-chart"
import { ProductionEntryModal } from "./production-entry-modal"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { exportToExcel } from "@/lib/excel-export"
import { PhaseData } from "./types" // I'll extract PhaseData to types.ts later

export interface FlatProductionStat {
  id: string
  productionId?: string
  projectId: string
  projectName: string
  projectCode: string
  phaseId: string
  phaseName: string
  phaseCode: string
  montantHT: number
  month: number
  year: number
  actualTaux: number
  actualMnt: number
  forecastTaux: number
  forecastMnt: number
}

interface ProductionStatsDashboardProps {
  unitId: string
  phases: PhaseData[]
  companyName: string
  unitName: string
}

export function ProductionStatsDashboard({
  unitId,
  phases,
  companyName,
  unitName,
}: ProductionStatsDashboardProps) {
  const currentYear = new Date().getFullYear()

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("all")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<{
    id: string
    projectId: string
    phaseId: string
    month: number
    year: number
    taux: number
  } | null>(null)

  // Flatten data: create a row for every Month/Year combination that has either Forecast or Actual
  const flatData = useMemo(() => {
    const data: FlatProductionStat[] = []

    phases.forEach((phase) => {
      // Only iterate over actual productions (réalisées)
      phase.Production.forEach((p) => {
        // If the realized production is 0, we can skip it as requested
        if (p.taux <= 0) return

        const forecast = phase.ProductionForecasts.find(
          (f) => f.year === p.year && f.month === p.month
        )

        data.push({
          id: `${phase.id}-${p.year}-${p.month}`,
          productionId: p.id,
          projectId: phase.Project.id,
          projectName: phase.Project.name,
          projectCode: phase.Project.code,
          phaseId: phase.id,
          phaseName: phase.name,
          phaseCode: phase.code,
          montantHT: phase.montantHT,
          month: p.month,
          year: p.year,
          actualTaux: p.taux,
          actualMnt: p.mntProd,
          forecastTaux: forecast?.taux ?? 0,
          forecastMnt: forecast?.mntProd ?? 0,
        })
      })
    })

    return data.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      if (a.month !== b.month) return b.month - a.month
      return a.projectName.localeCompare(b.projectName)
    })
  }, [phases])

  // Filtered data
  const filteredData = useMemo(() => {
    return flatData.filter((row) => {
      if (selectedYear !== "all" && String(row.year) !== selectedYear)
        return false
      if (selectedMonth !== "all" && String(row.month) !== selectedMonth)
        return false
      if (selectedProjectId !== "all" && row.projectId !== selectedProjectId)
        return false
      if (selectedPhaseId !== "all" && row.phaseId !== selectedPhaseId)
        return false
      return true
    })
  }, [
    flatData,
    selectedYear,
    selectedMonth,
    selectedProjectId,
    selectedPhaseId,
  ])

  // Options for filters
  const projects = useMemo(() => {
    const map = new Map<string, string>()
    phases.forEach((p) => map.set(p.Project.id, p.Project.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [phases])

  const availablePhases = useMemo(() => {
    if (selectedProjectId === "all") return []
    return phases.filter((p) => p.Project.id === selectedProjectId)
  }, [phases, selectedProjectId])

  const yearsList = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i)
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

  const handleExport = () => {
    exportToExcel(filteredData, companyName, unitName)
  }

  return (
    <div className="mt-4 flex flex-col gap-6">
      {/* Action Bar & Filters */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm xl:flex-row">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 xl:w-auto">
          {/* Year Filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {yearsList.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month Filter */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {MONTH_LABELS.map((m, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Project Filter */}
          <Select
            value={selectedProjectId}
            onValueChange={(val) => {
              setSelectedProjectId(val)
              setSelectedPhaseId("all")
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Phase Filter */}
          <Select
            value={selectedPhaseId}
            onValueChange={setSelectedPhaseId}
            disabled={selectedProjectId === "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toutes les phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les phases</SelectItem>
              {availablePhases.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full items-center justify-end gap-3 xl:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            className="w-full gap-2 sm:w-auto"
          >
            <Download className="size-4" />
            Exporter Excel
          </Button>
          <Button
            onClick={() => {
              setEditingProduction(null)
              setIsModalOpen(true)
            }}
            className="w-full gap-2 sm:w-auto"
          >
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart Section */}
        <div className="lg:col-span-3">
          <ProductionStatsChart data={filteredData} />
        </div>

        {/* Table Section */}
        <div className="lg:col-span-3">
          <ProductionStatsTable
            data={filteredData}
            onEdit={(row) => {
              setEditingProduction({
                id: row.productionId!,
                projectId: row.projectId,
                phaseId: row.phaseId,
                month: row.month,
                year: row.year,
                taux: row.actualTaux,
              })
              setIsModalOpen(true)
            }}
          />
        </div>
      </div>

      <ProductionEntryModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingProduction(null)
        }}
        phases={phases}
        unitId={unitId}
        production={editingProduction}
      />
    </div>
  )
}

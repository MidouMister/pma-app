"use client"

import React, { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { FlatProductionStat } from "./production-stats-dashboard"

interface ProductionStatsChartProps {
  data: FlatProductionStat[]
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

export function ProductionStatsChart({ data }: ProductionStatsChartProps) {
  const chartData = useMemo(() => {
    // Group by Year-Month
    const groups = new Map<
      string,
      { name: string; sortKey: number; Prevu: number; Realise: number }
    >()

    data.forEach((row) => {
      const key = `${row.year}-${row.month}`
      if (!groups.has(key)) {
        groups.set(key, {
          name: `${MONTH_LABELS[row.month - 1]} ${row.year}`,
          sortKey: row.year * 100 + row.month,
          Prevu: 0,
          Realise: 0,
        })
      }
      const group = groups.get(key)!
      group.Prevu += row.forecastMnt
      group.Realise += row.actualMnt
    })

    return Array.from(groups.values()).sort((a, b) => a.sortKey - b.sortKey)
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-xl border bg-card p-8 text-muted-foreground">
        Graphique non disponible (aucune donnée).
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Comparaison des montants (Prévisionnel vs Réalisé)
      </h3>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M DA`}
            />
            <Tooltip
              cursor={{ fill: "#f3f4f6" }}
              formatter={(value: any) => [
                new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                }).format(value as number),
                "",
              ]}
              labelStyle={{
                color: "#111827",
                fontWeight: 600,
                marginBottom: "8px",
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              dataKey="Prevu"
              name="Prévisionnel"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="Realise"
              name="Réalisé"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

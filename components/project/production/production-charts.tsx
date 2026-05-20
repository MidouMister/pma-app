"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

interface ProductionChartsProps {
  forecasts: Array<{ month: number; year: number; taux: number }>
  productions: Array<{
    month: number
    year: number
    taux: number
    mntProd: number
  }>
  phaseMontantHT: number
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

export function ProductionCharts({
  forecasts = [],
  productions = [],
  phaseMontantHT,
}: ProductionChartsProps) {
  const chartData = useMemo(() => {
    const periods = new Map<
      string,
      {
        month: number
        year: number
        plannedTaux: number
        actualTaux: number
        plannedMnt: number
        actualMnt: number
      }
    >()

    // Populate forecasts
    forecasts.forEach((f) => {
      const key = `${f.year}-${String(f.month).padStart(2, "0")}`
      periods.set(key, {
        month: f.month,
        year: f.year,
        plannedTaux: f.taux,
        actualTaux: 0,
        plannedMnt: phaseMontantHT * (f.taux / 100),
        actualMnt: 0,
      })
    })

    // Populate actual productions
    productions.forEach((p) => {
      const key = `${p.year}-${String(p.month).padStart(2, "0")}`
      const existing = periods.get(key)
      if (existing) {
        existing.actualTaux = p.taux
        existing.actualMnt = p.mntProd
      } else {
        periods.set(key, {
          month: p.month,
          year: p.year,
          plannedTaux: 0,
          actualTaux: p.taux,
          plannedMnt: 0,
          actualMnt: p.mntProd,
        })
      }
    })

    // Sort periods chronologically
    const sortedKeys = Array.from(periods.keys()).sort()

    return sortedKeys.map((key) => {
      const data = periods.get(key)!
      return {
        period: `${MONTH_LABELS[data.month - 1]} ${data.year}`,
        plannedTaux: data.plannedTaux,
        actualTaux: data.actualTaux,
        plannedMnt: data.plannedMnt,
        actualMnt: data.actualMnt,
      }
    })
  }, [forecasts, productions, phaseMontantHT])

  if (chartData.length === 0) {
    return (
      <Card className="flex h-[200px] items-center justify-center border-dashed">
        <p className="text-sm text-muted-foreground">
          Aucune donnée de prévision ou de production pour alimenter les
          graphiques.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Taux prévisionnel vs réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="period"
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "13px",
                  }}
                  formatter={(value: unknown, name: unknown) =>
                    [
                      `${value}%`,
                      name === "plannedTaux" ? "Prévisionnel" : "Réel",
                    ] as [string, string]
                  }
                />
                <Legend
                  formatter={(value: unknown) =>
                    value === "plannedTaux" ? "Prévisionnel" : "Réel"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="plannedTaux"
                  stroke="hsl(221 83% 53%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  name="plannedTaux"
                />
                <Line
                  type="monotone"
                  dataKey="actualTaux"
                  stroke="hsl(160 84% 39%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="actualTaux"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Montant prévisionnel vs réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="period"
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "13px",
                  }}
                  formatter={(
                    value: unknown,
                    name: unknown
                  ): [string, string] => {
                    const label =
                      name === "plannedMnt" ? "Prévisionnel" : "Réel"
                    return [formatCurrency(Number(value)), label]
                  }}
                />
                <Legend
                  formatter={(value: unknown) =>
                    value === "plannedMnt" ? "Prévisionnel" : "Réel"
                  }
                />
                <Bar
                  dataKey="plannedMnt"
                  fill="hsl(221 83% 53%)"
                  radius={[4, 4, 0, 0]}
                  name="plannedMnt"
                />
                <Bar
                  dataKey="actualMnt"
                  fill="hsl(160 84% 39%)"
                  radius={[4, 4, 0, 0]}
                  name="actualMnt"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M DA`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K DA`
  }
  return `${Math.round(value)} DA`
}

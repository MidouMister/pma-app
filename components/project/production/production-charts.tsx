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
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ProductionChartsProps {
  product: { taux: number; date: Date } | null
  productions: Array<{ taux: number; mntProd: number; date: Date }>
  phaseMontantHT: number
}

export function ProductionCharts({
  product,
  productions,
  phaseMontantHT,
}: ProductionChartsProps) {
  const chartData = useMemo(() => {
    if (!product || productions.length === 0) return []

    const plannedMontant = phaseMontantHT * (product.taux / 100)

    return productions.map((p) => ({
      date: format(new Date(p.date), "d MMM", { locale: fr }),
      plannedTaux: product.taux,
      actualTaux: p.taux,
      plannedMnt: plannedMontant,
      actualMnt: p.mntProd,
      rawDate: new Date(p.date).getTime(),
    }))
  }, [product, productions, phaseMontantHT])

  if (!product || productions.length === 0) return null

  const plannedTaux = product.taux

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taux planifié vs réel</CardTitle>
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
                  dataKey="date"
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
                      name === "plannedTaux" ? "Planifié" : "Réel",
                    ] as [string, string]
                  }
                />
                <Legend
                  formatter={(value: unknown) =>
                    value === "plannedTaux" ? "Planifié" : "Réel"
                  }
                />
                <ReferenceLine
                  y={plannedTaux}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="plannedTaux"
                  stroke="hsl(221 83% 53%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
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
          <CardTitle className="text-base">Montant planifié vs réel</CardTitle>
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
                  dataKey="date"
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
                  formatter={(value: unknown): [string, string] => {
                    return [formatCurrency(Number(value)), "Montant"]
                  }}
                  labelFormatter={(label: unknown) => `Date : ${String(label)}`}
                />
                <Legend
                  formatter={(value: unknown) =>
                    value === "plannedMnt" ? "Planifié" : "Réel"
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

"use client"

import { useMemo, useState, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface PhaseOverviewRow {
  phaseId: string
  phaseName: string
  projectId: string
  projectName: string
  plannedTaux: number
  plannedMontant: number
  avgActualTaux: number
  actualMontant: number
  ecart: number
  isUnderperforming: boolean
}

interface ProductionsTableProps {
  data: PhaseOverviewRow[]
  projects: { id: string; name: string }[]
  threshold: number
}

type SortKey =
  | "projectName"
  | "phaseName"
  | "plannedTaux"
  | "avgActualTaux"
  | "ecart"

type SortDir = "asc" | "desc"

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onToggle,
}: {
  label: string
  sortKey: SortKey
  currentSort: SortKey
  currentDir: SortDir
  onToggle: (key: SortKey) => void
}) {
  const isActive = currentSort === sortKey
  return (
    <button
      onClick={() => onToggle(sortKey)}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      {label}
      <span
        className={cn(
          "text-[10px]",
          isActive ? "text-foreground" : "text-muted-foreground/50"
        )}
      >
        {isActive ? (currentDir === "asc" ? "▲" : "▼") : "▾"}
      </span>
    </button>
  )
}

export function ProductionsTable({
  data,
  projects,
  threshold: _threshold,
}: ProductionsTableProps) {
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("projectName")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return prev
      }
      setSortDir("asc")
      return key
    })
  }, [])

  const filtered = useMemo(() => {
    let result = [...data]

    if (projectFilter !== "all") {
      result = result.filter((r) => r.projectId === projectFilter)
    }

    if (statusFilter === "underperforming") {
      result = result.filter((r) => r.isUnderperforming)
    } else if (statusFilter === "onTrack") {
      result = result.filter((r) => !r.isUnderperforming)
    }

    result.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      const cmp =
        typeof aVal === "string"
          ? (aVal as string).localeCompare(bVal as string)
          : (aVal as number) - (bVal as number)
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [data, projectFilter, statusFilter, sortKey, sortDir])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Projet</span>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Statut</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="underperforming">Sous-performant</SelectItem>
              <SelectItem value="onTrack">Dans les clous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader
                  label="Projet"
                  sortKey="projectName"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Phase"
                  sortKey="phaseName"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Taux planifié"
                  sortKey="plannedTaux"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Taux réel moyen"
                  sortKey="avgActualTaux"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Écart"
                  sortKey="ecart"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onToggle={toggleSort}
                />
              </TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Aucune phase trouvée
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.phaseId}
                  className={cn(row.isUnderperforming && "bg-destructive/5")}
                >
                  <TableCell className="font-medium">
                    {row.projectName}
                  </TableCell>
                  <TableCell>{row.phaseName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.plannedTaux}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgActualTaux}%
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      row.ecart < 0
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {row.ecart > 0 ? "+" : ""}
                    {row.ecart}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.isUnderperforming ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {row.isUnderperforming
                        ? "Sous-performant"
                        : "Dans les clous"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

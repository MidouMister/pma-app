"use client"

import {
  Search,
  RotateCcw,
  Plus,
  Minus,
  Layers,
  ListTodo,
  Flag,
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
import { type Range } from "@/components/kibo-ui/gantt"
import { RANGES } from "@/lib/types"

interface GanttToolbarProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  statusFilter: string | null
  setStatusFilter: (f: string | null) => void
  hasActiveFilters: boolean
  range: Range
  setRange: (r: Range) => void
  zoom: number
  handleZoomIn: () => void
  handleZoomOut: () => void
  phaseCount: number
  subPhaseCount: number
  markerCount: number
}

export function GanttToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  hasActiveFilters,
  range,
  setRange,
  zoom,
  handleZoomIn,
  handleZoomOut,
  phaseCount,
  subPhaseCount,
  markerCount,
}: GanttToolbarProps) {
  return (
    <div className="rounded-lg border bg-linear-to-r from-card to-muted/30 p-3">
      <div className="flex w-full max-w-full flex-col gap-3 overflow-x-hidden">
        {/* Row 1: Search + Filter + Counts */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
              <SelectItem value="in-progress">En cours</SelectItem>
              <SelectItem value="pause">En pause</SelectItem>
              <SelectItem value="complete">Terminé</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter(null)
              }}
              className="h-8 text-xs"
            >
              <RotateCcw className="mr-1 size-3" />
              Effacer
            </Button>
          )}

          {/* Count badges */}
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 tabular-nums">
              <Layers className="size-3" />
              {phaseCount} phases
            </span>
            <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 tabular-nums">
              <ListTodo className="size-3" />
              {subPhaseCount} s/phases
            </span>
            <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 tabular-nums">
              <Flag className="size-3" />
              {markerCount} marq.
            </span>
          </div>
        </div>

        {/* Row 2: Range toggle + Zoom controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            {RANGES.map(({ key, label }) => (
              <Button
                key={key}
                variant={range === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setRange(key)}
                className="h-7 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <Minus className="size-3" />
            </Button>
            <span className="min-w-12 text-center text-xs font-medium text-muted-foreground tabular-nums">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

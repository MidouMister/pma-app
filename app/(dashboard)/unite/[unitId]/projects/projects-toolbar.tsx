"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface ProjectToolbarProps {
  globalFilter: string
  setGlobalFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  clientFilter: string
  setClientFilter: (value: string) => void
  clients: Array<{ id: string; name: string }>
  hasActiveFilters: boolean
  onReset: () => void
}

export function ProjectToolbar({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  clients,
  hasActiveFilters,
  onReset,
}: ProjectToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, code ou client..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-10 pl-9"
        />
      </div>

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-10 w-full sm:w-[180px]">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="New">Nouveau</SelectItem>
          <SelectItem value="InProgress">En cours</SelectItem>
          <SelectItem value="Pause">En pause</SelectItem>
          <SelectItem value="Complete">Terminé</SelectItem>
        </SelectContent>
      </Select>

      {/* Client filter */}
      <Select value={clientFilter} onValueChange={setClientFilter}>
        <SelectTrigger className="h-10 w-full sm:w-[180px]">
          <SelectValue placeholder="Tous les clients" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les clients</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-10 gap-1.5 shrink-0"
        >
          <X className="size-3.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  )
}

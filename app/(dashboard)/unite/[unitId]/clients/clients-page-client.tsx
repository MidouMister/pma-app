"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ClientDialog } from "@/components/client/client-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  SortByUp01Icon,
  SortByDown01Icon,
} from "@hugeicons/core-free-icons"

interface ClientData {
  id: string
  name: string
  wilaya: string | null
  phone: string | null
  email: string | null
  projectCount: number
  totalTTC: number
}

interface ClientsPageClientProps {
  clients: ClientData[]
  unitId: string
  role: string
}

type SortField = "name" | "totalTTC"
type SortDirection = "asc" | "desc"

export function ClientsPageClient({
  clients,
  unitId,
  role,
}: ClientsPageClientProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Filter by name (case-insensitive)
  const filtered = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1
    if (sortField === "name") {
      return multiplier * a.name.localeCompare(b.name)
    }
    return multiplier * (a.totalTTC - b.totalTTC)
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const canCreate = role === "OWNER" || role === "ADMIN"

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {canCreate && <ClientDialog unitId={unitId} companyId="" />}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState
          title={search ? "Aucun résultat" : "Aucun client"}
          description={
            search
              ? "Aucun client ne correspond à votre recherche."
              : "Créez votre premier client pour commencer."
          }
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1.5 font-medium hover:text-foreground"
                  >
                    Nom
                    {sortField === "name" && (
                      <HugeiconsIcon
                        icon={
                          sortDirection === "asc"
                            ? SortByUp01Icon
                            : SortByDown01Icon
                        }
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    )}
                  </button>
                </TableHead>
                <TableHead>Wilaya</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Projets</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("totalTTC")}
                    className="flex items-center gap-1.5 font-medium hover:text-foreground"
                  >
                    Valeur TTC
                    {sortField === "totalTTC" && (
                      <HugeiconsIcon
                        icon={
                          sortDirection === "asc"
                            ? SortByUp01Icon
                            : SortByDown01Icon
                        }
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    )}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/unite/${unitId}/clients/${client.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.wilaya ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium",
                        client.projectCount > 0 && "bg-primary/10 text-primary"
                      )}
                    >
                      {client.projectCount}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(client.totalTTC)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

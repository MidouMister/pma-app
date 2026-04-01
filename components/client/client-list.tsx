"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Eye, MoreHorizontal, Pencil, ArrowUpDown } from "lucide-react"
import { type Client, type Project } from "@prisma/client"

import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientDialog } from "./client-dialog"

type ClientWithAggregations = Client & {
  projects: Pick<Project, "id" | "montantTTC" | "status">[]
  _count: { projects: number }
  totalValue: number
}

interface ClientListProps {
  clients: ClientWithAggregations[]
  userRole: string
  unitId: string
  companyId: string
}

export function ClientList({
  clients,
  userRole,
  unitId,
  companyId,
}: ClientListProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<"name" | "totalValue">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Filter & Sort
  const filteredAndSorted = clients
    .filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      if (sortKey === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortKey === "totalValue") {
        comparison = a.totalValue - b.totalValue
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const toggleSort = (key: "name" | "totalValue") => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const columns = [
    {
      header: "Nom du client",
      accessorKey: "name" as const,
      cell: (row: ClientWithAggregations) => (
        <div className="font-medium text-foreground">{row.name}</div>
      ),
    },
    {
      header: "Wilaya",
      accessorKey: "wilaya" as const,
      cell: (row: ClientWithAggregations) => (
        <div className="text-muted-foreground">{row.wilaya ?? "-"}</div>
      ),
    },
    {
      header: "Contact",
      accessorKey: "email" as const,
      cell: (row: ClientWithAggregations) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.email ?? "-"}</span>
          <span className="text-xs text-muted-foreground">
            {row.phone ?? "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Projets (Total)",
      accessorKey: "_count" as const,
      cell: (row: ClientWithAggregations) => (
        <div className="text-sm">{row._count?.projects ?? 0} projets</div>
      ),
    },
    {
      header: "Valeur TTC",
      accessorKey: "totalValue" as const,
      cell: (row: ClientWithAggregations) => (
        <div className="font-medium">{formatCurrency(row.totalValue)}</div>
      ),
    },
    {
      header: "",
      accessorKey: "id" as const,
      cell: (row: ClientWithAggregations) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/unite/${unitId}/clients/${row.id}`}
                className="flex items-center"
              >
                <Eye className="mr-2 h-4 w-4" />
                Détails du profil
              </Link>
            </DropdownMenuItem>
            {(userRole === "OWNER" || userRole === "ADMIN") && (
              <>
                <DropdownMenuSeparator />
                <DialogItem
                  triggerChildren={
                    <div className="flex w-full items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </div>
                  }
                >
                  <ClientDialog
                    unitId={unitId}
                    companyId={companyId}
                    client={row}
                    trigger={<div className="hidden" />}
                  />
                </DialogItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-md shadow-sm sm:flex">
            <Button
              variant={sortKey === "name" ? "secondary" : "outline"}
              size="sm"
              className="rounded-e-none border-e-0"
              onClick={() => toggleSort("name")}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Trier par nom
            </Button>
            <Button
              variant={sortKey === "totalValue" ? "secondary" : "outline"}
              size="sm"
              className="rounded-s-none"
              onClick={() => toggleSort("totalValue")}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Trier par montant
            </Button>
          </div>

          {(userRole === "OWNER" || userRole === "ADMIN") && (
            <ClientDialog unitId={unitId} companyId={companyId} />
          )}
        </div>
      </div>

      <DataTable columns={columns} data={filteredAndSorted} />
    </div>
  )
}

// Helper to render ClientDialog inside DropdownMenuItem without nesting bugs
function DialogItem({
  triggerChildren,
  children,
  onSelect,
}: {
  triggerChildren: React.ReactNode
  children: React.ReactElement
  onSelect?: () => void
}) {
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault()
        onSelect?.()
      }}
    >
      {/* We clone the ClientDialog to override its trigger */}
      {React.cloneElement(
        children as React.ReactElement<{ trigger?: React.ReactNode }>,
        {
          trigger: (
            <button className="line-clamp-1 flex w-full items-center text-left">
              {triggerChildren}
            </button>
          ),
        }
      )}
    </DropdownMenuItem>
  )
}

import React from "react"

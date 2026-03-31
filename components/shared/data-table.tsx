"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"

interface Column<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  getRowKey?: (row: T, index: number) => string
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "Aucune donnée disponible",
  getRowKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title="Aucune donnée" description={emptyMessage} />
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={getRowKey?.(row, rowIndex) ?? `row-${rowIndex}`}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.cell
                    ? column.cell(row)
                    : column.accessorKey
                      ? String(row[column.accessorKey] ?? "")
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  List,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

import { cn } from "@/lib/utils"
import { formatRelativeDueDate } from "@/lib/format"

interface TaskRow {
  id: string
  title: string
  description: string | null
  complete: boolean
  laneId: string | null
  laneName: string | null
  assignedUserId: string | null
  assignedUserName: string | null
  assignedUserAvatar: string | null
  dueDate: Date | null
  startDate: Date | null
  projectId: string
  projectName: string
  phaseName: string | null
  subPhaseName: string | null
  tagNames: string[]
  tagColors: string[]
  commentCount: number
}

interface TaskTableProps {
  tasks: TaskRow[]
  lanes: { id: string; name: string; color: string | null }[]
  canEdit: boolean
  onEdit?: (task: TaskRow) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
  onRowClick?: (task: TaskRow) => void
}

const columnLabels: Record<string, string> = {
  laneName: "Statut",
  title: "Titre",
  assignedUserName: "Assigné",
  dueDate: "Échéance",
  tags: "Tags",
  commentCount: "Commentaires",
  complete: "Terminé",
  actions: "Actions",
}

export function TaskTable({
  tasks,
  lanes,
  canEdit,
  onEdit,
  onDelete,
  onComplete,
  onRowClick,
}: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const laneColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const lane of lanes) {
      map.set(lane.id, lane.color ?? "#6b7280")
    }
    return map
  }, [lanes])

  const columns = useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        accessorKey: "laneName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const laneId = row.original.laneId
          const color = laneId
            ? (laneColorMap.get(laneId) ?? "#6b7280")
            : "#6b7280"
          return (
            <div className="flex items-center gap-2">
              <div
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{row.original.laneName ?? "-"}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Titre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              row.original.complete &&
                "text-muted-foreground line-through opacity-50"
            )}
          >
            {row.original.title}
          </span>
        ),
      },
      {
        id: "commentCount",
        enableSorting: false,
        cell: ({ row }) => {
          const count = row.original.commentCount
          if (count === 0) return null
          return (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="size-3" />
              <span>{count}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "assignedUserName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assigné
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const name = row.original.assignedUserName
          const avatarUrl = row.original.assignedUserAvatar
          if (!name) {
            return <span className="text-muted-foreground">-</span>
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {name[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span>{name}</span>
            </div>
          )
        },
      },
      {
        accessorFn: (row) =>
          row.dueDate ? row.dueDate.getTime() : Number.MIN_SAFE_INTEGER,
        id: "dueDate",
        sortingFn: "basic",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Échéance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const dueDate = row.original.dueDate
          if (!dueDate) {
            return <span className="text-muted-foreground">-</span>
          }
          const info = formatRelativeDueDate(dueDate)
          const isComplete = row.original.complete
          return (
            <span
              className={cn(
                "whitespace-nowrap",
                info.variant === "overdue" &&
                  !isComplete &&
                  "font-medium text-destructive",
                info.variant === "today" &&
                  !isComplete &&
                  "font-medium text-emerald-500",
                info.variant === "normal" && "text-muted-foreground"
              )}
            >
              {info.text}
            </span>
          )
        },
      },
      {
        id: "tags",
        enableSorting: false,
        cell: ({ row }) => {
          const names = row.original.tagNames
          const colors = row.original.tagColors
          if (names.length === 0) return null
          const visible = names.slice(0, 2)
          const overflow = names.length - 2
          return (
            <div className="flex items-center gap-1">
              {visible.map((name, i) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="text-[10px]"
                  style={{
                    backgroundColor: (colors[i] ?? "#6b7280") + "20",
                    color: colors[i] ?? "#6b7280",
                  }}
                >
                  {name}
                </Badge>
              ))}
              {overflow > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{overflow}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "complete",
        enableSorting: false,
        cell: ({ row }) =>
          canEdit && onComplete ? (
            <Checkbox
              checked={row.original.complete}
              onCheckedChange={() => onComplete(row.original.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={
                row.original.complete
                  ? "Marquer comme non terminée"
                  : "Marquer comme terminée"
              }
            />
          ) : (
            <span className="text-muted-foreground">
              {row.original.complete ? "Oui" : "Non"}
            </span>
          ),
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(row.original)
                }}
                aria-label="Modifier"
              >
                <Pencil className="size-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(row.original.id)
                }}
                aria-label="Supprimer"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [laneColorMap, canEdit, onEdit, onDelete, onComplete]
  )

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <List className="size-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune tâche trouvée</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucune tâche trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} tâche
            {table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Lignes par page</p>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-7 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-3" />
            </Button>
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1}
              {table.getPageCount() > 0 ? ` sur ${table.getPageCount()}` : ""}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="shadow-sm">
                <Eye className="size-3" />
                Colonnes
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {columnLabels[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

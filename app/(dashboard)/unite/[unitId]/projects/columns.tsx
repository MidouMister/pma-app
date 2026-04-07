"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Archive, Eye, MoreHorizontal, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_CONFIG = {
  New: {
    label: "Nouveau",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  InProgress: {
    label: "En cours",
    dot: "bg-emerald-500 animate-pulse",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  Pause: {
    label: "En pause",
    dot: "bg-amber-500",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Complete: {
    label: "Terminé",
    dot: "bg-slate-400",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
}

export interface ProjectRow {
  id: string
  name: string
  code: string
  status: string
  montantTTC: number
  ods: Date | null
  clientName: string | null
  progress: number
  unitId: string
}

interface ProjectColumnsProps {
  unitId: string
  canEdit: boolean
  onArchive: (id: string) => void
}

export function getProjectColumns({
  unitId,
  canEdit,
  onArchive,
}: ProjectColumnsProps): ColumnDef<ProjectRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Projet",
      size: 280,
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="flex flex-col gap-1 py-1">
            <Link
              href={`/unite/${unitId}/projects/${project.id}`}
              className="group/link font-medium text-foreground transition-colors hover:text-primary"
            >
              <span className="whitespace-normal leading-snug line-clamp-2">
                {project.name}
              </span>
            </Link>
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {project.code}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "clientName",
      header: "Client",
      size: 150,
      cell: ({ row }) => {
        const name = row.getValue("clientName") as string | null
        return (
          <span className="text-sm text-muted-foreground">
            {name ?? <span className="text-muted-foreground/40">—</span>}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      size: 140,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
        if (!config) return <span>{status}</span>

        return (
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 border font-medium",
              config.className
            )}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", config.dot)} />
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "montantTTC",
      header: "Montant TTC",
      size: 160,
      cell: ({ row }) => {
        const amount = row.getValue("montantTTC") as number
        return (
          <span className="text-right font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(amount)}
          </span>
        )
      },
    },
    {
      accessorKey: "progress",
      header: "Progression",
      size: 160,
      cell: ({ row }) => {
        const progress = row.getValue("progress") as number
        const colorClass =
          progress === 100
            ? "text-emerald-600 dark:text-emerald-400"
            : progress >= 70
              ? "text-blue-600 dark:text-blue-400"
              : progress >= 40
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"

        return (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2 flex-1" />
            <span
              className={cn(
                "shrink-0 text-xs font-semibold tabular-nums",
                colorClass
              )}
            >
              {progress}%
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "ods",
      header: "ODS",
      size: 120,
      cell: ({ row }) => {
        const ods = row.getValue("ods") as Date | null
        return (
          <span className="text-sm text-muted-foreground">
            {ods ? formatDate(ods) : <span className="text-muted-foreground/40">—</span>}
          </span>
        )
      },
    },
    {
      id: "actions",
      size: 50,
      cell: ({ row }) => {
        const project = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/unite/${unitId}/projects/${project.id}`}>
                  <Eye className="mr-2 size-4" />
                  Voir
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/unite/${unitId}/projects/${project.id}?edit=true`}
                  >
                    <Pencil className="mr-2 size-4" />
                    Modifier
                  </Link>
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onArchive(project.id)}
                >
                  <Archive className="mr-2 size-4" />
                  Archiver
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

"use client"

import {
  useCallback,
  useState,
  useTransition,
  useMemo,
  useOptimistic,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updatePhase } from "@/actions/phase"
import { updateSubPhase } from "@/actions/subphase"
import {
  GanttProvider,
  GanttSidebar,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureItem,
  GanttMarker,
  GanttToday,
  GanttContext,
  type GanttFeature,
  type GanttStatus,
  type Range,
} from "@/components/kibo-ui/gantt"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronDown,
  ListTodo,
  FolderKanban,
} from "lucide-react"

const STATUS_MAP: Record<string, GanttStatus> = {
  New: {
    id: "new",
    name: "Nouveau",
    color: "hsl(var(--blue-500, #3b82f6))",
  },
  InProgress: {
    id: "in-progress",
    name: "En cours",
    color: "hsl(var(--emerald-500, #10b981))",
  },
  Pause: {
    id: "pause",
    name: "En pause",
    color: "hsl(var(--amber-500, #f59e0b))",
  },
  Complete: {
    id: "complete",
    name: "Terminé",
    color: "hsl(var(--slate-400, #94a3b8))",
  },
}

interface PhaseData {
  id: string
  name: string
  code: string
  startDate: Date | null
  endDate: Date | null
  status: string
  progress: number
  montantHT: number
  duration: number | null
  SubPhases: {
    id: string
    name: string
    code: string
    startDate: Date | null
    endDate: Date | null
    status: string
    progress: number
  }[]
}

interface MarkerData {
  id: string
  label: string
  date: Date
  className?: string
}

interface ProjectGanttProps {
  phases: PhaseData[]
  markers: MarkerData[]
  canEdit: boolean
  projectId: string
  unitId: string
}

interface GanttPhaseFeature extends GanttFeature {
  code: string
  montantHT: number
  progress: number
  isSubPhase: boolean
  parentPhaseId: string | null
  subPhaseCount: number
}

export function ProjectGantt({
  phases,
  markers,
  canEdit,
  projectId: _projectId,
  unitId: _unitId,
}: ProjectGanttProps) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [range, setRange] = useState<Range>("monthly")
  const [selectedPhase, setSelectedPhase] = useState<PhaseData | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

  const togglePhaseExpansion = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }, [])

  const ganttFeatures: GanttPhaseFeature[] = useMemo(() => {
    const items: GanttPhaseFeature[] = []

    for (const phase of phases) {
      if (!phase.startDate || !phase.endDate) continue

      const status = STATUS_MAP[phase.status] ?? STATUS_MAP.New

      // Phase row
      items.push({
        id: phase.id,
        name: `${phase.code} — ${phase.name}`,
        startAt: phase.startDate,
        endAt: phase.endDate,
        status,
        code: phase.code,
        montantHT: phase.montantHT,
        progress: phase.progress,
        isSubPhase: false,
        parentPhaseId: null,
        subPhaseCount: phase.SubPhases.length,
      })

      // SubPhase rows (only if parent is expanded)
      if (expandedPhases.has(phase.id)) {
        for (const sub of phase.SubPhases) {
          if (!sub.startDate || !sub.endDate) continue

          const subStatus =
            sub.status === "COMPLETED" ? STATUS_MAP.Complete : STATUS_MAP.New

          items.push({
            id: sub.id,
            name: `${sub.code} — ${sub.name}`,
            startAt: sub.startDate,
            endAt: sub.endDate,
            status: subStatus,
            code: sub.code,
            montantHT: 0,
            progress: sub.progress,
            isSubPhase: true,
            parentPhaseId: phase.id,
            subPhaseCount: 0,
          })
        }
      }
    }

    return items
  }, [phases, expandedPhases])

  // Optimistic updates
  const [optimisticFeatures, addOptimisticFeature] = useOptimistic(
    ganttFeatures,
    (
      state: GanttPhaseFeature[],
      action:
        | { type: "move"; id: string; startAt: Date; endAt: Date | null }
        | { type: "toggleStatus"; id: string; status: string }
    ) => {
      return state.map((f) => {
        if (f.id !== action.id) return f
        if (action.type === "move") {
          return {
            ...f,
            startAt: action.startAt,
            endAt: action.endAt ?? f.endAt,
          }
        }
        if (action.type === "toggleStatus") {
          const newStatusKey =
            action.status === "COMPLETED" ? "Complete" : "New"
          return {
            ...f,
            status: STATUS_MAP[newStatusKey] ?? STATUS_MAP.New,
          }
        }
        return f
      })
    }
  )

  // Handle drag-to-reschedule for both phases and subphases
  const handleMove = (id: string, startAt: Date, endAt: Date | null) => {
    if (!canEdit) return

    const isSubPhase = phases.some((p) =>
      p.SubPhases.some((sp) => sp.id === id)
    )

    // Apply optimistic update immediately
    addOptimisticFeature({ type: "move", id, startAt, endAt })

    startTransition(async () => {
      if (isSubPhase) {
        const result = await updateSubPhase({
          id,
          startDate: startAt,
          endDate: endAt,
        })
        if (result.success) {
          toast.success("Sous-phase mise à jour avec succès")
          router.refresh()
        } else {
          toast.error(result.error ?? "Erreur lors de la mise à jour")
          router.refresh()
        }
      } else {
        const result = await updatePhase({
          id,
          startDate: startAt,
          endDate: endAt,
        })
        if (result.success) {
          toast.success("Phase mise à jour avec succès")
          router.refresh()
        } else {
          toast.error(result.error ?? "Erreur lors de la mise à jour")
          router.refresh()
        }
      }
    })
  }

  const handleSubPhaseToggle = (subPhaseId: string, currentStatus: string) => {
    if (!canEdit) return

    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED"

    addOptimisticFeature({
      type: "toggleStatus",
      id: subPhaseId,
      status: newStatus,
    })

    startTransition(async () => {
      const result = await updateSubPhase({
        id: subPhaseId,
        status: newStatus,
      })
      if (result.success) {
        toast.success(
          newStatus === "COMPLETED"
            ? "Sous-phase marquée comme terminée"
            : "Sous-phase rouverte"
        )
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour")
        router.refresh()
      }
    })
  }

  const ranges: { key: Range; label: string }[] = [
    { key: "monthly", label: "Mois" },
    { key: "quarterly", label: "Trimestre" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {ranges.map(({ key, label }) => (
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ZoomOut className="size-3.5" />
          <span>Zoom</span>
          <ZoomIn className="size-3.5" />
        </div>
      </div>

      {/* Gantt Chart */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{ minHeight: 400 }}
      >
        <GanttProvider range={range}>
          {/* Sidebar */}
          <GanttSidebar>
            <GanttContext.Consumer>
              {(ganttContext) => (
                <div className="divide-y divide-border/50">
                  {optimisticFeatures
                    .filter((f) => !f.isSubPhase)
                    .map((feature) => {
                      const phase = phases.find((p) => p.id === feature.id)
                      const isExpanded = expandedPhases.has(feature.id)
                      const hasSubPhases = feature.subPhaseCount > 0

                      return (
                        <div key={feature.id}>
                          {/* Phase row */}
                          <div
                            role="button"
                            tabIndex={0}
                            className="relative flex cursor-pointer items-center gap-2 p-2.5 text-xs hover:bg-secondary"
                            style={{ height: "var(--gantt-row-height)" }}
                            onClick={() => {
                              ganttContext.scrollToFeature?.(feature)
                              setSelectedPhase(phase ?? null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                ganttContext.scrollToFeature?.(feature)
                                setSelectedPhase(phase ?? null)
                              }
                            }}
                          >
                            {/* Expand/collapse chevron */}
                            {hasSubPhases && (
                              <button
                                type="button"
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePhaseExpansion(feature.id)
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </button>
                            )}
                            {!hasSubPhases && <span className="w-3.5" />}

                            {/* Status dot */}
                            <div
                              className="pointer-events-none h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: feature.status.color,
                              }}
                            />

                            {/* Phase name */}
                            <p className="pointer-events-none flex-1 truncate text-left font-medium">
                              {feature.name}
                            </p>

                            {/* Subphase count badge */}
                            {hasSubPhases && (
                              <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                                {feature.subPhaseCount}
                              </span>
                            )}
                          </div>

                          {/* SubPhase rows (when expanded) */}
                          {isExpanded &&
                            optimisticFeatures
                              .filter(
                                (sf) =>
                                  sf.isSubPhase &&
                                  sf.parentPhaseId === feature.id
                              )
                              .map((subFeature) => {
                                const subPhase = phase?.SubPhases.find(
                                  (sp) => sp.id === subFeature.id
                                )
                                return (
                                  <div
                                    key={subFeature.id}
                                    role="button"
                                    tabIndex={0}
                                    className="relative flex cursor-pointer items-center gap-2 p-2.5 pl-8 text-xs hover:bg-secondary"
                                    style={{
                                      height: "var(--gantt-row-height)",
                                    }}
                                    onClick={() => {
                                      ganttContext.scrollToFeature?.(subFeature)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        ganttContext.scrollToFeature?.(
                                          subFeature
                                        )
                                      }
                                    }}
                                  >
                                    {/* Checkbox for COMPLETED/TODO toggle */}
                                    <Checkbox
                                      checked={
                                        subFeature.status.id === "complete"
                                      }
                                      onCheckedChange={() => {
                                        handleSubPhaseToggle(
                                          subFeature.id,
                                          subPhase?.status ?? "TODO"
                                        )
                                      }}
                                      className="shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    />

                                    {/* Subphase name */}
                                    <p
                                      className={cn(
                                        "pointer-events-none flex-1 truncate text-left",
                                        subFeature.status.id === "complete" &&
                                          "text-muted-foreground line-through"
                                      )}
                                    >
                                      {subFeature.name}
                                    </p>
                                  </div>
                                )
                              })}
                        </div>
                      )
                    })}
                </div>
              )}
            </GanttContext.Consumer>
          </GanttSidebar>

          {/* Timeline */}
          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              {optimisticFeatures.map((feature) => (
                <GanttFeatureItem
                  key={feature.id}
                  {...feature}
                  onMove={canEdit ? handleMove : undefined}
                  cardClassName={cn(
                    "border-2 backdrop-blur-sm",
                    feature.isSubPhase
                      ? feature.status.id === "complete"
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-sky-400/60 bg-sky-500/10"
                      : feature.status.id === "in-progress"
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : feature.status.id === "pause"
                          ? "border-amber-400/60 bg-amber-500/10"
                          : feature.status.id === "complete"
                            ? "border-slate-400/60 bg-slate-500/10"
                            : "border-blue-400/60 bg-blue-500/10",
                    feature.isSubPhase && "ml-6"
                  )}
                  cardStyle={{
                    borderLeftWidth: "3px",
                  }}
                >
                  <div className="flex w-full items-center gap-2">
                    {/* Icon */}
                    {feature.isSubPhase ? (
                      <ListTodo className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
                    )}

                    {/* Name */}
                    <span className="flex-1 truncate text-xs font-medium">
                      {feature.name}
                    </span>

                    {/* Duration for subphases */}
                    {feature.isSubPhase && (
                      <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                        (
                        {Math.ceil(
                          (feature.endAt.getTime() -
                            feature.startAt.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        j)
                      </span>
                    )}

                    {/* Progress badge for phases */}
                    {!feature.isSubPhase && (
                      <span className="shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                        {feature.progress}%
                      </span>
                    )}
                  </div>

                  {/* Progress overlay bar for phases */}
                  {!feature.isSubPhase && feature.progress > 0 && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[5px] opacity-20"
                      style={{
                        width: `${feature.progress}%`,
                        backgroundColor: feature.status.color,
                      }}
                    />
                  )}
                </GanttFeatureItem>
              ))}
            </GanttFeatureList>

            {/* Markers */}
            {markers.map((marker) => (
              <GanttMarker
                key={marker.id}
                id={marker.id}
                date={marker.date}
                label={marker.label}
                className={marker.className}
              />
            ))}
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      </div>

      {/* Phase Detail Sheet */}
      <Sheet
        open={!!selectedPhase}
        onOpenChange={(open) => !open && setSelectedPhase(null)}
      >
        <SheetContent side="right" className="sm:max-w-md">
          {selectedPhase && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedPhase.name}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      selectedPhase.status === "InProgress" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                      selectedPhase.status === "Complete" &&
                        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
                      selectedPhase.status === "Pause" &&
                        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
                      selectedPhase.status === "New" &&
                        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                    )}
                  >
                    {selectedPhase.status === "InProgress"
                      ? "En cours"
                      : selectedPhase.status === "Complete"
                        ? "Terminé"
                        : selectedPhase.status === "Pause"
                          ? "En pause"
                          : "Nouveau"}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Code
                  </span>
                  <span className="font-mono text-sm">
                    {selectedPhase.code}
                  </span>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Date de début
                  </span>
                  <span className="text-sm">
                    {selectedPhase.startDate
                      ? formatDate(selectedPhase.startDate)
                      : "—"}
                  </span>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Date de fin
                  </span>
                  <span className="text-sm">
                    {selectedPhase.endDate
                      ? formatDate(selectedPhase.endDate)
                      : "—"}
                  </span>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Durée
                  </span>
                  <span className="text-sm">
                    {selectedPhase.duration
                      ? `${selectedPhase.duration} jours`
                      : "—"}
                  </span>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Montant HT
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {formatCurrency(selectedPhase.montantHT)}
                  </span>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Progression
                  </span>
                  <span className="text-sm font-semibold">
                    {selectedPhase.progress}%
                  </span>
                </div>

                {selectedPhase.SubPhases.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Sous-phases</h4>
                      <div className="flex flex-col gap-2">
                        {selectedPhase.SubPhases.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                          >
                            <span className="flex-1 truncate">
                              {sub.code} — {sub.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-2 shrink-0 text-[10px]"
                            >
                              {sub.status === "COMPLETED"
                                ? "Terminé"
                                : "À faire"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

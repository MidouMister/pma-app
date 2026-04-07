"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updatePhase } from "@/actions/phase"
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureRow,
  GanttMarker,
  GanttToday,
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
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ZoomIn, ZoomOut } from "lucide-react"

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
}

export function ProjectGantt({ phases, markers, canEdit }: ProjectGanttProps) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [range, setRange] = useState<Range>("monthly")
  const [selectedPhase, setSelectedPhase] = useState<PhaseData | null>(null)

  // Map phases to GanttFeature items
  const ganttFeatures: GanttFeature[] = useMemo(() => {
    const features: GanttFeature[] = []

    for (const phase of phases) {
      if (!phase.startDate || !phase.endDate) continue

      const status = STATUS_MAP[phase.status] ?? STATUS_MAP.New

      // Phase as main feature
      features.push({
        id: phase.id,
        name: `${phase.code} — ${phase.name}`,
        startAt: phase.startDate,
        endAt: phase.endDate,
        status,
        lane: phase.id, // Each phase gets its own lane
      })

      // SubPhases as nested features
      for (const sub of phase.SubPhases) {
        if (!sub.startDate || !sub.endDate) continue

        const subStatus =
          sub.status === "COMPLETED" ? STATUS_MAP.Complete : STATUS_MAP.New

        features.push({
          id: sub.id,
          name: `${sub.code} — ${sub.name}`,
          startAt: sub.startDate,
          endAt: sub.endDate,
          status: subStatus,
          lane: phase.id, // Same lane as parent phase
        })
      }
    }

    return features
  }, [phases])

  // Group features by phase for sidebar
  const phaseGroups = useMemo(() => {
    return phases
      .filter((p) => p.startDate && p.endDate)
      .map((phase) => ({
        phase,
        features: ganttFeatures.filter((f) => f.lane === phase.id),
      }))
  }, [phases, ganttFeatures])

  // Handle drag-to-reschedule
  const handleMove = (id: string, startAt: Date, endAt: Date | null) => {
    if (!canEdit) return

    const isSubPhase = phases.some((p) =>
      p.SubPhases.some((sp) => sp.id === id)
    )

    // Only allow rescheduling phases (not subphases via this action)
    if (isSubPhase) return

    startTransition(async () => {
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
            {phaseGroups.map(({ phase, features }) => (
              <GanttSidebarGroup key={phase.id} name={phase.name}>
                {features.map((feature) => (
                  <GanttSidebarItem
                    key={feature.id}
                    feature={feature}
                    onSelectItem={() => {
                      // If it's a phase (not subphase), open the sheet
                      const parentPhase = phases.find(
                        (p) => p.id === feature.id
                      )
                      if (parentPhase) {
                        setSelectedPhase(parentPhase)
                      }
                    }}
                    className={cn(
                      !phases.some((p) => p.id === feature.id) && "pl-6"
                    )}
                  />
                ))}
              </GanttSidebarGroup>
            ))}
          </GanttSidebar>

          {/* Timeline */}
          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              {phaseGroups.map(({ phase, features }) => (
                <GanttFeatureRow
                  key={phase.id}
                  features={features}
                  onMove={canEdit ? handleMove : undefined}
                >
                  {(feature) => {
                    const isPhase = phases.some((p) => p.id === feature.id)
                    const phaseData = phases.find((p) => p.id === feature.id)
                    return (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="flex-1 truncate">
                          {isPhase ? feature.name : feature.name}
                        </span>
                        {isPhase && phaseData && (
                          <span className="shrink-0 text-[10px] font-medium text-muted-foreground tabular-nums">
                            {phaseData.progress}%
                          </span>
                        )}
                      </div>
                    )
                  }}
                </GanttFeatureRow>
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

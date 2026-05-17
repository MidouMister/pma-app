"use client"

import {
  GanttFeatureList,
  GanttFeatureItem,
  GanttHeader,
  GanttMarker,
  GanttToday,
  GanttCreateMarkerTrigger,
} from "@/components/kibo-ui/gantt"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { FolderKanban, ListTodo, Pencil, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type GanttPhaseFeature,
  type PhaseData,
  type MarkerData,
} from "@/lib/types"

export interface TimelineActions {
  onEditPhase: (phaseId: string) => void
  onEditSubPhase: (subPhaseId: string, parentPhaseId: string) => void
  onDeletePhase: (phaseId: string) => void
  onDeleteSubPhase: (subPhaseId: string) => void
  onAddSubPhase: (parentPhaseId: string) => void
  onCreateMarker: (date: Date) => void
  onEditMarker: (markerId: string) => void
  onDeleteMarker: (markerId: string) => void
  onMoveFeature: (id: string, startAt: Date, endAt: Date | null) => void
}

interface GanttTimelineContentProps {
  filteredFeatures: GanttPhaseFeature[]
  phases: PhaseData[]
  markers: MarkerData[]
  canEdit: boolean
  actions: TimelineActions
}

export function GanttTimelineContent({
  filteredFeatures,
  phases,
  markers,
  canEdit,
  actions,
}: GanttTimelineContentProps) {
  return (
    <>
      <GanttHeader />
      {canEdit && (
        <GanttCreateMarkerTrigger onCreateMarker={actions.onCreateMarker} />
      )}
      <GanttFeatureList>
        {filteredFeatures.map((feature) => {
          const isPhase = !feature.isSubPhase
          const phaseData = isPhase
            ? phases.find((p) => p.id === feature.id)
            : null

          return (
            <ContextMenu key={feature.id}>
              <ContextMenuTrigger asChild>
                <div
                  onClick={() => {
                    if (isPhase && phaseData) {
                      actions.onEditPhase(phaseData.id)
                    } else if (!isPhase) {
                      const parentPhase = phases.find((p) =>
                        p.SubPhases.some((sp) => sp.id === feature.id)
                      )
                      const subPhase = parentPhase?.SubPhases.find(
                        (sp) => sp.id === feature.id
                      )
                      if (subPhase) {
                        actions.onEditSubPhase(
                          subPhase.id,
                          feature.parentPhaseId ?? parentPhase?.id ?? ""
                        )
                      }
                    }
                  }}
                >
                  <GanttFeatureItem
                    {...feature}
                    onMove={canEdit ? actions.onMoveFeature : undefined}
                    cardClassName={cn("border-2 shadow-sm backdrop-blur-md")}
                    cardStyle={
                      feature.isSubPhase
                        ? {
                            borderLeftWidth: "3px",
                            borderColor:
                              feature.status.id === "complete"
                                ? "rgb(148 163 184 / 0.5)"
                                : "rgb(56 189 248 / 0.6)",
                            background:
                              feature.status.id === "complete"
                                ? "linear-gradient(to right, color-mix(in srgb, rgb(148, 163, 184) 15%, transparent), color-mix(in srgb, rgb(148, 163, 184) 5%, transparent))"
                                : "linear-gradient(to right, color-mix(in srgb, rgb(56, 189, 248) 20%, transparent), color-mix(in srgb, rgb(56, 189, 248) 5%, transparent))",
                          }
                        : {
                            borderLeftWidth: "3px",
                            borderColor: "rgb(148 117 240 / 0.6)",
                            background:
                              "linear-gradient(to right, color-mix(in srgb, rgb(148, 117, 240) 20%, transparent), color-mix(in srgb, rgb(148, 117, 240) 5%, transparent))",
                          }
                    }
                  >
                    <div className="flex w-full items-center gap-1.5">
                      {/* Icon */}
                      {feature.isSubPhase ? (
                        <ListTodo className="size-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <FolderKanban className="size-3 shrink-0 text-muted-foreground" />
                      )}

                      {/* Name */}
                      <span className="flex-1 truncate text-[11px] font-medium tracking-tighter">
                        <span className="mr-1.5 font-bold opacity-70">
                          {feature.code}
                        </span>
                        {feature.name}
                      </span>

                      {/* Duration for subphases */}
                      {feature.isSubPhase && (
                        <span className="shrink-0 text-[10px] tracking-tighter text-muted-foreground tabular-nums">
                          {Math.ceil(
                            (feature.endAt.getTime() -
                              feature.startAt.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          j
                        </span>
                      )}

                      {/* Progress badge for phases */}
                      {!feature.isSubPhase && (
                        <span className="shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-tighter tabular-nums">
                          {feature.progress}%
                        </span>
                      )}
                    </div>

                    {/* Progress overlay bar for phases */}
                    {!feature.isSubPhase && feature.progress > 0 && (
                      <div
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[5px]"
                        style={{
                          width: `${feature.progress}%`,
                        }}
                      >
                        <div
                          className="size-full opacity-20"
                          style={{
                            background: `linear-gradient(to right, color-mix(in srgb, rgb(148, 117, 240) 60%, transparent), transparent)`,
                          }}
                        />
                      </div>
                    )}
                  </GanttFeatureItem>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {isPhase ? (
                  <>
                    <ContextMenuItem
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (!phaseData) return
                        actions.onEditPhase(phaseData.id)
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="flex items-center gap-2"
                      onClick={() => {
                        actions.onAddSubPhase(feature.id)
                      }}
                    >
                      <Plus className="size-4" />
                      Ajouter une sous-phase
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="flex items-center gap-2 text-destructive"
                      onClick={() => {
                        actions.onDeletePhase(feature.id)
                      }}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </ContextMenuItem>
                  </>
                ) : (
                  <>
                    <ContextMenuItem
                      className="flex items-center gap-2"
                      onClick={() => {
                        const parentPhase = phases.find((p) =>
                          p.SubPhases.some((sp) => sp.id === feature.id)
                        )
                        if (!parentPhase) return
                        actions.onEditSubPhase(feature.id, parentPhase.id)
                      }}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="flex items-center gap-2 text-destructive"
                      onClick={() => {
                        actions.onDeleteSubPhase(feature.id)
                      }}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </GanttFeatureList>

      {/* Markers */}
      {markers.map((marker) => {
        const markerColor = marker.className?.startsWith("color:")
          ? marker.className.slice(6)
          : undefined

        const openMarkerEdit = (id: string) => {
          actions.onEditMarker(id)
        }

        return (
          <GanttMarker
            key={marker.id}
            id={marker.id}
            date={marker.date}
            label={marker.label}
            color={markerColor}
            className={markerColor ? undefined : marker.className}
            onEdit={canEdit ? () => openMarkerEdit(marker.id) : undefined}
            onDoubleClick={
              canEdit ? () => openMarkerEdit(marker.id) : undefined
            }
            onRemove={
              canEdit
                ? () => {
                    actions.onDeleteMarker(marker.id)
                  }
                : undefined
            }
          />
        )
      })}
      <GanttToday />
    </>
  )
}

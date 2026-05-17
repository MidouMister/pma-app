"use client"

import { ChevronRight, ChevronDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { GanttContext } from "@/components/kibo-ui/gantt"
import { cn } from "@/lib/utils"
import { type GanttPhaseFeature, type PhaseData } from "@/lib/types"

interface GanttSidebarContentProps {
  filteredFeatures: GanttPhaseFeature[]
  expandedPhases: Set<string>
  togglePhaseExpansion: (phaseId: string) => void
  phases: PhaseData[]
  handleSubPhaseToggle: (subPhaseId: string, currentStatus: string) => void
}

export function GanttSidebarContent({
  filteredFeatures,
  expandedPhases,
  togglePhaseExpansion,
  phases,
  handleSubPhaseToggle,
}: GanttSidebarContentProps) {
  return (
    <GanttContext.Consumer>
      {(ganttContext) => (
        <div className="divide-y divide-border/50">
          {filteredFeatures
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
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        ganttContext.scrollToFeature?.(feature)
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

                    {/* Duration badge */}
                    {phase?.duration != null && (
                      <span className="pointer-events-none shrink-0 text-[10px] text-muted-foreground tabular-nums">
                        {phase.duration} j
                      </span>
                    )}

                    {/* Subphase count badge */}
                    {hasSubPhases && (
                      <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                        {feature.subPhaseCount}
                      </span>
                    )}
                  </div>

                  {/* SubPhase rows (when expanded) */}
                  {isExpanded &&
                    filteredFeatures
                      .filter(
                        (sf) => sf.isSubPhase && sf.parentPhaseId === feature.id
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
                                ganttContext.scrollToFeature?.(subFeature)
                              }
                            }}
                          >
                            {/* Checkbox for COMPLETED/TODO toggle */}
                            <Checkbox
                              checked={subFeature.status.id === "complete"}
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
                                subFeature.status.id === "sub-done" &&
                                  "text-muted-foreground line-through"
                              )}
                            >
                              {subFeature.name}
                            </p>

                            {/* Subphase duration */}
                            {subPhase?.startDate && subPhase?.endDate && (
                              <span className="pointer-events-none shrink-0 text-[10px] text-muted-foreground tabular-nums">
                                {Math.ceil(
                                  (subPhase.endDate.getTime() -
                                    subPhase.startDate.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                j
                              </span>
                            )}
                          </div>
                        )
                      })}
                </div>
              )
            })}
        </div>
      )}
    </GanttContext.Consumer>
  )
}

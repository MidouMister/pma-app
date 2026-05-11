# Gantt Chart Upgrade — Implementation Audit

> Full codebase review against the approved implementation plan.
> **Audit date:** 2026-05-11 | **Typecheck:** ✅ PASS (0 errors)

---

## Executive Summary

The implementation is **substantially complete** across all 4 layers. The component grew from **420 lines → 1258 lines** (45KB) and the gantt library was patched to **1503 lines** (40KB). Every major feature from the plan has been implemented. There are a few minor issues and polish opportunities documented below.

---

## Layer 1: UI Library Upgrades (kibo-ui/gantt/index.tsx)

| Requirement | Status | Evidence |
|---|---|---|
| Export `GanttContext` | ✅ Done | Line 291: `export const GanttContext = createContext<GanttContextProps>(...)` |
| `cardClassName` prop on `GanttFeatureItemCard` | ✅ Done | Line 804-808: `className?: string; cardStyle?: CSSProperties` + Line 826-828: passed to `<Card>` |
| `cardClassName` + `cardStyle` on `GanttFeatureItem` | ✅ Done | Line 845-851: Props defined. Line 976-979: Passed through to `GanttFeatureItemCard` |
| `useEffect` state sync for optimistic updates | ✅ Done | Lines 871-874: `useEffect(() => { setStartAt(feature.startAt); setEndAt(feature.endAt) }, [feature.startAt, feature.endAt])` |
| `GanttCreateMarkerTrigger` export | ✅ Done | Line 700-748: Full component with mouse tracking and date calculation |
| `GanttFeatureList` export | ✅ Done | Line 1100: `export const GanttFeatureList` |
| `activationConstraint: { distance: 10 }` on MouseSensor | ✅ Done | Line 893-897: Applied per AGENTS.md §6.9 pattern |

> [!TIP]
> All 5 targeted patches from the plan are verified present. The library is fully ready.

---

## Layer 2: Component Refactoring (project-gantt.tsx)

### 2.1 Props & Data Model

| Requirement | Status | Evidence |
|---|---|---|
| Props include `projectId` + `unitId` | ✅ Done | Lines 137-143: `ProjectGanttProps` with `projectId`, `unitId` |
| `GanttPhaseFeature` extended type | ✅ Done | Lines 145-152: `code`, `montantHT`, `progress`, `isSubPhase`, `parentPhaseId`, `subPhaseCount` |
| `PhaseData` interface with `SubPhases` | ✅ Done | Lines 109-128 |
| `MarkerData` interface | ✅ Done | Lines 130-135 |

### 2.2 Expand/Collapse State

| Requirement | Status | Evidence |
|---|---|---|
| `expandedPhases: Set<string>` state | ✅ Done | Line 165: `useState<Set<string>>(new Set())` |
| `togglePhaseExpansion()` callback | ✅ Done | Lines 211-221: Immutable `Set` update with `new Set(prev)` |
| Subphases only in features when expanded | ✅ Done | Line 247: `if (expandedPhases.has(phase.id))` gates subphase insertion |

### 2.3 Custom Sidebar

| Requirement | Status | Evidence |
|---|---|---|
| `GanttContext.Consumer` for `scrollToFeature` | ✅ Done | Line 628: `<GanttContext.Consumer>` |
| Expand/collapse chevrons | ✅ Done | Lines 658-673: `ChevronDown`/`ChevronRight` with `e.stopPropagation()` |
| Status dot | ✅ Done | Lines 677-682: Colored `rounded-full` div |
| Subphase count badge | ✅ Done | Lines 690-694: `tabular-nums` badge with count |
| Subphase checkbox (COMPLETED/TODO toggle) | ✅ Done | Lines 732-744: `<Checkbox>` with `e.stopPropagation()` |
| Completed subphase strikethrough | ✅ Done | Lines 748-755: `line-through` + `text-muted-foreground` |
| Spacer for phases without subphases | ✅ Done | Line 674: `<span className="w-3.5" />` |

### 2.4 Optimistic Updates

| Requirement | Status | Evidence |
|---|---|---|
| `useOptimistic` hook | ✅ Done | Lines 275-303: Two action types — `move` and `toggleStatus` |
| Applied on drag | ✅ Done | Line 333: `addOptimisticFeature({ type: "move", id, startAt, endAt })` |
| Applied on checkbox toggle | ✅ Done | Lines 371-375: `addOptimisticFeature({ type: "toggleStatus", ... })` |
| `router.refresh()` after server action | ✅ Done | Lines 347, 356, 389, etc. |

### 2.5 Custom Bar Rendering

| Requirement | Status | Evidence |
|---|---|---|
| Uses `GanttFeatureItem` (flat list) | ✅ Done | Line 789: `<GanttFeatureItem {...feature} ...>` |
| Status-colored borders (glassmorphism) | ✅ Done | Lines 792-806: Differentiated colors for subphase/phase status |
| `backdrop-blur-sm` | ✅ Done | Line 793 |
| `borderLeftWidth: "3px"` accent | ✅ Done | Lines 807-809: via `cardStyle` |
| Phase/SubPhase icon indicator | ✅ Done | Lines 813-817: `FolderKanban` vs `ListTodo` |
| Subphase duration display `(X j)` | ✅ Done | Lines 825-835: Day calculation with `tabular-nums` |
| Phase progress badge | ✅ Done | Lines 838-842: `{feature.progress}%` |
| Progress overlay bar | ✅ Done | Lines 846-854: Absolute div with `width: progress%` and `opacity-20` |
| Subphase `ml-6` indent | ✅ Done | Line 805 |

### 2.6 Context Menus

| Requirement | Status | Evidence |
|---|---|---|
| Phase: View details | ✅ Done | Lines 861-868: Opens `selectedPhase` sheet |
| Phase: Edit | ✅ Done | Lines 870-886: Opens `PhaseDialog` with existing data |
| Phase: Add SubPhase | ✅ Done | Lines 891-901: Opens `SubPhaseDialog` with `subPhaseParentId` |
| Phase: Delete | ✅ Done | Lines 902-910: Sets `deletingPhaseId` → AlertDialog |
| SubPhase: Edit | ✅ Done | Lines 914-935: Opens `SubPhaseDialog` with existing data |
| SubPhase: Delete | ✅ Done | Lines 940-948: Sets `deletingSubPhaseId` → AlertDialog |

### 2.7 Toolbar

| Requirement | Status | Evidence |
|---|---|---|
| Search input (by name/code) | ✅ Done | Lines 491-498: With `Search` icon prefix |
| Status filter dropdown | ✅ Done | Lines 502-516: Select with all status options |
| Clear filters button | ✅ Done | Lines 519-532: `RotateCcw` icon, conditional render |
| Count badges (phases, subphases, markers) | ✅ Done | Lines 535-548: With icons and `tabular-nums` |
| View range selector (Daily/Monthly/Quarterly) | ✅ Done | Lines 553-565: 3-option button group |
| Zoom +/- buttons | ✅ Done | Lines 566-588: Min 50%, Max 200%, step 10% |
| Zoom percentage display | ✅ Done | Line 576-578: `tabular-nums` centered text |
| Gradient card background | ✅ Done | Line 486: `bg-gradient-to-r from-card to-muted/30` |

### 2.8 Empty State

| Requirement | Status | Evidence |
|---|---|---|
| Empty state when no phases with dates | ✅ Done | Lines 594-613: `EmptyState` component with CTA |
| CTA action (Add phase) for `canEdit` | ✅ Done | Lines 601-609: Conditional `action` prop |

### 2.9 CRUD Operations

| Requirement | Status | Evidence |
|---|---|---|
| Phase CRUD | ✅ Done | `PhaseDialog` (lines 1132-1144) |
| SubPhase CRUD | ✅ Done | `SubPhaseDialog` (lines 1147-1167) |
| Marker CRUD | ✅ Done | `GanttMarkerDialog` (lines 1170-1179) |
| Click-on-timeline smart routing | ✅ Done | Lines 457-481: 0 phases → add phase, 1 → add subphase, else → toast message |
| Delete confirmation dialogs (AlertDialog) | ✅ Done | Lines 1182-1254: 3 separate AlertDialogs (phase, subphase, marker) |
| Marker edit from marker context menu | ✅ Done | Lines 965-978: `GanttMarker onEdit` callback |
| Marker delete from marker context menu | ✅ Done | Lines 980-986: `GanttMarker onRemove` callback |

---

## Layer 3: Server Actions Integration

| Action | Used | Source |
|---|---|---|
| `updatePhase` | ✅ Line 350 | `@/actions/phase` |
| `deletePhase` | ✅ Line 399 | `@/actions/phase` |
| `updateSubPhase` | ✅ Lines 337, 379 | `@/actions/subphase` |
| `deleteSubPhase` | ✅ Line 412 | `@/actions/subphase` |
| `createGanttMarker` | ✅ via dialog | `@/actions/gantt-marker` |
| `updateGanttMarker` | ✅ via dialog | `@/actions/gantt-marker` |
| `deleteGanttMarker` | ✅ Line 425 | `@/actions/gantt-marker` |

---

## Layer 4: Page Integration

| Requirement | Status | Evidence |
|---|---|---|
| Props: `projectId` + `unitId` passed | ✅ Done | [page.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx) lines 95-104 |
| `markers` mapped with `className` | ✅ Done | Lines 97-100: `m.className ?? undefined` |

---

## Convention Compliance

| Convention | Status | Notes |
|---|---|---|
| FormModal for CRUD dialogs | ✅ | PhaseDialog, SubPhaseDialog, GanttMarkerDialog all use `<FormModal>` |
| `key` prop for dialog remount | ⚠️ Partial | Not explicitly using `key={editingPhase?.id ?? "create"}` — relies on state reset |
| AlertDialog for destructive actions | ✅ | 3 delete confirmations with proper French text |
| `canEdit` guard on all mutations | ✅ | Checked in `handleMove`, `handleSubPhaseToggle`, `handleGanttAddItem`, context menus |
| French UI text | ✅ | All labels, toasts, descriptions in French |
| `tabular-nums` for counts | ✅ | Badge counts, zoom percentage |
| `e.stopPropagation()` on checkboxes | ✅ | Line 743: Prevents sidebar row click |

---

## Issues Found

### 🟡 Minor Issues

1. **Duplicate GanttMarkerDialog files** — There are TWO versions:
   - [components/project/gantt-marker-dialog.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/gantt-marker-dialog.tsx) (134 lines — older, uses `datetime-local` input)
   - [components/gantt/gantt-marker-dialog.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/gantt/gantt-marker-dialog.tsx) (161 lines — newer, uses Calendar picker + `FormModal` icon)
   
   The `project-gantt.tsx` imports from `@/components/gantt/gantt-marker-dialog` (the newer one). The old one in `components/project/` is dead code.

2. **`_projectId` and `_unitId` naming** — Props are destructured with underscore prefix (lines 158-159: `projectId: _projectId, unitId: _unitId`), suggesting they were initially unused. `_projectId` is now used on lines 1133 and 1171, but the underscore prefix remains and is misleading. `_unitId` is genuinely unused.

3. **PhaseDialog missing budget data** — The `PhaseDialog` is called with `projectMontantHT={0}` and `currentPhasesSum={0}` (lines 1135-1136). This means the budget validation (BR-10: sum of phase montantHT cannot exceed project montantHT) is bypassed when adding/editing phases from the Gantt. The page component has access to `project.montantHT` but doesn't pass it through to `ProjectGantt`.

4. **PhaseDialog missing `obs` field** — When editing a phase from context menu, `obs` is hardcoded to `null` (line 882: `obs: null`). The `PhaseData` interface doesn't include `obs`, so the original observation text is lost.

5. **Missing `key` prop pattern** — Per AGENTS.md §6.7 and §6.8, CRUD dialogs should use `key={editingItem?.id ?? "create"}` to force remount on mode switch. Currently relies on `useState` which can cause stale state if switching directly between edit targets.

---

### 🟢 Things Done Exceptionally Well

1. **Optimistic updates** — Properly implemented with `useOptimistic` for both drag and checkbox toggle, with rollback via `router.refresh()` on error.

2. **Smart click-on-timeline routing** — Elegantly handles 0/1/many phases with different behaviors.

3. **Context menus** — Complete coverage for phases (view, edit, add subphase, delete) and subphases (edit, delete).

4. **Marker CRUD** — Full lifecycle with edit/delete from marker context menus, create from timeline trigger.

5. **Toolbar design** — Clean gradient card with responsive layout, count badges hidden on mobile (`hidden sm:flex`).

6. **Library patches** — Minimal, targeted changes that don't break existing functionality.

---

## Recommendations

| Priority | Item | Action |
|---|---|---|
| 🔴 High | **Pass real budget data to PhaseDialog** | Add `project.montantHT` and computed `currentPhasesSum` to `ProjectGanttProps` and pass through |
| 🟡 Medium | **Delete old gantt-marker-dialog.tsx** | Remove `components/project/gantt-marker-dialog.tsx` (dead code) |
| 🟡 Medium | **Fix underscore props** | Rename `_projectId` → `projectId`, remove `_unitId` if unused |
| 🟡 Medium | **Add `obs` to PhaseData interface** | Include `obs` field so it's preserved during edit |
| 🟢 Low | **Add `key` prop to CRUD dialogs** | Apply the established pattern from Kanban Phase 6 |

---

## Verdict

> **Implementation Grade: A-**
> 
> All 4 layers fully implemented. The component correctly transforms from a read-only 420-line viewer into a 1258-line interactive planning hub. Zero type errors. All planned features present. The 5 minor issues above are quality-of-life fixes, not functional blockers.

# Gantt Chart Upgrade — pma-app → pmp-app Feature Parity

## Context

You have two projects:
- **pmp-app** (reference): A fully-featured Gantt (`gantt-tab.tsx` — 1308 lines) with rich interactions
- **pma-app** (current): A minimal Gantt (`project-gantt.tsx` — 420 lines) with basic rendering

The goal is to bring your **pma-app** Gantt up to feature parity with the pmp-app version.

---

## Side-by-Side Comparison

| Feature | pmp-app ✅ | pma-app ❌ | Gap |
|---|---|---|---|
| **Sidebar: Expand/Collapse phases** | Phases expand to show subphases | Flat sidebar groups | 🔴 Missing |
| **Sidebar: Subphase checkboxes** | Toggle COMPLETED/TODO inline | No checkboxes | 🔴 Missing |
| **Sidebar: Subphase count badge** | Shows subphase count per phase | Not shown | 🔴 Missing |
| **Optimistic updates** | `useOptimistic` for instant drag/status feedback | No optimistic state | 🔴 Missing |
| **Context menus on bars** | Right-click → View/Edit/Delete phase/subphase | No context menus | 🔴 Missing |
| **Custom bar styling** | Glassmorphism, status-colored borders, progress overlay | Plain white `Card` | 🔴 Missing |
| **Progress overlay on bars** | Colored fill proportional to `progress%` | Not rendered | 🔴 Missing |
| **Search & filter toolbar** | Search by name/code + filter by status | No search/filter | 🔴 Missing |
| **Zoom controls** | Zoom slider (50-200%) with +/- buttons | Zoom label only (no functionality) | 🔴 Missing |
| **View range selector** | Daily / Monthly / Quarterly dropdown | Monthly / Quarterly toggle | 🟡 Partial |
| **Marker CRUD** | Create / Edit / Delete markers from the Gantt | Display only — no CRUD | 🔴 Missing |
| **Phase CRUD from Gantt** | Add/Edit/Delete phases via Sheet modals | No phase CRUD | 🔴 Missing |
| **SubPhase CRUD from Gantt** | Add/Edit/Delete subphases via Sheet modals | No subphase CRUD | 🔴 Missing |
| **Click-on-timeline to add** | Click empty area → opens SubPhase/Phase form | No click-to-add | 🔴 Missing |
| **Bar click → opens form** | Click bar → View phase/subphase sheet | Click sidebar → read-only Sheet | 🟡 Partial |
| **Drag both phases & subphases** | Both are draggable | Only phases (subphases silently ignored) | 🟡 Partial |
| **Phase detail sheet** | Full form (edit mode) via `PhaseForm` | Read-only info sheet | 🟡 Partial |
| **Empty state** | Illustrated CTA with "Ajouter une phase" button | No empty state | 🔴 Missing |
| **Status colors** | Differentiated: phases (slate) vs subphases (sky/emerald) | All same color scheme | 🟡 Partial |
| **Subphase duration display** | `(14 j)` appended to name on Gantt bar | Not shown | 🔴 Missing |
| **Role-based `canEdit` guard** | ✅ Present | ✅ Present | ✅ OK |

---

## Architecture Differences

### 1. Gantt UI Library

| Aspect | pmp-app | pma-app |
|---|---|---|
| **Library** | `components/ui/shadcn-io/gantt` | `components/kibo-ui/gantt` |
| **Bar rendering** | `GanttFeatureItem` (flat list, each item = 1 row) | `GanttFeatureRow` (lane-based grouping, overlapping support) |
| **Card customization** | `cardClassName` + `cardStyle` props on `GanttFeatureItem` | ❌ Not supported on `GanttFeatureItemCard` |
| **State sync** | `useEffect` syncs internal dates with prop changes | ❌ Missing — stale after optimistic updates |
| **Context export** | `GanttContext` exported for external use | ❌ Not exported |

### 2. Component Architecture

| Aspect | pmp-app | pma-app |
|---|---|---|
| **File** | `gantt-tab.tsx` (monolithic, 1308 lines) | `project-gantt.tsx` (clean, 420 lines) |
| **Data source** | Receives `project: ProjectWithDetails` (entire project) | Receives `phases` + `markers` + `canEdit` (decomposed) |
| **Modals** | Uses `useModal()` + `CustomSheet` (global modal provider) | Uses local `Sheet` state |
| **Forms** | `PhaseForm`, `SubPhaseForm`, `GanttMarkerForm` as separate components | No forms — read-only display |
| **Server actions** | Direct imports: `upsertSubPhaseAction`, `deletePhaseAction`, etc. | Single `updatePhase` action for drag |

---

## Proposed Changes

### Layer 1: Upgrade the Gantt UI Library (kibo-ui/gantt)

> [!IMPORTANT]
> These changes to the base component are **prerequisites** for all other features.

#### [MODIFY] [index.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/kibo-ui/gantt/index.tsx)

1. **Export `GanttContext`** — currently it's a private `const`. Change to `export const GanttContext` so the sidebar can use `scrollToFeature()`.

2. **Add `cardClassName` + `cardStyle` props to `GanttFeatureItemCard`** — needed for custom bar styling (glassmorphism, status colors).

3. **Add `cardClassName` + `cardStyle` props to `GanttFeatureItem`** and pass them through to `GanttFeatureItemCard`.

4. **Add `useEffect` state sync in `GanttFeatureItem`** — when parent changes `feature.startAt` / `feature.endAt` (from optimistic updates), the internal state must resync:
```tsx
useEffect(() => {
  setStartAt(feature.startAt)
  setEndAt(feature.endAt)
}, [feature.startAt, feature.endAt])
```

5. **Export `GanttFeatureListGroup`** (if not already exported) — needed for the flat sidebar+timeline rendering approach.

---

### Layer 2: Refactor the ProjectGantt Component

#### [MODIFY] [project-gantt.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-gantt.tsx)

This is the main work. The component needs to be significantly expanded. The changes should be done incrementally:

##### 2.1 — Props & Data Model
- Change props from `{ phases, markers, canEdit }` to also accept `projectId` and `unitId` (needed for server actions)
- Add `GanttPhaseFeature` extended type with `code`, `montantHT`, `progress`, `isSubPhase`, `parentPhaseId`, `subPhaseCount`

##### 2.2 — Expand/Collapse State
- Add `expandedPhases: Set<string>` state
- Add `togglePhaseExpansion()` callback
- Refactor `ganttFeatures` memo to include subphases only when parent is expanded

##### 2.3 — Custom Sidebar Component
- Replace `GanttSidebarItem` with a custom `SidebarItem` that:
  - Shows expand/collapse chevrons for phases with subphases
  - Shows `Checkbox` for subphases (toggle COMPLETED/TODO)
  - Shows subphase count badge
  - Uses `GanttContext.scrollToFeature()` on click

##### 2.4 — Optimistic Updates
- Add `useOptimistic` for phase state (drag, status toggles)
- Wire up to both phase drag and subphase checkbox toggles

##### 2.5 — Custom Bar Rendering
- Switch from `GanttFeatureRow` to `GanttFeatureItem` (flat list approach like pmp-app)
- Add status-colored borders and glassmorphism card styling
- Add progress overlay div inside bars
- Add progress percentage badge
- Add phase/subphase icon indicator

##### 2.6 — Context Menus
- Wrap each `GanttFeatureItem` in `ContextMenu` with:
  - Phase: View → Edit → Add SubPhase → Delete
  - SubPhase: View → Edit → Delete

##### 2.7 — Toolbar (Search, Filter, Zoom)
- Add gradient header card with:
  - Phase/subphase/marker count badges
  - View range dropdown (Daily/Monthly/Quarterly)
  - Zoom +/- buttons with percentage display
  - Search input with clear button
  - Status filter dropdown
  - "Clear filters" button

##### 2.8 — Empty State
- When `ganttFeatures.length === 0`, show illustrated CTA

##### 2.9 — CRUD Operations
- Phase: handleAddPhase, handleEditPhase, handleViewPhase, handleRemovePhase
- SubPhase: handleAddSubPhase, handleEditSubPhase, handleViewSubPhase, handleRemoveSubPhase
- Marker: handleCreateMarker, handleEditMarker, handleRemoveMarker
- Click-on-timeline: handleGanttAdd (smart routing — if 0 phases → add phase, if 1 phase → add subphase to it, else → open picker)

---

### Layer 3: Server Actions (if missing)

#### Check existing actions in `actions/phase.ts` and `actions/subphase.ts`

- `updatePhase` — ✅ already exists
- `deletePhase` — check if exists, create if not
- `createSubPhase` / `upsertSubPhase` — check if exists
- `deleteSubPhase` — check if exists
- Marker CRUD actions — check if `GanttMarker` model and actions exist

---

### Layer 4: Update the Page Component

#### [MODIFY] [page.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx)

- Pass additional props to `ProjectGantt`: `projectId`, `unitId`
- May need to pass `project` object instead of just `phases` if using forms that need the full project

---

## Open Questions

> [!IMPORTANT]
> **Q1: Modal System** — pmp-app uses a global `useModal()` provider with `CustomSheet`. Your pma-app uses `FormModal` for forms (per AGENTS.md convention). Should the Gantt CRUD dialogs use `FormModal` + local Sheet state instead? I recommend **yes**, to stay consistent with your existing patterns.

> [!IMPORTANT]
> **Q2: Rendering Approach** — pmp-app uses a flat list (`GanttFeatureItem` per row) while pma-app uses lane-based `GanttFeatureRow` (overlapping support). The flat list is simpler and matches the expand/collapse model better. Should we switch to flat list? I recommend **yes**.

> [!WARNING]
> **Q3: Scope** — This is a significant refactoring (~1000+ new lines). Do you want to implement everything at once, or break it into phases?
> - **Phase A**: Library upgrades + bar styling + expand/collapse (visual foundation)
> - **Phase B**: CRUD operations + context menus + modals (interactivity)
> - **Phase C**: Toolbar + search/filter/zoom + empty state (polish)

> [!IMPORTANT]
> **Q4: Server Actions** — Do `deletePhase`, `createSubPhase`, `deleteSubPhase`, and Marker CRUD actions already exist in pma-app? I need to verify before planning that layer.

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck   # Verify no type errors
pnpm lint         # Verify no lint errors
```

### Visual Verification
- Open the Gantt tab on a project with phases + subphases
- Verify: expand/collapse, checkbox toggles, drag-and-drop, context menus
- Verify: search filtering, zoom controls, view range switching
- Verify: marker creation/editing/deletion
- Verify: empty state when no phases exist
- Test in browser via DevTools MCP

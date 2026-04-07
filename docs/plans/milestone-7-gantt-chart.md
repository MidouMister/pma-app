# Milestone 7: Gantt Chart Implementation Plan

This document outlines the approach for implementing Milestone 7 (Gantt Chart visualization) using `kibo-ui`.

## Proposed Changes

---

### [Installation & Dependencies]

We will install the `kibo-ui` Gantt component which integrates nicely with `shadcn` and Tailwind.

- **Command**: `npx shadcn add @kibo-ui/gantt`
- This will likely install required dependencies (like `dnd-kit` for drag and drop) and add the gantt component files to `components/ui/`.

---

### [Data Mapping & Components]

#### [NEW] `components/gantt/project-gantt.tsx`

We will replace the placeholder in `app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx` with this component.

- **Data Fetching**: It will use the existing `getGanttData(projectId)` from `lib/queries.ts`.
- **Data Mapping**:
  - `Phases` will map to main horizontal bars. Color-coded based on `status`.
  - `SubPhases` will be nested/indented bars under their corresponding phases.
  - `GanttMarkers` will map to vertical dashed lines.
  - "Today" marker will be dynamically injected.
- **Custom Features**:
  - **Progress Overlay**: A custom rendering logic or CSS overlay inside the Gantt item to represent the 0-100 `progress` field.
  - **Overrides**: Month / Week / Day zoom toggles using local state.
  - **Overlay warning**: We'll calculate overlaps before passing data; overlapping items will receive a visual warning class.
  - **Click Handler**: Clicking a phase bar will open the existing (or slightly modified) `PhaseDialog` inside a `Sheet` or an equivalent side sheet.

#### [MODIFY] `components/project/project-gantt-placeholder.tsx` (OR replace in page.tsx)

We will deprecate the placeholder and instantiate `<ProjectGantt projectId={project.id} />` in the `gantt` `<TabsContent>`.

---

### [Server Actions & Interactivity]

#### [MODIFY] `actions/phase.ts` (or `actions/gantt.ts`)

For drag-and-drop rescheduling (enabled for OWNER/ADMIN only):

- Instead of creating a new `updatePhaseSchedule`, we can utilize the existing `updatePhase(data)` inside `actions/phase.ts` because it inherently recalculates duration, prevents changes during read-only status, recalculates phase progress, and revalidates caches correctly.
- If `updatePhase` poses validation issues with single-field updates during drag, we will create a tailored `updatePhaseSchedule` action dedicated to date modifications.

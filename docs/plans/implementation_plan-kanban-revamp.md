# Kanban Revamp — Task Detail Modal, Card Redesign & Table View

## Problem

Clicking a task card opens the **edit form** (`TaskDialog`) instead of a detail view. The `TaskDetailSheet` (with comments/mentions) is unreachable. The card design needs modernizing, and users have no table/list alternative to the Kanban board.

## Decisions (confirmed)

- **Priority** → Use existing **Tags** as visual priority indicators (no schema change)
- **Subtask progress** → Skipped (not applicable to current data model)
- **Links count** → Skipped (no task-links feature)
- **Modal type** → New **`DetailModal`** wrapper (not FormModal)

---

## Proposed Changes

### Component 1 — DetailModal Wrapper

#### [NEW] `components/shared/detail-modal.tsx`

Reusable modal for **read/detail views**. Same visual language as `FormModal` (gradient accent bar, icon, separator) but **no** `<form>` wrapper, no submit/cancel buttons.

```tsx
interface DetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode          // Status badge (lane name)
  headerActions?: ReactNode  // Edit, Complete, Delete buttons
  size?: 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  children: ReactNode
}
```

**Design:**
- Gradient accent bar at top (consistent with FormModal)
- Header: icon + title + subtitle + badge + action buttons row
- `Separator` below header
- Scrollable content area (`max-h-[90vh]`, internal overflow)
- Size presets matching FormModal's `SIZE_MAP`

---

### Component 2 — TaskDetailModal (replaces TaskDetailSheet)

#### [NEW] `components/kanban/task-detail-modal.tsx`

Full task detail view inside `DetailModal`. Replaces `task-detail-sheet.tsx`.

**Header Zone:**
- Badge: lane name with colored dot (e.g. `● En cours`)
- Action buttons: Edit (pencil → opens `TaskDialog`), Complete toggle, Delete (with AlertDialog)
- Title: large, editable inline (saves on blur)
- Breadcrumb: `Project › Phase › SubPhase`

**Content — Two-column layout (`lg+`), stacks on mobile:**

```
┌──────────────────────────────────────────────────┐
│  ● En cours          [✏️ Modifier] [✅] [🗑️]    │
│  Task Title (editable)                            │
│  Project › Phase › SubPhase                       │
├──────────────────────────────────────────────────┤
│                         │                         │
│  📝 Description         │  👤 Assigné à           │
│  ┌─────────────────┐   │     Ahmed B.             │
│  │ editable area   │   │                         │
│  └─────────────────┘   │  📅 Date début           │
│                         │     12 mars 2026         │
│  ┌─ Tabs ──────────┐   │                         │
│  │ Activité │ Temps │   │  📅 Échéance             │
│  ├──────────────────┤   │     ⚠ En retard          │
│  │                  │   │                         │
│  │  Comment input   │   │  📊 Colonne              │
│  │  Comment list    │   │     [Select]             │
│  │                  │   │                         │
│  │                  │   │  🏷️ Tags                 │
│  │                  │   │     [badge] [badge] [+]  │
│  │                  │   │                         │
│  └──────────────────┘   │  📁 Projet               │
│                         │     Construction X       │
│                         │  📋 Phase                 │
│                         │     Fondations           │
└─────────────────────────┴─────────────────────────┘
```

**Left column (≈60%):**
1. **Description** — `AlignLeft` icon + label + editable `Textarea` (saves on blur), subtle `bg-muted/5` background
2. **Tabs** (reuses existing shadcn `Tabs`):
   - **Activité** — Reuses `TaskComments` component (comment input + list)
   - **Temps** — Reuses `TaskTimeEntries` component

**Right column (≈40%) — Metadata sidebar card:**
- Container: `rounded-xl border bg-muted/5 p-5` with `space-y-5`
- Each row: icon (muted) + label (uppercase, tiny, muted) + value/widget
- Rows:

| Icon | Label | Widget |
|------|-------|--------|
| `User` | Assigné à | Avatar + Select dropdown |
| `CalendarDays` | Date début | Date display / picker |
| `CalendarClock` | Échéance | Color-coded date (red=overdue, green=today, muted=future) / picker |
| `Columns3` | Colonne | Lane select with colored dot |
| `Tag` | Tags | Colored badge chips + Popover "Ajouter" |
| `FolderKanban` | Projet | Read-only text |
| `Layers` | Phase | Read-only text |

**Data fetching:** Same `getTaskDetailsData` action used by current Sheet. Called on open via `useEffect`.

**State management:** Same pattern as current `task-detail-sheet.tsx` — local state for title, description, dueDate, newComment + `useTransition` for mutations.

---

### Component 3 — Task Card Redesign

#### [MODIFY] `components/kanban/task-card.tsx`

Redesign to match the reference photo:

```
┌─────────────────────────────────────┐
│ ● En cours                    ⋯     │  Status badge + kebab menu
│                                     │
│ Mobile App Bug Fixing               │  Title (bold, text-base)
│ Identify and fix bugs in the...     │  Description (1 line, muted)
│                                     │
│ Assigné :               [👤]       │  Label + avatar (right-aligned)
│                                     │
│ 🏳 07 avr 2023         [Urgent]     │  Due date + first tag as badge
│                                     │
│ 💬 6 Commentaires                   │  Comment count footer
└─────────────────────────────────────┘
```

**Structural changes:**
- **Remove** left colored border (`border-l-[3px]`)
- **Add** status badge row: colored dot + lane name (top-left), kebab menu (top-right, always visible)
- **Title**: `text-base font-semibold` (larger than current `text-sm`)
- **Description**: always shown (1-line clamp, `text-xs text-muted-foreground`)
- **Assignee row**: "Assigné :" label + single avatar (right-aligned)
- **Date + Tag row**: flag icon + formatted date (left), first tag as colored badge (right)
- **Footer**: `MessageSquare` icon + comment count (`💬 N Commentaires`)
- **Remove** inline checkbox (complete toggle moves to detail modal + hover actions)
- **Completed state**: full card `opacity-50`, title strikethrough, badge shows "Terminé" in green
- **Hover**: `hover:-translate-y-1 hover:shadow-lg transition-all duration-200`
- **Card background**: clean white/card, `rounded-xl border`, subtle shadow

**Data requirement:**
- `commentCount` field (from `_count.TaskComment` in query)

---

### Component 4 — Task Table View

#### [NEW] `components/kanban/task-table.tsx`

Table/list view using existing `DataTable` + `@tanstack/react-table`.

**Columns:**

| Column | Content | Sortable |
|--------|---------|----------|
| Statut | Colored dot + lane name | ✅ |
| Titre | Task title (clickable → opens detail modal) | ✅ |
| Projet | Project name | ✅ |
| Phase | Phase name | ✅ |
| Assigné | Avatar + name | ✅ |
| Échéance | Color-coded date (overdue/today/upcoming) | ✅ |
| Tags | Colored badge chips (max 2, "+N" overflow) | ❌ |
| Terminé | Checkbox toggle | ❌ |
| Actions | Edit + Delete icon buttons | ❌ |

**Features:**
- Row click opens detail modal (except on action buttons)
- Passes same `onEdit`, `onDelete`, `onComplete` callbacks as Kanban
- Uses existing `DataTable` pagination and sorting
- Same search/filter state as Kanban (shared from `UnitKanban`)

---

### Component 5 — View Toggle + Click Handler Fix

#### [MODIFY] `components/kanban/unit-kanban.tsx`

**View toggle:**
- Add `viewMode` state: `'kanban' | 'table'` (default: `'kanban'`)
- Add toggle buttons in filter bar (right side, before "Colonne" button):
  - `LayoutGrid` icon for Kanban (active = primary bg)
  - `List` icon for Table (active = primary bg)
- Conditionally render `<KanbanProvider>` or `<TaskTable>` based on `viewMode`

**Click handler fix:**
- Change `onClick={() => handleEdit(task)}` → `onClick={() => setSelectedTask(task)}`
- Replace `<TaskDetailSheet>` with `<TaskDetailModal>`
- Edit button (pencil icon on card + Edit button in detail modal header) → `handleEdit(task)` → opens `TaskDialog`

---

### Component 6 — Query & Page Updates

#### [MODIFY] `lib/queries.ts`

Add comment count to `getUnitTasks`:

```diff
  return prisma.task.findMany({
    where: { unitId },
    include: {
      Assigned: { select: { id: true, name: true, avatarUrl: true } },
      Tags: true,
      Phase: { select: { id: true, name: true } },
      subPhase: { select: { id: true, name: true } },
+     _count: { select: { TaskComment: true } },
    },
    orderBy: { order: "asc" },
  })
```

#### [MODIFY] `app/(dashboard)/unite/[unitId]/tasks/page.tsx`

Map `_count.TaskComment` → `commentCount` in the kanban task data:

```diff
  const kanbanTasks = tasks.map((t) => ({
    // ... existing fields
+   commentCount: t._count?.TaskComment ?? 0,
  }))
```

---

## File Summary

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `components/shared/detail-modal.tsx` | Reusable detail view modal wrapper |
| **NEW** | `components/kanban/task-detail-modal.tsx` | Task detail view with comments/metadata |
| **NEW** | `components/kanban/task-table.tsx` | Table/list view for tasks |
| **MODIFY** | `components/kanban/task-card.tsx` | Card redesign (reference photo style) |
| **MODIFY** | `components/kanban/unit-kanban.tsx` | Click fix + view toggle + DetailModal |
| **MODIFY** | `lib/queries.ts` | Add `_count.TaskComment` to task query |
| **MODIFY** | `app/(dashboard)/unite/[unitId]/tasks/page.tsx` | Map `commentCount` |
| **KEEP** | `components/kanban/task-comments.tsx` | Reused inside detail modal |
| **KEEP** | `components/kanban/task-time-entries.tsx` | Reused inside detail modal |
| **KEEP** | `components/kanban/task-metadata.tsx` | Logic reused in detail modal sidebar |
| **DEPRECATE** | `components/kanban/task-detail-sheet.tsx` | Replaced by `task-detail-modal.tsx` |

---

## Execution Order

1. `detail-modal.tsx` — Foundation wrapper (no dependencies)
2. `queries.ts` + `page.tsx` — Add `commentCount` to data pipeline
3. `task-card.tsx` — Card redesign (uses `commentCount`)
4. `task-detail-modal.tsx` — Detail view (reuses existing sub-components)
5. `task-table.tsx` — Table view (uses same data + callbacks)
6. `unit-kanban.tsx` — Wire everything: click handler, view toggle, new components

---

## Verification Plan

### Automated
```bash
pnpm typecheck   # 0 errors
pnpm lint         # 0 errors
pnpm build        # All pages compile
```

### Browser Tests (Devtools MCP)
1. Card click → Detail modal opens (not edit form)
2. Detail modal → Activité tab shows comment input + list, can type `@mention`
3. Detail modal → Edit button opens TaskDialog
4. Detail modal → Metadata sidebar shows assignee, dates, tags, lane
5. Card design → Status badge, description, assignee, date, tags, comment count
6. View toggle → Switch between Kanban board and Table
7. Table view → Row click opens detail modal, sorting/pagination works
8. Responsive → Modal stacks to single column on mobile

# Kanban Board — Deep Analysis & Improvement Plan

> **Date:** 2026-05-10
> **Scope:** Full audit of the Kanban feature — `unit-kanban.tsx`, `task-dialog.tsx`, `task-card.tsx`, `lane-dialog.tsx`, `task-detail-sheet.tsx`, `kibo-ui/kanban/index.tsx`, `actions/task.ts`, `actions/lane.ts`, `page.tsx`

---

## Part 1 — Bugs Found

### 🔴 BUG-1: Task form shows stale data when editing (CRITICAL)

**Symptom:** When clicking "Edit" on a task card, the dialog opens but shows data from the _previous_ form session instead of the clicked task's actual details.

**Root Cause:** `formData` and `selectedTagIds` are initialized with `useState(() => ...)` — this initializer only runs **once** when the component mounts. Since `TaskDialog` is rendered permanently in `unit-kanban.tsx` (lines 734–778) and never unmounted, subsequent changes to the `task` prop do **NOT** re-initialize the state.

```tsx
// task-dialog.tsx lines 115-141 — runs once on mount, never again
const [formData, setFormData] = useState(() => {
  return {
    title: task?.title ?? "",
    // ...
  }
})

// task-dialog.tsx lines 143-145 — also runs once
const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
  return task?.Tags?.map((t) => t.id) ?? []
})
```

When you:
1. Click "Add task" in lane A → form opens empty (correct)
2. Fill in title="Task X", select project → submit
3. Click "Edit" on an existing task → form still shows "Task X" instead of the task's real data

**Fix:** Add a `useEffect` that resets `formData` and `selectedTagIds` whenever the `task` prop or `open` state changes. Also add an `onReset` callback for when the dialog closes.

---

### 🔴 BUG-2: Edit/Delete buttons on task cards have unreliable click behavior

**Symptom:** The hover edit/delete buttons on task cards sometimes don't fire their handlers, or clicking them also opens the task detail sheet simultaneously.

**Root Cause (partially fixed, still fragile):** While the `activationConstraint: { distance: 5 }` was added to the sensors (good), there's a second issue: the `KanbanCard` component in `kibo-ui/kanban/index.tsx` spreads `{...listeners}` on the outer `<div>` (line 135-136). These dnd-kit listeners intercept `onPointerDown` events on all children, including the edit/delete buttons. Even with the 5px constraint, if the user's pointer moves slightly during the click, the drag takes over and swallows the event.

Additionally, `e.stopPropagation()` on the buttons (lines 184-186 in `task-card.tsx`) prevents the card's `onClick` from firing, but it does NOT prevent the dnd-kit listener on the parent `<div>` from capturing the `pointerdown` event — those are registered at a different level.

**Fix:** The dnd-kit wrapper should use a **drag handle** approach instead of making the entire card draggable. Alternatively, increase the activation constraint or add `data-no-dnd` attributes on interactive zones.

---

### 🟡 BUG-3: Lane column options button never becomes visible

**Symptom:** The lane header's "⋮" options button (Edit/Delete lane) has `opacity-0 group-hover:opacity-100`, but the parent `KanbanBoard` doesn't have the `group` class, so `group-hover` never triggers.

**Root Cause:** In `unit-kanban.tsx` line 582-586:
```tsx
<KanbanBoard
  key={lane.id}
  id={lane.id}
  className="w-[300px] shrink-0 overflow-visible"
>
```
Missing `group` class. The button at line 606 relies on `group-hover:opacity-100`.

**Fix:** Add `group` to `KanbanBoard`'s className.

---

### 🟡 BUG-4: LaneDialog has stale form data on edit

**Symptom:** Same pattern as BUG-1. `LaneDialog` initializes `formData` with `useState` once. When `editingLane` changes, the form doesn't update.

**Root Cause:** `lane-dialog.tsx` lines 45-48:
```tsx
const [formData, setFormData] = useState({
  name: lane?.name ?? "",
  color: lane?.color ?? "#6366f1",
})
```
No `useEffect` to sync when `lane` prop changes.

---

### 🟡 BUG-5: Tag badges show `null` for newly created tags

**Symptom:** In the tag chip display (lines 757-794 of `task-dialog.tsx`), tags created inline are looked up from `availableTags` (the prop), but newly created tags only exist in `localTags` (state). The lookup uses `availableTags?.find(...)` instead of `localTags.find(...)`.

```tsx
// line 760 — wrong source
const tag = availableTags?.find((t) => t.id === tagId)
```

**Fix:** Change to `localTags.find(...)` since `localTags` is the superset.

---

## Part 2 — Design Violations (Forms)

### 🔴 VIOLATION-1: TaskDialog uses raw `<Dialog>` instead of `<FormModal>`

The project convention (established by `project-dialog.tsx`, `phase-dialog.tsx`, `subphase-dialog.tsx`, `client-dialog.tsx`, `gantt-marker-dialog.tsx`) is that **all forms** must use the shared `<FormModal>` component.

**Current state (`task-dialog.tsx`):** Builds its own `<Dialog>` + `<DialogHeader>` + `<DialogFooter>` + `<form>` manually. This means:
- No gradient accent header
- No icon support
- No separator between header/body/footer
- No consistent spinner/button styling
- No `onReset` cleanup hook
- Inconsistent max-width (`sm:max-w-2xl` vs `FormModal`'s size system)

**Required refactor:** Rewrite to use `<FormModal>` + `<FormSection>` for the 4 logical sections.

---

### 🔴 VIOLATION-2: LaneDialog uses raw `<Dialog>` instead of `<FormModal>`

Same issue. `lane-dialog.tsx` builds its own dialog shell manually.

---

## Part 3 — Architecture Issues

### 🟡 ARCH-1: Single TaskDialog instance shared for Create AND Edit

`unit-kanban.tsx` renders ONE `<TaskDialog>` at lines 734-778 and toggles between create/edit by setting `editingTask`. This creates the stale-state problem (BUG-1) because React doesn't remount the component when switching modes — it just changes the prop.

**Better approach:** Either:
- **(A)** Add a `key` prop that forces a remount: `key={editingTask?.id ?? "create"}`
- **(B)** Add proper `useEffect` synchronization in `TaskDialog`

Option (A) is cleaner and eliminates the entire class of stale-state bugs. Option (B) is more granular but error-prone.

---

### 🟡 ARCH-2: Form state reset not handled on close

When the dialog closes (via cancel or `onOpenChange(false)`), the form state is never reset. If the user:
1. Opens "New task" → fills in title "Hello" → cancels
2. Opens "New task" again → still shows "Hello"

The `FormModal` component has built-in `onReset` support for exactly this case.

---

### 🟡 ARCH-3: Keyboard shortcut (Ctrl+Enter) duplicates submit logic

`task-dialog.tsx` lines 234-268 duplicate the entire submit flow in a `useEffect` keyboard listener. With `FormModal`, the form's native `submit` event would handle this more cleanly.

---

## Part 4 — Improvement Plan

### Step 1: Fix stale form data (BUG-1, BUG-4, ARCH-1, ARCH-2)

**Files:** `unit-kanban.tsx`, `task-dialog.tsx`, `lane-dialog.tsx`

1. In `unit-kanban.tsx`, add a `key` prop to `<TaskDialog>`:
   ```tsx
   <TaskDialog
     key={editingTask?.id ?? `create-${taskDialogLaneId ?? "none"}`}
     // ... rest of props
   />
   ```
   This forces React to unmount/remount the component when switching between create and edit, giving us fresh `useState` initialization every time.

2. Same for `<LaneDialog>`:
   ```tsx
   <LaneDialog
     key={editingLane?.id ?? "create"}
     // ... rest of props
   />
   ```

3. In `task-dialog.tsx`, add a reset function that clears all form state when the dialog closes (wired to `FormModal`'s `onReset`).

---

### Step 2: Migrate TaskDialog to FormModal + FormSection (VIOLATION-1)

**Files:** `task-dialog.tsx`

Refactor the component to use the shared `<FormModal>` wrapper:

```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title={isEdit ? "Modifier la tâche" : "Nouvelle tâche"}
  description={isEdit ? "Modifiez les détails de la tâche" : "Créez une nouvelle tâche"}
  icon={<ClipboardList className="size-5" />}
  size="lg"
  isPending={isPending}
  onSubmit={handleSubmit}
  onReset={resetForm}
  submitLabel={isEdit ? "Enregistrer" : "Créer"}
  submitPendingLabel={isEdit ? "Enregistrement..." : "Création..."}
>
  <div className="flex flex-col gap-8">
    <FormSection number="1" title="Informations">
      {/* Title + Description */}
    </FormSection>
    <FormSection number="2" title="Localisation du projet" icon={<MapPin />}>
      {/* Project, Phase, SubPhase */}
    </FormSection>
    <FormSection number="3" title="Planification" icon={<CalendarIcon />}>
      {/* Start, Due, End dates */}
    </FormSection>
    <FormSection number="4" title="Attribution" icon={<Users />}>
      {/* Lane, Assignee, Tags */}
    </FormSection>
  </div>
</FormModal>
```

This gives us:
- ✅ Gradient accent header
- ✅ Icon in header
- ✅ Consistent separator styling
- ✅ Built-in spinner on submit button
- ✅ Built-in `onReset` cleanup
- ✅ Consistent size system (`lg` = `sm:max-w-3xl`)
- ✅ Numbered form sections with visual hierarchy

---

### Step 3: Migrate LaneDialog to FormModal (VIOLATION-2)

**Files:** `lane-dialog.tsx`

Same refactor — simpler since it only has 2 fields (name + color).

```tsx
<FormModal
  open={isOpen}
  onOpenChange={handleOpenChange}
  title={isEdit ? "Modifier la colonne" : "Nouvelle colonne"}
  icon={<Columns3 className="size-5" />}
  size="sm"
  isPending={isPending}
  onSubmit={handleSubmit}
  onReset={resetForm}
>
  {/* Name + Color fields */}
</FormModal>
```

---

### Step 4: Fix tag badge lookup (BUG-5)

**Files:** `task-dialog.tsx`

Change line 760 from:
```tsx
const tag = availableTags?.find((t) => t.id === tagId)
```
to:
```tsx
const tag = localTags.find((t) => t.id === tagId)
```

---

### Step 5: Fix lane options visibility (BUG-3)

**Files:** `unit-kanban.tsx`

Add `group` class to `KanbanBoard`:
```tsx
<KanbanBoard
  key={lane.id}
  id={lane.id}
  className="group w-[300px] shrink-0 overflow-visible"
>
```

---

### Step 6: Improve card button reliability (BUG-2)

**Files:** `task-card.tsx`, `kibo-ui/kanban/index.tsx`

1. Add `data-no-dnd="true"` attribute to the hover action buttons container in `task-card.tsx`:
   ```tsx
   <div
     className="absolute top-2 right-2 hidden gap-1 ..."
     data-no-dnd="true"
   >
   ```

2. In `kibo-ui/kanban/index.tsx`, configure the sensors to ignore elements with `data-no-dnd`:
   ```tsx
   useSensor(MouseSensor, {
     activationConstraint: { distance: 5 },
   })
   ```
   The distance constraint is already in place. Additionally, we can add `onPointerDown` prevention on the button wrappers to ensure dnd-kit doesn't capture those events.

---

### Step 7: Remove duplicate keyboard shortcut logic (ARCH-3)

**Files:** `task-dialog.tsx`

Since `FormModal` wraps children in a `<form>`, Ctrl+Enter can trigger form submission natively. Remove the manual `useEffect` keyboard listener and replace with a simpler approach:

```tsx
onKeyDown={(e) => {
  if (e.ctrlKey && e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    e.currentTarget.requestSubmit()
  }
}}
```

This eliminates the duplicated submit logic and the large dependency array.

---

## Part 5 — Execution Order

| #   | Task                                        | Files                                | Priority | Risk |
|-----|---------------------------------------------|--------------------------------------|----------|------|
| 1   | Add `key` to TaskDialog & LaneDialog        | `unit-kanban.tsx`                    | 🔴 HIGH  | Low  |
| 2   | Fix tag badge lookup (`localTags`)          | `task-dialog.tsx`                    | 🔴 HIGH  | Low  |
| 3   | Add `group` class to KanbanBoard            | `unit-kanban.tsx`                    | 🟡 MED   | Low  |
| 4   | Migrate LaneDialog → FormModal              | `lane-dialog.tsx`                    | 🟡 MED   | Low  |
| 5   | Migrate TaskDialog → FormModal+FormSection  | `task-dialog.tsx`                    | 🔴 HIGH  | Med  |
| 6   | Add `data-no-dnd` to card action buttons    | `task-card.tsx`                      | 🟡 MED   | Low  |
| 7   | Simplify Ctrl+Enter keyboard handling       | `task-dialog.tsx`                    | 🟢 LOW   | Low  |
| 8   | Browser verification + regression test      | _(manual)_                           | 🔴 HIGH  | —    |

**Estimated impact:**
- Steps 1-2 fix the most-reported user issue (stale form data)
- Steps 4-5 align with project conventions and improve visual consistency
- Steps 3, 6 fix interaction reliability
- Step 7 reduces code complexity

---

## Part 6 — Files Changed Summary

| File                                      | Changes                                                       |
|-------------------------------------------|---------------------------------------------------------------|
| `components/kanban/unit-kanban.tsx`        | Add `key` props, add `group` class                            |
| `components/kanban/task-dialog.tsx`        | Migrate to `FormModal` + `FormSection`, fix tag lookup, simplify keyboard handling |
| `components/kanban/lane-dialog.tsx`        | Migrate to `FormModal`, add reset logic                       |
| `components/kanban/task-card.tsx`          | Add `data-no-dnd` to action buttons                           |

> [!IMPORTANT]
> The stale form data bug (BUG-1) is the **root cause** of the user's complaint about "the form showing the last information instead of the task details". The `key` prop solution is the simplest and most reliable fix — it forces a full remount, guaranteeing fresh state initialization from the `task` prop.

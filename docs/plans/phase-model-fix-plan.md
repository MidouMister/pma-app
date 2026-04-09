# Plan: Fix Phase Management in Project Detail Page

> **Created:** 2026-04-09
> **Status:** Awaiting Approval
> **PRD References:** PH-01 to PH-11, BR-10, BR-11, BR-12, PROJ-05, PROJ-06

---

## Problem Analysis

After thorough analysis of the codebase, the following gaps and issues have been identified in the Phase model integration within the Project Detail page (`app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx`).

### Issue 1: PhaseList Component Not Rendered in Project Detail Page

**Severity:** 🔴 Critical

The `PhaseList` component exists at `components/project/phase-list.tsx` and provides full phase CRUD (add/edit/delete phases + sub-phases). However, it is **never imported or rendered** in the project detail page.

The **Overview tab** in `project-overview.tsx` only displays a simplified phase progress list (name + progress bar) — it does **NOT** provide:
- An "Add Phase" button
- Phase editing/deletion
- Sub-phase management
- Budget tracking (used vs remaining)

**Result:** Users cannot add, edit, or delete phases from the project detail page.

### Issue 2: `projectODS` Always Passed as `null`

**Severity:** 🟠 High

In `phase-list.tsx` line 126, the `PhaseDialog` is called with:
```tsx
projectODS={null}  // ← hardcoded null!
```

The Phase Dialog accepts `projectODS` as a prop but **immediately ignores it** (line 49 in `phase-dialog.tsx`):
```tsx
projectODS: _projectODS,  // ← destructured but never used
```

Meanwhile, the **server action** `createPhase()` correctly validates `Phase.startDate >= Project.ods` (BR-11). But the **client-side** form provides no visual indication of this constraint. Users can select any start date and only discover the ODS constraint after submission fails.

Per PRD **PH-03**: `Phase.startDate ≥ Project.ods` is a hard block requirement.

### Issue 3: Phase Delete Not Wired to Server Action

**Severity:** 🟠 High

In `phase-list.tsx`, the `handleDelete` function (line 109-116) only shows a **temporary toast** and doesn't actually call the `deletePhase()` server action:
```tsx
const handleDelete = () => {
  toast.success(
    deleteType === "phase"
      ? "Phase supprimée (temporaire)"    // ← fake success!
      : "Sous-phase supprimée (temporaire)"
  )
  setDeleteDialogId(null)
}
```

Similarly, the SubPhase delete is not wired either.

### Issue 4: Phase Edit Not Wired

**Severity:** 🟠 High

In `phase-list.tsx`, the "Modifier" dropdown item (line 196-199) doesn't trigger any action — it's just a non-functional menu item with no `onClick` handler that would open the `PhaseDialog` in edit mode.

### Issue 5: Sub-Phase Edit Not Wired

**Severity:** 🟡 Medium

The SubPhase "Modifier" dropdown item (line 257-259) is also non-functional — no handler to open the `SubPhaseDialog` in edit mode with existing data.

### Issue 6: `PhaseList` Missing `projectODS` Prop

**Severity:** 🟡 Medium

The `PhaseListProps` interface doesn't include `projectODS`, so even if `PhaseList` were rendered, it couldn't pass the project's ODS date to `PhaseDialog` for client-side date validation.

### Issue 7: Chinese Characters in UI

**Severity:** 🟡 Low (Cosmetic)

In `project-overview.tsx` line 127:
```tsx
<Badge variant="outline">全局</Badge>
```
This shows Chinese characters ("全局" = "Global") instead of French. Should be `Globale` or `Global`.

---

## Proposed Changes

### Component 1: Project Detail Page

#### [MODIFY] [page.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx)
- Import `PhaseList` component
- Pass `phases`, `projectId`, `projectMontantHT`, `project.ods`, and `userRole` to `PhaseList`
- Render `PhaseList` within the Overview tab (below `ProjectOverview`)

---

### Component 2: Phase List

#### [MODIFY] [phase-list.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/phase-list.tsx)

1. **Add `projectODS` prop** to `PhaseListProps` and pass it to `PhaseDialog`
2. **Wire phase delete** — call `deletePhase()` server action from `handleDelete`
3. **Wire phase edit** — open `PhaseDialog` in edit mode with existing phase data when "Modifier" is clicked
4. **Wire sub-phase edit** — open `SubPhaseDialog` in edit mode with existing sub-phase data when "Modifier" is clicked
5. **Wire sub-phase delete** — call `deleteSubPhase()` server action
6. **Add `router.refresh()`** after successful mutations to re-fetch data

---

### Component 3: Phase Dialog

#### [MODIFY] [phase-dialog.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/phase-dialog.tsx)

1. **Use `projectODS`** — add client-side validation:
   - Disable dates before ODS in the Calendar `disabled` prop
   - Show a helper text: `"La date de début doit être ≥ ODS ({formatted date})"`
2. **Support external `open` control** — allow parent component to open the dialog (for edit mode launched from phase-list dropdown)

---

### Component 4: Project Overview (Minor Fix)

#### [MODIFY] [project-overview.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-overview.tsx)

- Replace `全局` with `Global` (line 127)

---

## Summary of All Gaps

| # | Issue | Severity | Files Affected |
|---|-------|----------|----------------|
| 1 | PhaseList not rendered in page | 🔴 Critical | `page.tsx` |
| 2 | `projectODS` always null / unused | 🟠 High | `phase-list.tsx`, `phase-dialog.tsx` |
| 3 | Phase delete not wired to action | 🟠 High | `phase-list.tsx` |
| 4 | Phase edit not wired | 🟠 High | `phase-list.tsx` |
| 5 | Sub-phase edit not wired | 🟡 Medium | `phase-list.tsx` |
| 6 | PhaseList missing ODS prop | 🟡 Medium | `phase-list.tsx` |
| 7 | Chinese text in overview | 🟡 Low | `project-overview.tsx` |

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Should the `PhaseList` be placed inside the Overview tab (below the existing cards) or should it be in its own dedicated tab (e.g., "Phases")?
> 
> **Recommendation:** Place it inside the Overview tab below the existing cards, as per current PRD structure (PROJ-05 says Overview includes progress + phases).

> [!NOTE]
> **Q2:** The `PhaseDialog` currently opens via its own trigger button. For the "edit" flow from the phase-list dropdown, should we refactor to support **controlled open state**, or use a different approach (e.g., render separate dialog instances per phase)?
>
> **Recommendation:** Refactor to support controlled state — cleaner than rendering N dialog instances.

---

## Verification Plan

### Automated Tests
- Run `pnpm typecheck` — must pass
- Run `pnpm lint` — must pass

### Manual Verification (Browser)
1. Navigate to a project detail page
2. Verify the PhaseList renders in the Overview tab with budget summary
3. Click "Ajouter une phase" → verify dialog opens with ODS constraint
4. Create a phase → verify it appears in the list
5. Click phase dropdown → "Modifier" → verify dialog opens with existing data pre-filled
6. Edit a phase → verify changes persist
7. Click phase dropdown → "Supprimer" → verify confirmation dialog → verify deletion
8. Expand phase → verify sub-phases visible
9. Add/edit/delete sub-phases → verify all operations work
10. Verify ODS validation: attempt to set start date before ODS → verify it's blocked client-side
11. Verify budget validation: attempt to exceed project montantHT → verify error
12. Verify Chinese text "全局" is replaced with "Global"

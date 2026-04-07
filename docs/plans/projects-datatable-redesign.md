# Projects DataTable Redesign Plan

## Route: `/unite/[unitId]/projects`

> **Skill:** `ui-ux-pro-max` — Enterprise SaaS dashboard, shadcn DataTable pattern
> **Stack:** Next.js 16 App Router · shadcn/ui v4 · Tailwind CSS 4 · Framer Motion · Lucide Icons

---

## 1. Current State

| Element          | Current                         | Problem                                |
| ---------------- | ------------------------------- | -------------------------------------- |
| Table            | Basic shadcn `<Table>`          | No column sorting, no pagination       |
| Name column      | `line-clamp-2` with link        | Already exists but visually flat       |
| Status badge     | `STATUS_COLORS` from constants  | Outdated plain background colors       |
| Toolbar          | 4 separate `<Select>` dropdowns | Works but plain — no visual hierarchy  |
| Progress         | Basic `<Progress>` bar          | Too narrow, no label alignment         |
| Empty state      | Inline minimal text             | No illustration/icon panel             |
| Loading skeleton | Flat `<Skeleton>` rows          | Doesn't match rich new layout          |
| Page layout      | `container mx-auto py-6`        | No premium header, PageHeader is plain |

---

## 2. Design Goals

- **Modern DataTable** with column sorting, search, filters, and pagination
- **Project name wraps up to 2 lines** — never truncated with `…`, always fully readable
- **Rich status badges** — coloured dot + label with per-status background
- **Budget column** in `font-mono` with `formatCurrency`
- **Progress column** — wider bar with percentage label + colour threshold
- **Animated entrance** — rows stagger in with Framer Motion
- **Responsive** — toolbar stackable on mobile, table horizontally scrollable

---

## 3. Architecture Decision: TanStack React Table

We will use the **official shadcn `data-table` pattern** leveraging `@tanstack/react-table`. This provides a robust, extensible foundation for advanced table features.
- We will install `@tanstack/react-table`.
- We will extract a generic `<DataTable>` component that handles the rendering, pagination, sorting, and filtering state.
- We will define the project columns in a separate `columns.tsx` file for clean architecture.
- We can still enforce our custom 2-line text wrap via the column cell render functions.

---

## 4. Component Plan

### 4.1 Refactor `project-list.tsx` and Add Data Table Components

**Add dependencies:**
- `pnpm add @tanstack/react-table`

**Create:**
- `components/ui/data-table.tsx`: The generic reusable data table shell (rendering the `Table`, pagination controls, and layout).
- `app/(dashboard)/unite/[unitId]/projects/columns.tsx`: Column definitions for the projects table (Name, Status, Montant, Progress, etc.).
- `app/(dashboard)/unite/[unitId]/projects/data-table.tsx`: The toolbar and filters specifically for the projects view.

**Improve:**
- Visual sort arrows inside column headers using the TanStack `column.toggleSorting` API.
- Global and column-specific filtering.
- Pagination standard controls (Next/Previous, row counts).
- Empty state panel via the data table fallback.

### 4.2 New page header in `page.tsx`

Replace plain `<PageHeader>` with inline premium header containing:

- Gradient breadcrumb strip (Unit name → Projets)
- Count badge showing `X projets`
- "Nouveau Projet" button aligned right (role-gated)
- `SidebarTrigger` integrated

### 4.3 Update `loading.tsx`

Match the new premium layout:

- Header skeleton (gradient strip)
- Toolbar skeleton (search + 3 selects + button)
- Table skeleton (header + 8 rows, each `h-16`)

---

## 5. Column Specification

| #   | Column          | Width                  | Notes                                |
| --- | --------------- | ---------------------- | ------------------------------------ |
| 1   | **Projet**      | `min-w-[280px]`        | Name in 2 lines + code badge beneath |
| 2   | **Client**      | `min-w-[150px]`        | Text, muted, `—` if none             |
| 3   | **Statut**      | `w-[140px]`            | Coloured pill with dot               |
| 4   | **Montant TTC** | `w-[160px] text-right` | `font-mono`, `formatCurrency`        |
| 5   | **Progression** | `w-[160px]`            | Progress bar + `XX%` label           |
| 6   | **ODS**         | `w-[120px]`            | `formatDate` or `—`                  |
| 7   | **Actions**     | `w-[50px]`             | `DropdownMenu` ghost button          |

> The **Code** column is merged into the **Projet** column as a small `font-mono` badge below the name — saves horizontal space so the table fits on 1280px screens without horizontal scroll.

---

## 6. Design Tokens & Patterns

### Status Badge (rich version)

```tsx
const STATUS_CONFIG = {
  New: {
    label: "Nouveau",
    dot: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  InProgress: {
    label: "En cours",
    dot: "bg-emerald-500 animate-pulse",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  Pause: {
    label: "En pause",
    dot: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Complete: {
    label: "Terminé",
    dot: "bg-slate-400",
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
}
```

### Progress Bar Thresholds

```tsx
const progressColor =
  progress === 100 ? "text-emerald-600 dark:text-emerald-400"
  : progress >= 70  ? "text-blue-600 dark:text-blue-400"
  : progress >= 40  ? "text-amber-600 dark:text-amber-400"
  : "text-muted-foreground"
```

### Row Entrance Animation

```tsx
// Each row: motion.tr with stagger
initial={{ opacity: 0, x: -8 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: index * 0.04, duration: 0.25 }}
```

### Sortable Column Header

```tsx
// Sort indicator icons
<button onClick={() => toggleSort("name")} className="flex items-center gap-1">
  Projet
  {sortBy === "name" ? (
    sortDir === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
  ) : (
    <ChevronsUpDown className="size-3.5 opacity-40" />
  )}
</button>
```

### Toolbar Reset Button

```tsx
// Only visible when any filter/sort is non-default
{hasActiveFilters && (
  <Button variant="ghost" size="sm" onClick={resetFilters}>
    <X className="mr-1.5 size-3.5" />
    Réinitialiser
  </Button>
)}
```

---

## 7. Page Header Premium Design

```tsx
// In page.tsx — replaces <PageHeader>
<header className="border-b bg-linear-to-r from-background to-muted/30">
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center gap-3">
      <SidebarTrigger />
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
          <Link href={`/unite/${unitId}`}>{unit.name}</Link>
          <ChevronRight className="size-3" />
          <span>Projets</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          Projets
          <Badge variant="secondary" className="font-mono text-xs">
            {projects.length}
          </Badge>
        </h1>
      </div>
    </div>
    {canCreate && <ProjectDialog ... />}
  </div>
</header>
```

---

## 8. Pagination

Client-side, 10 rows per page:

```tsx
const PAGE_SIZE = 10
const [page, setPage] = useState(1)
const paginated = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE)

// Footer: "Page 1 of 4" + Previous / Next buttons
```

---

## 9. Files Changed

| File                                                  | Action      | Description                                              |
| ----------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `components/project/project-list.tsx`                 | **Rewrite** | Full DataTable with sort, filter, pagination, animations |
| `app/(dashboard)/unite/[unitId]/projects/page.tsx`    | **Update**  | Premium header, pass `unit.name` for breadcrumb          |
| `app/(dashboard)/unite/[unitId]/projects/loading.tsx` | **Update**  | Match new layout skeleton                                |

---

## 10. Sorting State Machine

```
sortBy: "name" | "montantTTC" | "ods" | "progress" | "date"  (default: "date")
sortDir: "asc" | "desc"  (default: "desc")
```

Toggle: clicking same column → flip direction. Clicking different column → set that column + "desc".

---

## 11. Pre-Delivery Checklist

- [ ] Name never truncated — wraps to 2 lines with `whitespace-normal`
- [ ] All clickable cells have `cursor-pointer`
- [ ] Status dot for `InProgress` has `animate-pulse`
- [ ] Framer Motion rows respect `prefers-reduced-motion`
- [ ] Light mode badges have sufficient contrast
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` run

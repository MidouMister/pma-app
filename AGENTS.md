# PMA — Agent Guidelines

> This file provides coding conventions and operational instructions for AI agents working in the PMA repository.

---

## ⚠️ CRITICAL: Always Use MCPs and Skills

### Rule 1: ALWAYS Re-Read Skills Before Delegating

**This is non-negotiable.** Before delegating ANY task to a subagent, the orchestrator agent must:

1. Load ALL relevant skills using the `skill` tool
2. Re-read the skill's reference files to verify correct patterns
3. Include the verified patterns in the delegation prompt
4. Never delegate based on remembered knowledge — always re-confirm from source

### Rule 2: Always Use Context7 MCP

**Resolve library ID first, then query documentation** for any framework, library, or API you're implementing. This ensures you're using the latest API patterns — not outdated ones.

---

### Tool Reference

| Tool                                        | When to Use                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Context7 MCP**                            | **ALWAYS** — Query latest docs for any framework/API                                                       |
| **Skill: nextjs-best-practices**            | Next.js pages, Server Components, data fetching, routing                                                   |
| **Skill: vercel-react-best-practices**      | React components, hooks, state management                                                                  |
| **Skill: clerk**                            | Authentication, Clerk setup, webhooks                                                                      |
| **Skill: clerk-nextjs-patterns**            | Clerk + Next.js patterns — middleware, Server Actions (⚠️ Next.js 16 uses `proxy.ts`, not `middleware.ts`) |
| **Skill: shadcn**                           | Adding/searching/debugging shadcn/ui components                                                            |
| **Skill: supabase-postgres-best-practices** | Prisma queries, schema design, Postgres optimization                                                       |
| **Skill: frontend-design**                  | UI components, pages, design systems                                                                       |
| **Skill: uploadthing-nextjs**               | File uploads with UploadThing                                                                              |

### Context7 MCP Workflow

```
// Step 1: Resolve the library ID
context7_resolve-library-id({ query: "...", libraryName: "vercel/next.js" })

// Step 2: Query the documentation
context7_query-docs({ libraryId: "...", query: "How to do X in Next.js 16" })

// Step 3: Apply the verified patterns
```

### Loading a Skill

```bash
skill({ name: "clerk-nextjs-patterns" })
skill({ name: "shadcn" })
skill({ name: "nextjs-best-practices" })
```

---

## 1. Git \& Deployment Workflow

> **These rules apply to every agent on every task. Read them before touching any file.**

### 1.1 One Environment, Two Branches

| Environment | Branch    | Vercel URL            | Purpose                            |
| ----------- | --------- | --------------------- | ---------------------------------- |
| Production  | `main`    | `pma.yourdomain.com`  | Live app — real users              |
| Local       | `staging` | _(none — local only)_ | Integration branch, tested locally |

Only `main` is connected to Vercel for production deploys.  
The `staging` branch is used locally for integration testing before merging to `main`.  
They share the same Clerk, Supabase, and Uploadthing apps (one set of env vars).

### 1.2 Branch Structure

```
main          ← production only. Never commit here directly. Vercel deploys from here.
└── staging   ← integration branch. Merge features here, test locally, then merge to main.
      └── feature/your-task-name   ← where you actually write code.
```

### 1.3 The Three Non-Negotiable Rules

#### Rule 1 — `main` is protected

- **Never commit directly to `main`. Ever.**
- `main` only receives merges from `staging` after everything is confirmed working on the staging URL.
- If you find yourself on `main`, stop and branch before writing a single line.

#### Rule 2 — Always work on a feature branch

Before writing any code, check the current branch:

```bash
git branch --show-current
```

If you are on `main` or `staging`, create a feature branch first:

```bash
git checkout staging
git pull origin staging
git checkout -b feature/your-task-name
```

Branch naming convention:

| Prefix      | When to use                          |
| ----------- | ------------------------------------ |
| `feature/`  | New feature                          |
| `fix/`      | Bug fix                              |
| `chore/`    | Tooling, deps, config, setup         |
| `refactor/` | Code restructure, no behavior change |

Examples: `feature/auth-onboarding`, `fix/phase-budget-validation`, `chore/prisma-schema-setup`

**Never commit directly to `staging`.** It only receives merges from feature branches via Pull Requests.

#### Rule 3 — Atomic commits

Each commit must represent **one logical, self-contained change**.

Use [Conventional Commits](https://www.conventionalcommits.org/) format — `type: short description`:

| Prefix      | When to use                     |
| ----------- | ------------------------------- |
| `feat:`     | New feature or behavior         |
| `fix:`      | Bug fix                         |
| `chore:`    | Tooling, deps, config           |
| `refactor:` | Restructure, no behavior change |
| `docs:`     | Documentation only              |

**Good commits:**

```
feat: add Clerk middleware to protect dashboard routes
feat: create Phase model and relations in Prisma schema
fix: block phase save when montantHT sum exceeds project budget
chore: install kibo-ui gantt component
refactor: extract companyId scoping into reusable query helper
```

**Bad commits — never do this:**

```
update files
fix stuff
WIP
add auth and phases and kanban and fix bugs
```

### 1.4 Pull Request Rules

- **Every PR must target `staging` as the base branch — never `main`.**
- PR title = human-readable description of the feature/fix.
- Before opening a PR, verify:
  - [ ] Branch is up to date with `staging` (`git rebase staging`)
  - [ ] `pnpm typecheck` passes with no errors
  - [ ] `pnpm lint` passes with no errors

### 1.5 Exact Workflow — Follow This Every Time

```bash
# 1. Start from an up-to-date staging branch
git checkout staging
git pull origin staging

# 2. Create your feature branch
git checkout -b feature/task-name

# 3. Write code — commit atomically after each logical change
git add <specific files — never: git add .>
git commit -m "feat: describe exactly what this commit does"

# 4. Push the branch
git push origin feature/task-name

# 5. Open PR on GitHub
#    → Base branch: staging  (never main)
#    → Title: human-readable description
```

### 1.6 Merging to Production

Only after staging is confirmed working locally:

```bash
git checkout main
git merge staging
git push origin main
# Vercel deploys to production automatically
```

---

## 2. Build & Run Commands

| Command                                 | Purpose                           |
| --------------------------------------- | --------------------------------- |
| `pnpm dev`                              | Start dev server with Turbopack   |
| `pnpm build`                            | Production build                  |
| `pnpm start`                            | Start production server           |
| `pnpm lint`                             | Run ESLint on all files           |
| `pnpm typecheck`                        | Run TypeScript compiler (no emit) |
| `pnpm format`                           | Format all files with Prettier    |
| `pnpm prisma validate`                  | Validate Prisma schema            |
| `pnpm prisma db push`                   | Push schema to database           |
| `pnpm prisma db seed`                   | Run database seed                 |
| `pnpm prisma migrate dev --name <name>` | Create new migration              |

**Single-file testing:** Currently no test framework is installed. Until tests are added, verify code correctness by running `pnpm typecheck` and `pnpm lint` on the changed files.

---

## 3. Tech Stack (Do Not Deviate)

| Layer           | Technology          | Version                              |
| --------------- | ------------------- | ------------------------------------ |
| Framework       | Next.js             | 16 (App Router)                      |
| UI              | React               | 19                                   |
| Styling         | Tailwind CSS        | 4                                    |
| Components      | shadcn/ui           | v4 (initialized, do NOT re-run init) |
| Database ORM    | Prisma              | 7                                    |
| Database        | Supabase PostgreSQL | —                                    |
| Auth            | Clerk               | —                                    |
| File Uploads    | Uploadthing         | —                                    |
| State           | Jotai               | —                                    |
| Gantt/Kanban    | kibo-ui             | —                                    |
| Package Manager | pnpm                | — (never npm/yarn)                   |

---

## 4. Code Style

### 3.1 TypeScript

- **Strict mode is enabled** — no `any` types, no implicit returns
- Use explicit types for all function parameters and return values
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `enum` — prefer const objects or string unions
- Always use the `@/` path alias (configured in tsconfig.json)
- **kibo-ui type constraint**: kibo-ui components (Kanban, Gantt) require `Record<string, unknown>`. Do NOT add `[key: string]: unknown` to your interfaces. Instead, use type intersection at the call site: `data={items as (MyItem & Record<string, unknown>)[]}`.

### 3.2 Naming Conventions

| Entity                 | Convention           | Example               |
| ---------------------- | -------------------- | --------------------- |
| Files (components)     | kebab-case           | `task-card.tsx`       |
| Files (server actions) | kebab-case           | `create-task.ts`      |
| Files (lib/utils)      | kebab-case           | `format-date.ts`      |
| React Components       | PascalCase           | `TaskCard.tsx`        |
| Server Actions         | camelCase (exported) | `createTask()`        |
| Variables/Functions    | camelCase            | `totalAmount`         |
| Constants              | UPPER_SNAKE          | `MAX_RETRY_COUNT`     |
| Types/Interfaces       | PascalCase           | `ProjectFormData`     |
| CSS classes            | Tailwind utilities   | `text-lg font-medium` |

### 3.3 Import Order

```typescript
// 1. Next.js / React
import { useState } from "react"
import Link from "next/link"

// 2. Third-party libraries
import { clsx } from "clsx"
import { format } from "date-fns"

// 3. shadcn/ui components
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"

// 4. Internal components
import { PageHeader } from "@/components/shared/page-header"

// 5. Lib utilities
import { formatCurrency } from "@/lib/format"

// 6. Actions / hooks
import { createProject } from "@/actions/project"
import { useCurrentUser } from "@/hooks/use-current-user"
```

### 3.4 Formatting (Prettier)

The project uses Prettier with these settings (from `.prettierrc`):

- **No semicolons** at line ends
- **Single quotes** for strings
- **2 spaces** for indentation
- **Trailing commas** in ES5 contexts
- **80 character** print width
- Tailwind CSS class sorting via `prettier-plugin-tailwindcss`
- Custom Tailwind functions: `cn`, `cva`

Always run `pnpm format` before committing, or use the Prettier extension in your editor.

### 3.5 Component Patterns

**Server vs Client Components:**

- Default to **Server Components** — no `"use client"` directive
- Add `"use client"` only when using hooks, browser APIs, or event handlers
- Keep client boundaries minimal

**Component file structure:**

```typescript
// component-name.tsx
import { type FC } from "react"

interface ComponentNameProps {
  title: string
  onAction?: () => void
}

export const ComponentName: FC<ComponentNameProps> = ({ title, onAction }) => {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-medium">{title}</h2>
      {onAction && (
        <Button variant="outline" onClick={onAction}>
          Action
        </Button>
      )}
    </div>
  )
}
```

### 3.6 Server Actions

Follow this exact pattern for all server actions in `actions/`:

```typescript
"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createProject(data: CreateProjectInput) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // 2. Get user + validate company/unit scope
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  // 3. Check subscription status (block READONLY)
  // 4. Check RBAC permissions
  // 5. Check plan limits
  // 6. Validate business rules
  // 7. Execute mutation
  // 8. Create activity log (if applicable)
  // 9. Create notifications (if applicable)
  // 10. Revalidate path
  revalidatePath(`/unite/${user.unitId}/projects`)
}
```

### 3.7 Error Handling

- Use `try/catch` blocks around all Prisma operations
- Throw `Error` objects with clear messages — never silent failures
- User-facing errors should be descriptive and in French
- Never expose raw database errors to the client
- Use Zod for form validation — return `zodError.errors` for field-level feedback

### 3.8 Database & Tenant Isolation

**CRITICAL (BR-01):** Every Prisma query that touches user data must include `where: { companyId: ... }`. No exceptions.

```typescript
// ✅ Correct
const projects = await prisma.project.findMany({
  where: { companyId: user.companyId },
})

// ❌ Incorrect — missing companyId scope
const projects = await prisma.project.findMany()
```

---

## 5. Project Architecture

### 4.1 Route Groups

```
app/
├── (auth)/           # Public auth routes (Clerk)
├── (dashboard)/      # Protected routes with sidebar
├── api/              # API routes (webhooks, uploadthing)
├── layout.tsx        # Root layout
└── page.tsx          # Landing page
```

### 4.2 Components Directory

```
components/
├── ui/               # shadcn primitives (28 installed)
├── theme-provider    # Next-themes provider
├── sidebar/          # Sidebar components
├── shared/           # Reusable across features (page-header, empty-state, form-modal, detail-modal, form-section, data-table)
├── onboarding/       # Onboarding wizard steps
├── project/          # Project-specific components (dialog, gantt, phase/subphase dialogs)
├── kanban/           # Kanban board components:
│   ├── unit-kanban.tsx         # Board wrapper, filter bar, lane rendering, view toggle
│   ├── task-card.tsx           # Individual task card (redesigned: status badge, comment count)
│   ├── task-dialog.tsx         # Create/edit task form with sections
│   ├── task-detail-modal.tsx   # Detail view modal (replaces task-detail-sheet)
│   ├── task-detail-sheet.tsx   # DEPRECATED — kept for reference, no longer imported
│   ├── task-table.tsx          # Table/list view alternative to Kanban
│   ├── task-comments.tsx       # Comment input + list (reused in detail modal)
│   ├── task-metadata.tsx       # Assignee, date, tags section (reused in detail modal)
│   ├── task-time-entries.tsx   # Time entries display (reused in detail modal)
│   ├── lane-dialog.tsx         # Create/edit lane form
│   ├── tag-dialog.tsx          # Tag management dialog
│   ├── tag-manager.tsx         # Tag management UI
│   └── types.ts                # Shared Kanban interfaces
├── gantt/            # Gantt chart components:
│   └── gantt-marker-dialog.tsx  # FormModal-based marker CRUD dialog
├── client/           # Client CRM components
└── notifications/    # Notification components (to be built)
```

### 4.3 lib/ Directory

```
lib/
├── prisma.ts          # Prisma client singleton
├── auth.ts            # Clerk auth helpers
├── format.ts          # Algerian currency/date formatting
├── validators.ts      # Zod schemas for all forms
├── constants.ts       # Plan limits, wilayas, notification types
├── subscription.ts    # Subscription status computation
├── production-utils.ts # calcMontant(), recalculateProduct() — shared by production & phase actions
└── utils.ts          # cn() utility (already existed)
```

### 4.4 Prisma Enums (do not rename)

These enums are defined in `prisma/schema.prisma` — use them exactly:

```prisma
enum Role { OWNER, ADMIN, USER }
enum Status { New, InProgress, Pause, Complete }
enum InvitationStatus { PENDING, ACCEPTED, REJECTED, EXPIRED }
enum NotificationType { INVITATION, PROJECT, TASK, CLIENT, PHASE, TEAM, LANE, TAG, PRODUCTION, GENERAL }
enum SubPhaseStatus { TODO, COMPLETED }
enum SubscriptionStatus { TRIAL, ACTIVE, GRACE, READONLY, SUSPENDED }
```

### 4.5 Navigation Source of Truth

All sidebar navigation items are defined in `lib/nav.ts`. This is the single source of truth for role-based navigation. Do not hardcode nav items in components.

---

## 6. Business Rules (Critical)

| Rule   | Description                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------- |
| BR-01  | All queries scoped by `companyId`                                                                         |
| BR-05  | Plan limits checked server-side before INSERT                                                             |
| BR-10  | Sum of Phase.montantHT cannot exceed Project.montantHT (hard block)                                       |
| BR-11  | Phase.startDate must be >= Project.ods (hard block)                                                       |
| BR-12  | SubPhase dates must be within parent Phase range (hard block)                                             |
| BR-13  | `Production.mntProd = Phase.montantHT × (taux / 100)` — system-calculated only                            |
| BR-13b | `Product.taux = SUM(Production.taux)` — auto-calculated aggregate, **never manually set**                 |
| BR-13c | `Product.montantProd = Phase.montantHT × (Product.taux / 100)` — auto-calculated                          |
| BR-13d | `ProductionForecast.mntProd = Phase.montantHT × (taux / 100)` — auto-calculated                           |
| BR-14  | Alert: `Production.taux < ProductionForecast.taux × (threshold / 100)` → PRODUCTION notification to OWNER |
| BR-24  | One `Production` per phase per month — `@@unique([phaseId, month, year])`                                 |
| BR-25  | One `ProductionForecast` per phase per month — `@@unique([phaseId, month, year])`                         |
| SEC-02 | Role checks enforced at Server Action level, not just UI                                                  |

---

## 7. UI Conventions

### 6.1 Tailwind CSS 4

- Use Tailwind utility classes exclusively — no inline styles
- Use `cn()` (from `clsx` + `tailwind-merge`) for conditional classes
- Prefer Tailwind's default spacing scale
- Use `text-destructive` and `bg-destructive` for error states (shadcn)

### 6.2 shadcn/ui Components

shadcn/ui is already initialized. When adding new components:

```bash
npx shadcn@latest add <component-name>
```

Do NOT run `npx shadcn@latest init` — the project is already configured.

### 6.3 Loading & Error States

- Use `<Skeleton />` for loading states
- Use `<Alert variant="destructive">` for error messages
- Create empty state components using `EmptyState` from `components/shared/`

### 6.4 Formatting Utilities

Use functions from `lib/format.ts` for all display values:

- `formatCurrency(amount: number)` → `1 234 567,89 DA`
- `formatDelai(months: number, days: number)` → `3 mois 15 jours`
- `formatDate(date: Date)` → locale-aware French date string
- `formatRelativeDueDate(date: Date)` → relative due date with variant (overdue/today/upcoming)

### 6.5 Kanban Card Design Conventions

**Card component:** `components/kanban/task-card.tsx`

- **No project name on card** — filter bar provides context; detail sheet has full info
- **Inline checkbox** for complete toggle — `onClick={(e) => e.stopPropagation()}` to prevent opening detail sheet
- **Description preview** — 1-line with `text-xs text-muted-foreground line-clamp-1`
- **Date display** — show `startDate → dueDate` if both exist, otherwise just `dueDate` via `formatRelativeDueDate()`
- **Hover quick actions** (desktop) — edit/delete buttons with `opacity-0 group-hover:opacity-100 transition-opacity`
- **Mobile kebab menu** (`md:hidden`) — always-visible `⋮` DropdownMenu for touch devices
- **Completed state** — strikethrough title + `opacity-60` on card content
- **Tags** — colored badge chips, wrap gracefully
- **Hover action container** must have `data-no-dnd="true"` to prevent dnd-kit from intercepting pointer events on edit/delete buttons

### 6.6 Form Modal Convention

**All CRUD dialogs** must use `<FormModal>` from `components/shared/form-modal.tsx`. Do NOT use raw `<Dialog>` for forms — the project convention (established in Milestone 5.5) is that every create/edit form uses the shared wrapper for visual consistency (gradient accent header, icon support, separator between sections, consistent spinner/buttons, `onReset` cleanup).

Currently migrated forms: `ProjectDialog`, `PhaseDialog`, `SubPhaseDialog`, `ClientDialog`, `TaskDialog`, `LaneDialog`.

When building a new form dialog:

```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Dialog Title"
  description="Optional description"
  icon={<SomeIcon className="size-5" />}
  size="sm" // sm | md | lg | xl | 2xl
  isPending={isPending}
  onSubmit={handleSubmit}
  onReset={resetForm}
  submitLabel="Enregistrer"
  submitPendingLabel="Enregistrement..."
>
  <div className="flex flex-col gap-4">{children}</div>
</FormModal>
```

### 6.7 Task Dialog Structure

**Component:** `components/kanban/task-dialog.tsx`

The task form uses `<FormModal>` (from `components/shared/`) with 4 `<FormSection>` components:

1. **Informations** — Title (required, `maxLength={120}`) + Description (optional)
2. **Localisation du projet** — Project combobox + Phase/SubPhase selects
3. **Planification** — `startDate` + `dueDate` side-by-side; `endDate` below (edit mode only)
4. **Attribution** — Column, Assignee, Tags in 3-column grid

- `startDate` is left uninitialized (null) for new tasks — not defaulted to today
- `endDate` only shown when editing an existing task
- Tags use Popover+Command with checkboxes + colored badge chips, with inline tag creation
- `Ctrl+Enter` submits form via `onKeyDown` handler on the container div (not a `useEffect`)
- Submit logic extracted into `buildActionPayload()` helper
- **Reset:** `resetForm()` callback clears all state when dialog closes
- **Key prop:** `unit-kanban.tsx` passes `key={editingTask?.id ?? "create"}` to force remount on mode switch
- **Filter-driven defaults:** `TaskDialog` accepts `defaultProjectId`, `defaultPhaseId`, `defaultSubPhaseId` props to pre-fill fields from the Kanban filter bar. When the filter bar has a project active and the user clicks "Ajouter une tâche", the dialog auto-selects that project/phase/subPhase. The initial state logic cascades: (1) existing task values, (2) smart single-phase auto-select, (3) filter-bar defaults via props.

### 6.8 Lane Dialog Structure

**Component:** `components/kanban/lane-dialog.tsx`

- Uses `<FormModal>` (size="sm") with `Columns3` icon
- Name (required) + Color (native color input + hex text input)
- Delete button in form body (edit mode only)
- **Reset:** `resetForm()` callback clears state on close
- **Key prop:** `unit-kanban.tsx` passes `key={editingLane?.id ?? "create"}` to force remount

### 6.9 Kanban Drag & Drop Constraints

**Component:** `components/kibo-ui/kanban/index.tsx`

To prevent dnd-kit from suppressing click events on task cards (which blocks detail sheet opening and action buttons), **always** configure `MouseSensor` and `TouchSensor` with an `activationConstraint`:

```typescript
const sensors = useSensors(
  useSensor(MouseSensor, {
    activationConstraint: { distance: 5 }, // Allows clicks to pass through
  }),
  useSensor(TouchSensor, {
    activationConstraint: { distance: 5 },
  })
)
```

Without this constraint, the library captures all pointer events as potential drag starts, breaking standard button interactions.

### 6.10 Gantt Feature List — Flat GanttFeatureItem

**Component:** `components/project/project-gantt.tsx`

The Gantt chart uses a **flat `GanttFeatureItem` list** (not `GanttFeatureRow`). Each phase and subphase is a separate item in the flat array. Subphases only appear when their parent phase is expanded via `Set<string>` state.

```typescript
interface GanttPhaseFeature extends GanttFeature {
  code: string
  montantHT: number
  progress: number
  isSubPhase: boolean
  parentPhaseId: string | null
  subPhaseCount: number
}
```

- **Expand/collapse**: `expandedPhases: Set<string>` state — toggle via `Set.add()`/`Set.delete()` (immutable with new Set).
- **Sidebar**: Custom rendering uses `GanttContext.Consumer` to access `scrollToFeature()`. Phases show chevron + status dot + name + subphase count badge. Subphases show Checkbox for COMPLETED/TODO toggle.
- **`useOptimistic`** wraps the `ganttFeatures` memo for instant drag/checkbox feedback. Two action types: `"move"` (date change) and `"toggleStatus"` (COMPLETED/TODO).

### 6.11 Gantt Bar Styling — cardClassName/cardStyle

The kibo-ui `GanttFeatureItem` accepts `cardClassName?: string` and `cardStyle?: CSSProperties` props that pass through to `GanttFeatureItemCard`:

```tsx
<GanttFeatureItem
  {...feature}
  cardClassName={cn(
    "border-2 backdrop-blur-sm",
    feature.isSubPhase
      ? "border-sky-400/60 bg-sky-500/10"
      : /* status-colored mapping */
        "border-blue-400/60 bg-blue-500/10"
  )}
  cardStyle={{ borderLeftWidth: "3px" }}
>
  {/* children */}
</GanttFeatureItem>
```

- **Phase bars**: Status-colored border + background (blue=new, emerald=in-progress, amber=pause, slate=complete).
- **SubPhase bars**: Sky border (TODO) or emerald (COMPLETED), with `ml-6` indent.
- **Progress overlay**: Absolutely positioned div inside the bar, `width: ${progress}%`, with `opacity-20` for a fill effect.
- **Icons**: `FolderKanban` for phases, `ListTodo` for subphases.
- **SubPhase duration**: `(X j)` appended after name.

### 6.12 Gantt Context Menu + CRUD

Each `GanttFeatureItem` is wrapped in shadcn `ContextMenu` for right-click actions:

- **Phase**: "Voir les détails" (opens detail Sheet) → "Modifier" (opens PhaseDialog) → "Ajouter une sous-phase" (opens SubPhaseDialog) → "Supprimer" (AlertDialog confirmation).
- **SubPhase**: "Voir" → "Modifier" (opens SubPhaseDialog) → "Supprimer" (AlertDialog confirmation).

Deletion uses `<AlertDialog>` with confirm/cancel. All CRUD dialogs use `<FormModal>` per section 6.6.

### 6.13 GanttMarker CRUD

- **Create**: `GanttCreateMarkerTrigger` (from kibo-ui) renders a `+` button on timeline hover. Calls `createGanttMarker` action.
- **Edit**: Right-click marker → "Edit marker" → opens `GanttMarkerDialog` with pre-filled data. Calls `updateGanttMarker` action.
- **Delete**: Right-click marker → "Remove marker" → AlertDialog confirmation → calls `deleteGanttMarker` action.
- **Dialog**: `components/gantt/gantt-marker-dialog.tsx` — uses `<FormModal>` with `Flag` icon, label input, Calendar date picker, optional CSS class.

### 6.14 Gantt Exports from kibo-ui

`GanttContext` is **exported** from `components/kibo-ui/gantt/index.tsx`. Use `GanttContext.Consumer` or `useContext(GanttContext)` to access `scrollToFeature()` in the sidebar.

### 6.15 DetailModal Convention (read/detail counterpart to FormModal)

**Component:** `components/shared/detail-modal.tsx`

`DetailModal` is the read-only counterpart to `FormModal`. Use it for **detail views** that don't need a form wrapper. Same visual language: gradient accent bar, icon box, Separator.

```typescript
interface DetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode // Status badge (lane name)
  headerActions?: ReactNode // Action buttons (Edit, Complete, Delete)
  size?: "md" | "lg" | "xl" | "2xl"
  className?: string
  children: ReactNode
}
```

**Key differences from FormModal:**

- NO `<form>` wrapper — just `<div>` for content
- NO `DialogFooter` — no submit/cancel buttons
- Has `badge` and `headerActions` slots in header
- Defaults to `size="lg"`

### 6.16 TaskDetailModal Convention

**Component:** `components/kanban/task-detail-modal.tsx`

The detail view for a task, opened when clicking a task card. Uses `DetailModal` with `size="2xl"`.

**Layout (two-column on `lg+`, stacks on mobile):**

- **Header**: Lane name badge (colored dot + name), Edit/Complete/Delete buttons, editable title (saves on blur), breadcrumb (Project › Phase › SubPhase)
- **Left column (~60%)**: Description (editable textarea, saves on blur) + Tabs (Activité with TaskComments, Temps with TaskTimeEntries)
- **Right column (~40%)**: Metadata sidebar card with Assigné à (Select), Date début (display), Échéance (color-coded popover), Colonne (Select with dots), Tags (colored badges + add popover), Projet (read-only), Phase (read-only)

**Data fetching:** Calls `getTaskDetailsData(taskId, projectId)` on open via `useEffect` with `isMounted` cleanup.

**State management:** Local state for `title`, `description`, `dueDate`, `newComment` + `useTransition` for mutations.

**Mutations:** Calls `handleUpdateTask(fields)` → `updateTask()` server action, then `onTaskUpdated?.()` callback (passed from parent for `router.refresh()`).

**Props:**

```typescript
interface TaskDetailModalProps {
  task: { ... } | null
  isOpen: boolean
  onClose: () => void
  canEdit?: boolean
  lanes?: { id: string; name: string; color: string | null }[]
  currentUser?: { name: string | null; avatarUrl: string | null } | null
  onEdit?: () => void           // Opens TaskDialog from parent
  onTaskUpdated?: () => void     // Refreshes parent data after mutations
}
```

### 6.17 TaskTable Convention

**Component:** `components/kanban/task-table.tsx`

Table/list view alternative to the Kanban board. Uses `@tanstack/react-table` directly.

**Columns:** Statut (colored dot + lane name), Titre (clickable → opens detail modal), Projet, Phase, Assigné (Avatar + name), Échéance (color-coded), Tags (max 2 colored badges + "+N" overflow), Terminé (Checkbox), Actions (edit/delete buttons).

**Features:**

- Sorting enabled on 6 columns (Statut, Titre, Projet, Phase, Assigné, Échéance)
- Pagination via `getPaginationRowModel` with page sizes 10/20/50
- Column visibility toggle via DropdownMenu
- Row click opens detail modal; `e.stopPropagation()` on action buttons/checkbox
- Empty state with `List` icon and "Aucune tâche trouvée"
- Responsive: horizontal scroll via `overflow-x-auto`

### 6.18 View Toggle Convention (Kanban / Table)

**Component:** `components/kanban/unit-kanban.tsx`

The tasks page supports two view modes: **Kanban** (board) and **Table** (list). Toggle via segmented button group in the filter bar.

```typescript
const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
```

**Toggle buttons:** Two `Button` components with `LayoutGrid` (Kanban) and `List` (Table) icons, wrapped in a `rounded-lg border` container. Active mode uses `variant="secondary"`, inactive uses `variant="ghost"`.

**Rendering logic:**

- `viewMode === "kanban"` → renders `<KanbanProvider>` with `<KanbanBoard>` per lane
- `viewMode === "table"` → renders `<TaskTable>` with filtered tasks

Both modes share the same filter state (search query, project/phase/subPhase filters).

**Locked project filter (`defaultProjectFilter`):** The component accepts an optional `defaultProjectFilter?: string` prop. When provided:

- `projectFilter` initializes to this value (locked to a specific project)
- The project combobox is hidden on both desktop and mobile filter bars
- `resetFilters()` does NOT reset the project filter (preserving the lock)
- `filterCount` excludes the project filter from the active-filters badge
- The `TaskDialog` `defaultProjectId` inherits this value automatically since `projectFilter` starts non-"all"
- Used by the project detail page (`defaultProjectFilter={projectId}`) to show only the current project's tasks in the tasks tab

---

## 8. Environment Variables

Required in `.env`:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/company/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/company/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_...
UPLOADTHING_TOKEN=...
```

---

## 9. Before You Submit

1. **⚠️ Re-read skills before delegating** — Did you load and verify patterns from the relevant skill files BEFORE delegating? Never delegate without confirming the latest patterns.
2. **Used Context7 MCP?** — Did you resolve the library ID and query docs for the frameworks/APIs you're implementing?
3. Run `pnpm typecheck` — must pass with no errors
4. Run `pnpm lint` — must pass with no errors
5. Run `pnpm format` — all files formatted
6. Verify tenant isolation in all Prisma queries (every query must include `companyId`)
7. Verify business rule enforcement in server actions
8. Check the PRD and tasks.md to ensure the feature is fully implemented
9. **Git hygiene** — Confirm you are NOT on `main` or `staging`. PR base branch must be `staging`. All commits are atomic with Conventional Commits format.
10. **For Clerk tasks** — Confirm filename: Next.js 16 uses `proxy.ts`, NOT `middleware.ts`
11. **For shadcn tasks** — Always run `npx shadcn@latest info` first to check installed components

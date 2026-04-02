# PMA — Changes & Implementation Plan

> **PRD Version:** 3.0.0 → 3.2.0
> **Created:** 2026-04-02
> **Status:** Pending Approval

---

## 1. Codebase Analysis — What's Already Done

### Completed Milestones (1–5)

| Milestone | Status | Key Deliverables |
|-----------|--------|------------------|
| **M1: Foundation** | ✅ Complete | Prisma schema (543 lines, all models), Clerk, Uploadthing, Jotai, Zod, 34 shadcn/ui components |
| **M2: Layout & Nav** | ✅ Complete | Sidebar (`sidebar-07`), `lib/nav.ts`, dashboard layout with auth guard, redirect hub |
| **M3: Auth & Onboarding** | ✅ Complete | Sign-in/sign-up pages, Clerk webhook, 3-step onboarding wizard, `actions/onboarding.ts` |
| **M4: Company & Unit** | ✅ Complete | Company dashboard/settings/billing, units CRUD, team page, members, invitations |
| **M5: Client CRM** | ✅ Complete | Client list/profile, CRUD actions, RBAC enforcement |

### Partially Started (Milestone 6)

| Component | File | Status |
|-----------|------|--------|
| Project List | `components/project/project-list.tsx` (10.6 KB) | ✅ Built |
| Project Dialog | `components/project/project-dialog.tsx` (15.3 KB) | ✅ Built — uses Dialog, sections layout |
| Project Overview | `components/project/project-overview.tsx` (8.1 KB) | ✅ Built |
| Project Team | `components/project/project-team.tsx` (6.3 KB) | ✅ Built |
| Phase List | `components/project/phase-list.tsx` (11.2 KB) | ✅ Built |
| Phase Dialog | `components/project/phase-dialog.tsx` (9.1 KB) | ✅ Built — but `handleSubmit` is a stub (toast only, no server action) |
| Subphase Dialog | `components/project/subphase-dialog.tsx` (7.1 KB) | ✅ Built — but `handleSubmit` is a stub |
| Project Documents | `components/project/project-documents.tsx` (3.4 KB) | 🟡 Placeholder |
| Gantt Placeholder | `components/project/project-gantt-placeholder.tsx` | 🟡 Placeholder |
| Production Placeholder | `components/project/project-production-placeholder.tsx` | 🟡 Placeholder |
| Tasks Placeholder | `components/project/project-tasks-placeholder.tsx` | 🟡 Placeholder |
| Time Tracking Placeholder | `components/project/project-time-tracking-placeholder.tsx` | 🟡 Placeholder |
| Server Actions | `actions/project.ts` (11.5 KB) | ✅ Built |
| Server Actions | `actions/phase.ts` (9.6 KB) | ✅ Built |
| Server Actions | `actions/subphase.ts` (8.6 KB) | ✅ Built |
| Server Actions | `actions/team.ts` (4.7 KB) | ✅ Built |
| Server Actions | `actions/gantt-marker.ts` (6.3 KB) | ✅ Built |

### Existing Server Actions

| File | Size | Functions |
|------|------|-----------|
| `actions/onboarding.ts` | 4.4 KB | `completeOnboarding()` |
| `actions/company.ts` | 3.1 KB | `updateCompany()` |
| `actions/unit.ts` | 9.1 KB | `createUnit()`, `updateUnit()`, `deleteUnit()`, `removeMember()` |
| `actions/invitation.ts` | 5.4 KB | `sendInvitation()`, `revokeInvitation()` |
| `actions/client.ts` | 7.8 KB | `createClient()`, `updateClient()`, `deleteClient()` |
| `actions/project.ts` | 11.5 KB | `createProject()`, `updateProject()`, `archiveProject()` |
| `actions/phase.ts` | 9.6 KB | `createPhase()`, `updatePhase()`, `deletePhase()` |
| `actions/subphase.ts` | 8.6 KB | `createSubPhase()`, `updateSubPhase()`, `deleteSubPhase()` |
| `actions/team.ts` | 4.7 KB | `addTeamMember()`, `removeTeamMember()` |
| `actions/gantt-marker.ts` | 6.3 KB | `createGanttMarker()`, `updateGanttMarker()`, `deleteGanttMarker()` |

### Existing Lib Files

| File | Size | Status vs PRD v3.2.0 |
|------|------|----------------------|
| `lib/prisma.ts` | 833 B | ✅ Matches |
| `lib/auth.ts` | 1.2 KB | ✅ Matches |
| `lib/format.ts` | 1.0 KB | ✅ Matches |
| `lib/validators.ts` | 8.7 KB | ✅ Matches |
| `lib/constants.ts` | 3.9 KB | ✅ Matches |
| `lib/subscription.ts` | 2.6 KB | ✅ Matches |
| `lib/nav.ts` | 2.2 KB | 🟡 Needs update (route renames) |
| `lib/utils.ts` | 166 B | ✅ Matches |
| `lib/cache.ts` | — | ❌ **Missing** — required by PRD §4 |
| `lib/queries.ts` | — | ❌ **Missing** — required by PRD §3.2 |
| `lib/types.ts` | — | ❌ **Missing** — required by PRD §3.3 |

### Existing Dialog Pattern — The Problem

The codebase has **5 separate dialog components**, each repeating the same boilerplate:

| Dialog File | Lines | Pattern |
|-------------|-------|---------|
| `project-dialog.tsx` | 392 | `useState(open)` + `useTransition` + Dialog + form + footer |
| `phase-dialog.tsx` | 291 | Same pattern, different fields |
| `subphase-dialog.tsx` | 228 | Same, but stub `handleSubmit` |
| `client-dialog.tsx` | 232 | Same + Zod validation |
| `create-client-dialog.tsx` | 195 | Duplicate of `client-dialog.tsx` with slight differences |

**Repeated boilerplate per dialog (~60 lines each):**
- `useState(open)` + `onOpenChange`
- `useTransition()` for pending state
- `DialogTrigger` → `DialogContent` → `DialogHeader` → form → `DialogFooter`
- Cancel/Submit buttons with loading state
- Form reset on close

---

## 2. PRD v3.0.0 → v3.2.0 — All Changes

### 2.1 New Sections Added

| Section | Description | Impact |
|---------|-------------|--------|
| **§4 Caching Strategy** | Complete `use cache` system with `cacheTag`, `cacheLife`, profiles, invalidation map | **High** — requires `lib/cache.ts`, `lib/queries.ts`, refactor all data fetching |
| **§3.2 `lib/queries.ts`** | All data reads must live in `queries.ts` with `'use cache'` directive | **High** — new canonical file |
| **§3.3 `lib/types.ts`** | All shared TypeScript types centralized | **Medium** — new file, migrate `components/project/types.ts` |

### 2.2 Architecture Changes

| Change | Before (v3.0.0) | After (v3.2.0) | Files Affected |
|--------|------------------|-----------------|----------------|
| Cache system | No caching strategy | Full `use cache` + `cacheTag` + `cacheLife` | New: `lib/cache.ts`, `lib/queries.ts` |
| Data fetching | Raw Prisma in pages | All via `lib/queries.ts` with caching | All `page.tsx` files |
| Type definitions | Inline / per-component | Centralized in `lib/types.ts` | All components, actions |
| Cache invalidation | `revalidatePath()` | `revalidateTag()` with specific tags | All server actions |
| Kanban route | `/unite/[unitId]/kanban` | `/unite/[unitId]/tasks` | Route files, `nav.ts` |

### 2.3 Route Changes

| Route | v3.0.0 | v3.2.0 | Change |
|-------|--------|--------|--------|
| `/unite/[unitId]/kanban` | Planned | Removed | → Renamed to `/tasks` |
| `/unite/[unitId]/tasks` | Not planned | ✅ Added | Kanban board route |
| `/unite/[unitId]/productions` | Not planned | ✅ Added | Unit-wide production page |
| `/unite` | Not planned | ✅ Added | Unit selection page (ADMIN) |
| `/company` | Not planned | ✅ Added | Onboarding launchpad |

### 2.4 Navigation Changes (in `lib/nav.ts`)

| Context | v3.0.0 | v3.2.0 | Change |
|---------|--------|--------|--------|
| ADMIN/OWNER Unit | "Kanban" | "Tâches" (`/unite/[unitId]/tasks`) | **Renamed** |
| ADMIN/OWNER Unit | — | "Production" (`/unite/[unitId]/productions`) | **Added** |
| OWNER Company | "Billing" | "Paiement" | **Renamed to FR** |
| USER | "Dashboard" | "Mon Espace" | **Renamed to FR** |

### 2.5 Data Model Mismatches (Schema vs PRD)

| # | Issue | Schema Has | PRD Says | Fix |
|---|-------|------------|----------|-----|
| 1 | User field typo | `jobeTitle` | `jobTitle` | Rename field |
| 2 | Invitation field typo | `jobeTilte` | `jobTitle` | Rename field |
| 3 | Notification field name | `notification` | `message` | Rename field |
| 4 | Company location field | `state` | `wilaya` | Rename field |
| 5 | Lane missing companyId | No `companyId` | Has `companyId` | Add field |

### 2.6 Missing lib Files (Required by PRD v3.2.0)

| File | Purpose | Status |
|------|---------|--------|
| `lib/cache.ts` | Cache tag constants + cacheLife profiles | ❌ Not created |
| `lib/queries.ts` | All data-fetching with `'use cache'` | ❌ Not created |
| `lib/types.ts` | Centralized TypeScript interfaces | ❌ Not created |

---

## 3. Reusable FormModal System — Design

### 3.1 Problem

Every dialog repeats ~60 lines of boilerplate. The project will need 10+ more dialogs (tasks, lanes, tags, production, time entries, comments, etc.). Without a reusable component, we'll duplicate hundreds of lines.

### 3.2 Solution: `FormModal` Component

Create `components/shared/form-modal.tsx` — a single reusable modal wrapper.

#### API Design

```tsx
<FormModal
  open={open}
  onOpenChange={setOpen}
  title="Créer un projet"
  description="Remplissez les informations pour créer un nouveau projet."
  trigger={<Button>Créer un projet</Button>}
  size="xl"                    // "sm" | "md" | "lg" | "xl" | "2xl"
  isPending={isPending}
  onSubmit={handleSubmit}
  submitLabel="Créer"
  submitPendingLabel="Création..."
  cancelLabel="Annuler"
  resetOnClose
>
  {/* Only the form fields go here — no boilerplate */}
  <div className="grid gap-4">
    <Input ... />
    <Select ... />
  </div>
</FormModal>
```

#### What FormModal Handles

| Concern | Handled |
|---------|---------|
| Open/close state | ✅ Controlled via `open`/`onOpenChange` props |
| Dialog structure | ✅ `DialogContent` + `DialogHeader` + `DialogFooter` |
| Form element | ✅ Wraps children in `<form onSubmit>` |
| Submit button | ✅ With `isPending` spinner/disabled state |
| Cancel button | ✅ Closes dialog |
| Size variants | ✅ `sm`=max-w-md, `md`=max-w-lg, `lg`=max-w-3xl, `xl`=max-w-5xl |
| Scroll overflow | ✅ `max-h-[90vh] overflow-y-auto` |
| Reset on close | ✅ Optional `onReset` callback |

#### What The Consumer Still Owns

| Concern | Consumer's Responsibility |
|---------|--------------------------|
| Form fields / layout | JSX children |
| Form state | `useState` for form data |
| Validation | Zod schema or manual |
| Server action call | Inside `handleSubmit` |
| `useTransition` | Consumer calls `startTransition` |
| Toast notifications | After action result |

### 3.3 `FormSection` Component

For multi-section forms (like project dialog), create `components/shared/form-section.tsx`:

```tsx
<FormSection number="01" title="Informations Générales">
  <Input ... />
</FormSection>

<FormSection number="02" title="Budget & Finances">
  <Input ... />
</FormSection>
```

This renders the numbered section header with the line separator that already exists in `project-dialog.tsx`.

### 3.4 Migration Plan

| Dialog | Action | Lines Saved |
|--------|--------|-------------|
| `project-dialog.tsx` | Refactor → `FormModal` + `FormSection` | ~80 lines |
| `phase-dialog.tsx` | Refactor → `FormModal` | ~50 lines |
| `subphase-dialog.tsx` | Refactor → `FormModal` | ~50 lines |
| `client-dialog.tsx` | Refactor → `FormModal` | ~40 lines |
| `create-client-dialog.tsx` | **Delete** — merge into `client-dialog.tsx` | -195 lines |
| **Future dialogs** | Use `FormModal` from the start | ~60 lines saved each |

---

## 4. Implementation Plan — 5 Phases

### Phase A: Reusable Modal System (Do First)

| # | Task | Files |
|---|------|-------|
| A.1 | Create `FormModal` component | `components/shared/form-modal.tsx` |
| A.2 | Create `FormSection` component | `components/shared/form-section.tsx` |
| A.3 | Refactor `project-dialog.tsx` → `FormModal` + `FormSection` | Modify existing |
| A.4 | Refactor `phase-dialog.tsx` → `FormModal` | Modify existing |
| A.5 | Refactor `subphase-dialog.tsx` → `FormModal` | Modify existing |
| A.6 | Refactor `client-dialog.tsx` → `FormModal` | Modify existing |
| A.7 | Delete `create-client-dialog.tsx` (duplicate) | Delete file |
| A.8 | Update all imports referencing deleted file | Modify consumers |

### Phase B: Schema Fixes

| # | Task | Files |
|---|------|-------|
| B.1 | Rename `User.jobeTitle` → `jobTitle` | `prisma/schema.prisma` |
| B.2 | Rename `Invitation.jobeTilte` → `jobTitle` | `prisma/schema.prisma` |
| B.3 | Rename `Notification.notification` → `message` | `prisma/schema.prisma` |
| B.4 | Rename `Company.state` → `wilaya` | `prisma/schema.prisma` |
| B.5 | Add `companyId` to `Lane` model | `prisma/schema.prisma` |
| B.6 | Run `prisma db push` or create migration | Command |
| B.7 | Update all code references to renamed fields | All affected files |

### Phase C: Cache & Data Architecture

| # | Task | Files |
|---|------|-------|
| C.1 | Create `lib/cache.ts` — all cache tag constants | New file |
| C.2 | Create `lib/types.ts` — centralized TypeScript types | New file |
| C.3 | Create `lib/queries.ts` — all data-fetching with `'use cache'` | New file |
| C.4 | Refactor all page.tsx to use `queries.ts` instead of raw Prisma | All pages |
| C.5 | Update all server actions: `revalidatePath()` → `revalidateTag()` | All actions |

### Phase D: Route & Navigation Updates

| # | Task | Files |
|---|------|-------|
| D.1 | Update `lib/nav.ts` — FR labels, route renames, add Production | Modify |
| D.2 | Create `/unite/[unitId]/tasks/page.tsx` (Kanban route) | New file |
| D.3 | Create `/unite/[unitId]/productions/page.tsx` | New file |

### Phase E: Wire Stub Dialogs & Complete M6

| # | Task | Files |
|---|------|-------|
| E.1 | Wire `PhaseDialog.handleSubmit` → `actions/phase.ts` | Modify |
| E.2 | Wire `SubPhaseDialog.handleSubmit` → `actions/subphase.ts` | Modify |
| E.3 | Create project detail page with tabs | New page |
| E.4 | Wire team management UI | Modify |
| E.5 | Connect documents tab to Uploadthing | Modify |

---

## 5. Priority & Execution Order

| # | Phase | Priority | Estimated Effort |
|---|-------|----------|-----------------|
| 1 | **A: FormModal System** | 🔴 High | 2-3 hours |
| 2 | **B: Schema Fixes** | 🔴 High | 1 hour |
| 3 | **C: Cache & Data Architecture** | 🟡 Medium | 3-4 hours |
| 4 | **D: Route & Nav Updates** | 🟡 Medium | 1 hour |
| 5 | **E: Wire & Complete M6** | 🟢 Normal | 4-6 hours |

---

## 6. Open Questions

1. **Schema migration strategy**: Field renames (`jobeTitle` → `jobTitle`, `state` → `wilaya`, etc.) require a migration. Should I use `prisma migrate dev` (preserves data) or `prisma db push` (may reset)?

2. **Delete duplicate?** `create-client-dialog.tsx` duplicates `client-dialog.tsx`. Should I merge into one and delete the duplicate?

3. **Route rename timing**: Rename `/kanban` → `/tasks` now, or wait until Kanban milestone?

4. **Cache strategy timing**: `use cache` requires Next.js 16 experimental flag. Enable now or wait?

5. **Which phase to start with?** FormModal system (Phase A) or Schema fixes (Phase B)?

---

_End of Changes Document — PMA PRD v3.0.0 → v3.2.0_

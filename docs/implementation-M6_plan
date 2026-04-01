# Milestone 6: Project Management & Phases

> **Goal:** Project CRUD, team management, phase/sub-phase management with all business rules.
> **Depends on:** Milestone 5 (clients exist for project linking)
> **Branch:** `feature/project-management-phases` (from `staging`)

---

## User Review Required

> [!IMPORTANT]
> This is the largest milestone so far — **17 tasks** spanning server actions, 4+ pages, and multiple dialogs with critical business rules (BR-10, BR-11, BR-12). I'll implement it in 3 phases to keep commits atomic and testable.

> [!WARNING]
> The Documents tab (6.9) requires Uploadthing integration. The upload router `projectDocument` already exists in `app/api/uploadthing/core.ts`. Confirm this is still correct or if you want changes to file types/size limits.

---

## Proposed Changes

### Phase A: Server Actions (Backend First)

All server actions follow the established pattern from `actions/client.ts`: authenticate → RBAC → subscription check → validate → scope check → business rules → mutate → revalidate.

---

#### [NEW] [project.ts](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/actions/project.ts)

Server actions for projects:

- **`createProject(data)`** — ADMIN/OWNER only
  - Validates with `projectSchema`
  - Checks `Plan.maxProjects` before INSERT (PROJ-12, BR-05)
  - Verifies `code` uniqueness within unit
  - Auto-creates empty `Team` record (PROJ-07)
  - All scoped by `companyId` (BR-01)
  
- **`updateProject(data)`** — ADMIN/OWNER only
  - Validates status lifecycle: `New → InProgress → Pause → Complete` (PROJ-03)
  - Scoped by `companyId`

- **`archiveProject(projectId)`** — ADMIN/OWNER only
  - Soft delete via status change or a flag (PROJ-11)
  - Scoped by `companyId`

---

#### [NEW] [phase.ts](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/actions/phase.ts)

Server actions for phases:

- **`createPhase(data)`** — ADMIN/OWNER only
  - **CRITICAL BR-11:** `Phase.startDate >= Project.ods` — hard block
  - **CRITICAL BR-10:** `Σ Phase.montantHT <= Project.montantHT` — hard block, show remaining budget in error
  - Auto-calculates `duration = endDate - startDate` in calendar days (PH-04)
  
- **`updatePhase(data)`** — same business rules as create
  - Recalculates `duration` on every save
  - If SubPhases exist, recalculates `Phase.progress` as average of SubPhase.progress (PH-09)
  
- **`deletePhase(phaseId)`** — ADMIN/OWNER only, cascades SubPhases

---

#### [NEW] [subphase.ts](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/actions/subphase.ts)

Server actions for sub-phases:

- **`createSubPhase(data)`** — ADMIN/OWNER only
  - **CRITICAL BR-12:** SubPhase dates must be within parent Phase date range — hard block
  - After create, recalculates parent `Phase.progress` as average of SubPhase.progress

- **`updateSubPhase(data)`** — same date validation
  - After update, recalculates parent `Phase.progress`
  
- **`deleteSubPhase(subPhaseId)`** — ADMIN/OWNER only
  - After delete, recalculates parent `Phase.progress`

---

#### [NEW] [team.ts](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/actions/team.ts)

- **`addTeamMember(data)`** — ADMIN/OWNER only
  - User must be a member of the project's Unit
  - Creates `TeamMember` record with roleLabel

- **`removeTeamMember(memberId)`** — ADMIN/OWNER only
  - Does NOT unassign tasks (BR-16 pattern: data retained)

---

#### [NEW] [gantt-marker.ts](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/actions/gantt-marker.ts)

- **`createGanttMarker(data)`** — ADMIN/OWNER only
- **`updateGanttMarker(data)`** — ADMIN/OWNER only
- **`deleteGanttMarker(id)`** — ADMIN/OWNER only

---

### Phase B: Pages & UI Components

---

#### [NEW] [page.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/page.tsx) — Project List

- Server Component page
- RBAC filtering (PROJ-08):
  - OWNER: sees all projects across units
  - ADMIN: sees unit projects
  - USER: sees only assigned (via `TeamMember`)
- Table/card list: name, code, client, status, montantTTC, progress, ODS date
- Client-side filter bar: status, client dropdown
- Sort by: date, montantTTC (PROJ-09)
- Create project button (ADMIN/OWNER only)

#### [NEW] [loading.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/loading.tsx) — Loading Skeleton

---

#### [NEW] [project-list.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-list.tsx)

Client component with:
- Search by name/code
- Filter by status (`New | InProgress | Pause | Complete`)
- Filter by client (dropdown)
- Sort toggle (date / montantTTC)
- Status badge with color coding
- Progress bar display
- DataTable rendering with dropdown actions (View, Edit, Archive)

#### [NEW] [project-dialog.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-dialog.tsx)

Create/Edit dialog with form fields:
- name, code, type, montantHT, montantTTC, ODS date (calendar picker), delaiMonths, delaiDays, status, signe (switch), clientId (dropdown)
- Plan limit check feedback on submit

---

#### [NEW] [page.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx) — Project Detail

Tabbed layout using shadcn `Tabs`:
- **Overview** | Gantt | Production | Tasks | Time Tracking | Documents
- Server Component that fetches project with all relations
- Auth guard + RBAC + companyId scope

#### [NEW] [loading.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/app/(dashboard)/unite/[unitId]/projects/[projectId]/loading.tsx)

---

#### [NEW] [project-overview.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-overview.tsx)

Overview tab content (PROJ-05):
- **Financial card:** montantHT, montantTTC, TVA amount (`TTC - HT`), TVA % (`((TTC-HT)/HT)*100`)
- **Progress bar:** weighted average by phase montantHT (BR-17)
- **Team members** list with role labels
- **Client info** card
- **ODS date + Délai** display (`X mois Y jours`)
- All monetary amounts in `1 234 567,89 DA` format

---

#### [NEW] [project-team.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-team.tsx)

Team management within project overview:
- List current team members with roleLabel
- Add member dropdown (filtered to unit members not already on team)
- Remove member button (ADMIN/OWNER only)

---

#### [NEW] [phase-list.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/phase-list.tsx)

Phase section (shown on Overview tab or as standalone section):
- Table/card list of phases: name, code, montantHT, dates, status, progress bar
- Remaining budget indicator: `Project.montantHT - Σ Phase.montantHT`
- Create phase button → PhaseDialog

#### [NEW] [phase-dialog.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/phase-dialog.tsx)

Phase create/edit dialog:
- Fields: name, code, montantHT, startDate, endDate, status, observations, progress
- Shows remaining budget inline
- `duration` auto-calculated as `(endDate - startDate)` days (PH-04)
- Error display for BR-10 (budget exceeded) and BR-11 (date before ODS)

#### [NEW] [subphase-dialog.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/subphase-dialog.tsx)

SubPhase create/edit dialog:
- Fields: name, code, status (TODO/COMPLETED), progress, startDate, endDate
- Error display for BR-12 (dates outside parent Phase range)

---

### Phase C: Documents Tab

#### [NEW] [project-documents.tsx](file:///c:/Users/Cir-Merabet/Desktop/WebApp/pma-app/components/project/project-documents.tsx)

Documents tab using Uploadthing (PROJ-10):
- Upload PDFs, images, drawings via Uploadthing `projectDocument` router
- File list with name, type, size, upload date
- Download and delete actions

> [!NOTE]
> We'll need a `Document` model or store file metadata. Since the Prisma schema doesn't have a `Document` model yet, we'll store document metadata alongside the Uploadthing response. We can either:
> - **(Option A)** Add a `ProjectDocument` model to Prisma — cleaner, allows search/filter
> - **(Option B)** Use Uploadthing metadata only — simpler, no schema change
>
> I recommend **Option A** for proper document management. This would require a small schema addition.

---

## Open Questions

> [!IMPORTANT]
> **1. Documents storage model:** Should we add a `ProjectDocument` model to Prisma for document metadata (name, url, type, size, projectId), or store files in Uploadthing only and query their API? Recommend Prisma model.

> [!IMPORTANT]
> **2. Project archive behavior:** The PRD says "soft delete (archive)". Should archived projects be hidden from lists by default with a toggle to show them, or moved to a separate "Archived" section?

> [!NOTE]
> **3. Gantt tab placeholder:** Milestone 7 covers the full Gantt chart. For now, the Gantt tab will show a placeholder with the phase list in a simplified timeline view. Is that acceptable?

---

## Verification Plan

### Automated Tests
```bash
pnpm typecheck   # Must pass with zero errors
pnpm lint        # Must pass clean
pnpm format      # All files formatted
```

### Browser Verification (Devtools MCP)
- Navigate to `/unite/[unitId]/projects` — verify project list renders with correct RBAC filtering
- Create a project — verify plan limit check, auto-team creation, and client linking
- Navigate to project detail — verify all 6 tabs render
- Create a phase — verify BR-10 (budget block) and BR-11 (ODS date block) work
- Create a sub-phase — verify BR-12 (date range block) works
- Add/remove team members — verify unit member scoping
- Upload a document — verify Uploadthing integration

### Manual Verification
- Verify `companyId` scoping on all queries (BR-01) via code review
- Verify role checks in all server actions (SEC-02)
- Verify French error messages for all validation failures

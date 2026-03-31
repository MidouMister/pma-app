# PMA — Project Tasks & Milestones

> **Project:** PMA (Project Management App)
> **PRD Version:** 3.0.0
> **Last Updated:** 2026-03-30 (Milestone 1 complete)
> **Plan Reference:** [implementation_plan.md](./implementation_plan.md)
> **Schema Reference:** [schema.prisma](./schema.prisma)
> **PRD Reference:** [PRD.md](./PRD.md)

---

## How to Read This File

- `[ ]` = Not started
- `[/]` = In progress
- `[x]` = Completed (add completion date: `[x] 2026-MM-DD`)
- Each milestone has a **status line** and a **depends on** line
- PRD requirement IDs (e.g., `AUTH-01`, `BR-05`) are referenced for traceability
- **CRITICAL** tags mark tasks with hard business rules or data constraints
- **BLOCKER** tags mark tasks that block downstream milestones

---

## Tech Stack Summary (Do Not Deviate)

| Layer           | Technology                 | Version |
| --------------- | -------------------------- | ------- |
| Framework       | Next.js (App Router)       | 16      |
| UI              | React                      | 19      |
| Styling         | Tailwind CSS               | 4       |
| Components      | shadcn/ui                  | v4      |
| Database ORM    | Prisma                     | 7       |
| Database        | Supabase (PostgreSQL only) | —       |
| Auth            | Clerk                      | —       |
| File Uploads    | Uploadthing                | —       |
| State           | Jotai                      | —       |
| Gantt           | kibo-ui Gantt              | —       |
| Kanban          | kibo-ui Kanban             | —       |
| Package Manager | pnpm                       | —       |

---

## Milestone 1: Foundation & Database

**Status:** `[x] COMPLETED 2026-03-30`
**Depends on:** Nothing (first milestone)
**Goal:** Establish the database schema, install core dependencies, configure auth and file upload providers.

### 1.1 — Prisma Schema Setup

- [x] **BLOCKER** Copy `docs/schema.prisma` to `prisma/schema.prisma` and apply all PRD alignment fixes: ✅ 2026-03-30
  - [x] Add `clerkId String @unique` to User model (AUTH-07)
  - [x] Add `companyId String` to Project, Client, Task, TimeEntry models (BR-01)
  - [x] Replace `delai String` on Project with `delaiMonths Int` + `delaiDays Int` (BR-18)
  - [x] Add `productionAlertThreshold Int @default(80)` to Company model (PROD-09, BR-15)
  - [x] Create `SubscriptionStatus` enum: TRIAL|ACTIVE|GRACE|READONLY|SUSPENDED (SUB-06)
  - [x] Rename `Plan.monthlyCost` → `Plan.priceDA`
  - [x] Rename `Plan.userLimit` → `Plan.maxMembers`
  - [x] Add `token String @unique` and `expiresAt DateTime` to Invitation (INV-02, INV-05)
  - [x] Change Invitation `@@unique([email, unitId])` (INV-04)
  - [x] Change Client `@@unique([name, unitId])` and `@@unique([email, unitId])` (CLT-03)
  - [x] Add `projectId`, `phaseId`, `subPhaseId` + relations to Task (TASK-02, TASK-03)
  - [x] Add `phaseId` + relation to Production
  - [x] Create `TaskComment` model (TASK-19 to TASK-25)
  - [x] Create `TaskMention` model with `@@unique([commentId, mentionedUserId])` (TASK-26 to TASK-29)
  - [x] Create `ActivityLog` model (ACT-01 to ACT-02)
  - [x] Rename Phase `start`/`end` → `startDate`/`endDate`
  - [x] Rename SubPhase `start`/`end` → `startDate`/`endDate`
  - [x] Add `logo String?` to Unit model (UNIT-02)
  - [x] Add `InvitationStatus.EXPIRED` enum value (INV-06)
- [x] Run `pnpm prisma validate` — schema valid
- [x] Run `pnpm prisma generate`

### 1.2 — Core Dependencies ✅ 2026-03-30

- [x] Install Clerk: `@clerk/nextjs`
- [x] Install Uploadthing: `uploadthing @uploadthing/react`
- [x] Install Jotai: `jotai`
- [x] Install Zod: `zod`
- [x] Install Svix: `svix`

### 1.3 — Core Library Files ✅ 2026-03-30

- [x] Create `lib/prisma.ts` — Prisma client singleton
- [x] Create `lib/auth.ts` — `getCurrentUser()`, `requireRole()`, `requireCompanyScope()`, `requireUnitScope()`
- [x] Create `lib/format.ts` — Algerian currency, dates, delai formatting
- [x] Create `lib/validators.ts` — Zod schemas for all entities
- [x] Create `lib/constants.ts` — Plan tiers, wilayas (48), status colors, notification types
- [x] Create `lib/subscription.ts` — Subscription status computation

### 1.4 — Clerk Configuration ✅ 2026-03-30

- [x] Clerk environment variables in `.env` (placeholders)
- [x] Create `proxy.ts` — protect `/dashboard`, `/company`, `/unite`, `/user`, `/onboarding` (Next.js 16 uses `proxy.ts`, not `middleware.ts`)
- [x] Wrap root layout with `<ClerkProvider>`

### 1.5 — Uploadthing Configuration ✅ 2026-03-30

- [x] Uploadthing environment variable in `.env` (placeholder)
- [x] Create `app/api/uploadthing/core.ts` — companyLogo, unitLogo, projectDocument routers
- [x] Create `app/api/uploadthing/route.ts` — route handler

### 1.6 — Seed Data ✅ 2026-03-30

- [x] Create `prisma/seed.ts` — Starter, Pro, Premium Plan records
- [x] Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to package.json
- [x] Run seed: `pnpm prisma db seed` (run after `pnpm prisma db push`)

### 1.7 — shadcn/ui Components ✅ 2026-03-30

- [x] Installed 28 components: alert, avatar, badge, button, calendar, card, checkbox, command, dialog, dropdown-menu, input-group, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, switch, table, tabs, textarea, tooltip
      sidebar, sheet, dialog, tabs, form, input, select, label, textarea,
      badge, avatar, dropdown-menu, table, progress, skeleton, card,
      separator, tooltip, popover, command, calendar, alert, checkbox,
      radio-group, switch, scroll-area, sonner

  ```

  ```

---

## Milestone 2: Layout & Navigation

**Status:** `[x] COMPLETED 2026-03-31`
**Depends on:** Milestone 1 (Clerk, Prisma, shadcn components)
**Goal:** Build the app shell with sidebar, role-based navigation, and redirect hub.

### 2.1 — Sidebar Foundation

- [x] Install shadcn `sidebar-07` block as the sidebar base using `npx shadcn@latest add sidebar-07`
- [x] Create `components/sidebar/app-sidebar.tsx` — main sidebar component
- [x] Create `components/sidebar/company-unit-switcher.tsx` — OWNER switcher between Company view and Unit views
- [x] Create `components/sidebar/nav-main.tsx` — main navigation section
- [x] Create `components/sidebar/nav-user.tsx` — user profile section at bottom

### 2.2 — Navigation Source of Truth

- [x] **BLOCKER** Create `lib/nav.ts` — all nav items defined here, filtered by role:
  - OWNER Company view: Dashboard, Units, Team, Billing, Settings
  - OWNER Unit view (when unit selected): same as ADMIN view
  - ADMIN view: Dashboard, Projects, Kanban, Clients, Members, Settings
  - USER view: Dashboard (personal), Projects (assigned), Notifications

### 2.3 — Dashboard Layout

- [x] Create `app/(dashboard)/layout.tsx` — wraps all protected pages with SidebarProvider + auth check
- [x] Implement auth guard: redirect unauthenticated users to `/company/sign-in`
- [x] Implement onboarding redirect: user with no company → `/onboarding`
- [x] Pass user data (role, companyId, unitId) to sidebar via server component

### 2.4 — Redirect Hub

- [x] Create `app/(dashboard)/dashboard/page.tsx` — pure redirect, no UI:
  - OWNER → `/company/[companyId]`
  - ADMIN → `/unite/[unitId]`
  - USER → `/user/[userId]`

### 2.5 — Shared Components

- [x] Create `components/shared/page-header.tsx` — reusable page header with title, description, action buttons
- [x] Create `components/shared/data-table.tsx` — reusable data table wrapper over shadcn Table
- [x] Create `components/shared/empty-state.tsx` — reusable empty state with icon, message, and CTA
- [x] Create `components/shared/loading-skeleton.tsx` — page-level loading skeleton

---

## Milestone 3: Onboarding & Auth Flow

**Status:** `[x] COMPLETED 2026-03-31`
**Depends on:** Milestone 1 (Clerk), Milestone 2 (Layout)
**Goal:** Complete user journey from sign-up → onboarding wizard → first dashboard.

### 3.1 — Auth Pages

- [x] Create `app/(auth)/company/sign-in/[[...sign-in]]/page.tsx` — Clerk SignIn component (AUTH-01) ✅ 2026-03-31
- [x] Create `app/(auth)/company/sign-up/[[...sign-up]]/page.tsx` — Clerk SignUp component (AUTH-01) ✅ 2026-03-31
- [x] Create `app/(auth)/layout.tsx` — centered auth layout with branding ✅ 2026-03-31

### 3.2 — Clerk Webhook

- [x] **BLOCKER** Create `app/api/webhooks/clerk/route.ts` — handle `user.created` event (AUTH-07): ✅ 2026-03-31
  - Verify webhook signature via Svix
  - Check if pending Invitation exists for the user's email
  - If invitation found: create User record, assign to Unit with invited role, mark invitation ACCEPTED
  - If no invitation: create User record without company/unit (triggers onboarding)

### 3.3 — Onboarding Wizard

- [x] Create `app/(dashboard)/onboarding/page.tsx` — multi-step wizard container ✅ 2026-03-31
- [x] Create `components/onboarding/step-company.tsx` — Step 1: Company Profile form (AUTH-03): ✅ 2026-03-31
  - Fields: name, logo (Uploadthing), formJur, NIF, sector, wilaya (dropdown), address, phone, email
- [x] Create `components/onboarding/step-unit.tsx` — Step 2: First Unit (AUTH-04): ✅ 2026-03-31
  - Fields: name, address, phone, email
- [x] Create `components/onboarding/step-invite.tsx` — Step 3: Invite Team (AUTH-05): ✅ 2026-03-31
  - Fields: email + role picker (ADMIN/USER) — skippable
- [x] Create `actions/onboarding.ts` — server action `completeOnboarding()`: ✅ 2026-03-31
  - Create Company record with OWNER (AUTH-04)
  - Create first Unit (AUTH-04)
  - Auto-create Starter trial Subscription (startAt=now, endAt=now+2mo) (SUB-01)
  - Send invitations if provided (INV-02)
  - Set user role to OWNER, unitId to null (AUTH-04)

---

## Post-Milestone Fixes

### Fix: Sign-Up → Onboarding Redirect Loop (2026-03-31)

**Problem:** After sign-up, users redirected to `/company/sign-in` instead of `/onboarding` due to race condition between Clerk auth and Prisma User creation via webhook.

**Root Cause:** Dashboard layout called `getCurrentUser()` (which queries Prisma) before checking if Clerk had authenticated the user. Webhook hadn't processed yet → no Prisma record → redirect to sign-in.

**Fix:** Applied two-step auth guard pattern across all protected pages:

1. Check Clerk `auth()` first → redirect to `/company/sign-in` if unauthenticated
2. Then check Prisma record → redirect to `/onboarding` if authenticated but no user record

**Files changed:**

- `app/(dashboard)/layout.tsx` — Clerk auth check before Prisma, fallback to `/onboarding`
- `app/(dashboard)/onboarding/page.tsx` — Clerk auth check, allow through if no Prisma user (new user)
- `app/(dashboard)/dashboard/page.tsx` — Clerk auth check before Prisma, fallback to `/onboarding`

**Branch:** `fix/sign-up-redirect-loop` → PR target: `staging`

---

## Milestone 4: Company & Unit Management

**Status:** `[x] COMPLETED 2026-03-31`
**Depends on:** Milestone 3 (onboarding creates company/unit)
**Goal:** OWNER manages company, units, team, and billing. ADMIN manages their unit.

### 4.1 — Company Dashboard

- [x] Create `app/(dashboard)/company/[companyId]/page.tsx` — KPI cards:
  - Total units, total projects, total members, total contract value (TTC), active projects count
  - Units overview list with project count per unit (COMP-05) ✅ 2026-03-31

### 4.2 — Company Settings

- [x] Create `app/(dashboard)/company/[companyId]/settings/page.tsx` (COMP-01): ✅ 2026-03-31
  - Edit: name, logo (Uploadthing), address, phone, email, formJur, NIF, sector, wilaya
  - Edit: `productionAlertThreshold` (1-100 slider/input) (PROD-09)
- [x] Create `actions/company.ts` — `updateCompany()` server action ✅ 2026-03-31

### 4.3 — Billing Page ✅ 2026-03-31

- [x] Create `app/(dashboard)/company/[companyId]/settings/billing/page.tsx` (SUB-08): ✅ 2026-03-31
  - Current plan name and tier
  - Usage vs limits: units, projects, members, tasks per project
  - Trial countdown (if status=TRIAL): days remaining until expiry
  - Upgrade CTA button (SUB-04): opens upgrade request form (plan picker, payment method, contact)
- [x] Create `components/company/upgrade-request-dialog.tsx` — Client component for upgrade request form ✅ 2026-03-31
- [x] Create `actions/subscription.ts` — `submitUpgradeRequest()` server action ✅ 2026-03-31
- [x] Add `UpgradeRequest` model to Prisma schema ✅ 2026-03-31

### 4.4 — Units Management ✅ 2026-03-31

- [x] Create `app/(dashboard)/company/[companyId]/units/page.tsx` (UNIT-01, UNIT-05): ✅ 2026-03-31
  - List all units with name, admin, member count, project count
  - Create unit button (checks Plan.maxUnits before allowing — BR-05)
  - Delete unit with confirmation dialog (UNIT-06)
- [x] Create `actions/unit.ts` — `createUnit()`, `updateUnit()`, `deleteUnit()` server actions ✅ 2026-03-31
  - **CRITICAL** `createUnit` must check `Plan.maxUnits` limit (BR-05)
  - **CRITICAL** `deleteUnit` cascades to all projects, tasks, clients, members (UNIT-06)

### 4.5 — Company Team Page

- [x] Create `app/(dashboard)/company/[companyId]/users/page.tsx` (INV-09): ✅ 2026-03-31
  - Table of all members across all units with: name, email, role, unit, joined date
  - Pending invitations list
  - Invite member button with unit picker + role picker

### 4.6 — Unit Pages ✅ 2026-03-31

- [x] Create `app/(dashboard)/unite/[unitId]/page.tsx` — Unit Dashboard: ✅ 2026-03-31
  - Unit KPIs: projects count, active projects, team size, total contract value
  - Recent activity feed
  - Recent projects (last 5)
- [x] Create `app/(dashboard)/unite/[unitId]/loading.tsx` — Loading skeleton ✅ 2026-03-31
- [x] Create `app/(dashboard)/unite/[unitId]/settings/page.tsx` — Unit Settings: ✅ 2026-03-31
  - Edit unit name, logo (UploadThing), address, phone, email
- [x] Create `app/(dashboard)/unite/[unitId]/members/page.tsx` — Unit Members (INV-01 to INV-09): ✅ 2026-03-31
  - List unit members with role, joined date
  - Invite member form (email + role)
  - Remove member button (BR-16: data retained, access revoked)
  - OWNER can reassign ADMIN role (UNIT-04)
  - **CRITICAL** Check `Plan.maxMembers` before invite (INV-08)

### 4.7 — Invitation Server Actions

- [x] Create `actions/invitation.ts`: ✅ 2026-03-31
  - `sendInvitation()` — create Invitation record, send email via Clerk (INV-02)
  - `revokeInvitation()` — set status to EXPIRED (INV-06)
  - **CRITICAL** Reject duplicate invitations to same email within same unit (INV-04)
  - **CRITICAL** Check `Plan.maxMembers` before sending (INV-08)
  - **CRITICAL** Reject if invitation `expiresAt` has passed (INV-05)

---

## Milestone 5: Client CRM

**Status:** `[ ] NOT STARTED`
**Depends on:** Milestone 4 (unit pages exist)
**Goal:** Unit-scoped client management with linked project visibility.

### 5.1 — Client List

- [ ] Create `app/(dashboard)/unite/[unitId]/clients/page.tsx` (CLT-01, CLT-06):
  - Table: name, wilaya, phone, email, project count, total TTC value
  - Search by name
  - Sort by name or total contract value
  - Create client button

### 5.2 — Client Profile

- [ ] Create `app/(dashboard)/unite/[unitId]/clients/[clientId]/page.tsx` (CLT-04):
  - Contact details section (name, wilaya, phone, email)
  - Linked projects list with status and montantTTC
  - Total TTC across all projects
  - Edit and Delete buttons (ADMIN/OWNER only)

### 5.3 — Client Server Actions

- [ ] Create `actions/client.ts`:
  - `createClient()` — with unit scope and companyId (CLT-02)
  - `updateClient()` — ADMIN/OWNER only (CLT-02)
  - `deleteClient()` — **CRITICAL** block if any project is `InProgress` (CLT-07, BR-20)
  - All queries scoped by `companyId` (BR-01)

### 5.4 — Client RBAC

- [ ] USERs can only view clients linked to their assigned projects (CLT-05)
- [ ] ADMIN/OWNER have full CRUD access within their unit scope

---

## Milestone 6: Project Management & Phases

**Status:** `[ ] NOT STARTED`
**Depends on:** Milestone 5 (clients exist for project linking)
**Goal:** Project CRUD, team management, phase/sub-phase management with all business rules.

### 6.1 — Project List

- [ ] Create `app/(dashboard)/unite/[unitId]/projects/page.tsx` (PROJ-08, PROJ-09):
  - Table/card list: name, code, client, status, montantTTC, progress, ODS date
  - Filter by: status, client | OWNER also filters by unit
  - Sort by: date, montantTTC
  - OWNER sees all projects across units; ADMIN sees unit projects; USER sees assigned only

### 6.2 — Project Create/Edit

- [ ] Create project creation form (PROJ-01, PROJ-02):
  - Fields: name, code (unique within unit), type, montantHT, montantTTC, ODS date, delaiMonths, delaiDays, status, signe (boolean), clientId (dropdown)
  - **CRITICAL** Check `Plan.maxProjects` before INSERT (PROJ-12, BR-05)
- [ ] Auto-create empty Team on project creation (PROJ-07)

### 6.3 — Project Detail Page

- [ ] Create `app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx` (PROJ-06):
  - Tab navigation: Overview | Gantt | Production | Tasks | Time Tracking | Documents

### 6.4 — Project Overview Tab

- [ ] Build Overview tab content (PROJ-05):
  - Financial card: montantHT, montantTTC, TVA amount (`TTC - HT`), TVA % (`((TTC-HT)/HT)*100`)
  - Progress bar: weighted average of phase progress by montantHT (BR-17)
  - Team members list with role labels
  - Client info card
  - ODS date + Delai display (`X mois Y jours`) (BR-18)
  - All monetary amounts in Algerian format: `1 234 567,89 DA`

### 6.5 — Team Management

- [ ] Build team management section within project:
  - Add team member (dropdown from unit members) — creates TeamMember record
  - Remove team member
  - Role label assignment per team member
- [ ] Create `actions/team.ts`: `addTeamMember()`, `removeTeamMember()`

### 6.6 — Phase CRUD

- [ ] Create Phase creation/edit form (PH-01, PH-02):
  - Fields: name, code, montantHT, startDate, endDate, status, observations, progress (0-100)
  - `duration` auto-calculated as `(endDate - startDate)` in calendar days (PH-04)
  - **CRITICAL** `Phase.startDate >= Project.ods` — hard block on save (PH-03, BR-11)
  - **CRITICAL** Sum of all `Phase.montantHT` <= `Project.montantHT` — hard block with remaining budget shown (PH-05, BR-10)
- [ ] Create `actions/phase.ts`: `createPhase()`, `updatePhase()`, `deletePhase()`

### 6.7 — SubPhase CRUD

- [ ] Create SubPhase creation/edit form (PH-06, PH-07):
  - Fields: name, code, status (TODO/COMPLETED), progress (0-100), startDate, endDate
  - **CRITICAL** SubPhase dates must be within parent Phase date range (PH-08, BR-12)
- [ ] Auto-calculate Phase.progress as average of SubPhase.progress when SubPhases exist (PH-09)
- [ ] Create `actions/subphase.ts`: `createSubPhase()`, `updateSubPhase()`, `deleteSubPhase()`

### 6.8 — GanttMarker CRUD

- [ ] Create GanttMarker form (PH-10): label, date, optional className
- [ ] Create `actions/gantt-marker.ts`: `createGanttMarker()`, `updateGanttMarker()`, `deleteGanttMarker()`

### 6.9 — Documents Tab

- [ ] Build Documents tab with Uploadthing file upload (PROJ-10):
  - Upload PDFs, images, drawings
  - File list with name, type, size, upload date
  - Download and delete actions

### 6.10 — Project Server Actions

- [ ] Create `actions/project.ts`:
  - `createProject()` — with plan limit check, auto-create team (PROJ-01, PROJ-07, PROJ-12)
  - `updateProject()` — validate status lifecycle (PROJ-03)
  - `archiveProject()` — soft delete (PROJ-11)
  - All queries scoped by `companyId` (BR-01)

---

## Milestone 7: Gantt Chart

**Status:** `[ ] NOT STARTED`
**Depends on:** Milestone 6 (phases and sub-phases exist)
**Goal:** Interactive Gantt chart visualization using kibo-ui.

### 7.1 — Installation

- [ ] Install kibo-ui Gantt: `npx kibo-ui add gantt`

### 7.2 — Gantt Wrapper Component

- [ ] Create `components/gantt/project-gantt.tsx`:
  - Fetch phases and sub-phases for the project
  - Map to kibo-ui Gantt data format
  - Phases as horizontal bars, color-coded by status (GNT-01)
  - SubPhases as nested/indented bars beneath parent (GNT-02)
  - GanttMarkers as vertical dashed lines with diamond + label (GNT-03)
  - Today marker (GNT-TODAY)

### 7.3 — Custom Features

- [ ] Progress fill overlay on each phase bar (GNT-04)
- [ ] Month / Week / Day zoom toggle wired to timeline range props (GNT-05)
- [ ] Drag-to-reschedule for ADMIN/OWNER; read-only for USER (GNT-06)
- [ ] Phase bar click → Phase detail side sheet using shadcn Sheet (GNT-07)
- [ ] Overlap warning indicator for phases with overlapping date ranges (PH-11)

### 7.4 — Gantt Server Actions

- [ ] Handle drag-end: `updatePhaseSchedule()` — update startDate, endDate, auto-recalculate duration

---

## Milestone 8: Kanban Board & Tasks

**Status:** `[ ] NOT STARTED`
**Depends on:** Milestone 6 (projects/phases exist), Milestone 2 (layout)
**Goal:** Full Kanban board with lane management, task CRUD, comments, and @mentions.

### 8.1 — Installation

- [ ] Install kibo-ui Kanban: `npx kibo-ui add kanban`

### 8.2 — Lane Management

- [ ] Create `actions/lane.ts`: `createLane()`, `updateLane()`, `deleteLane()`, `reorderLanes()` (LANE-01 to LANE-04)
- [ ] Lane fields: name, color, order (LANE-02, LANE-03)
- [ ] Lanes are Unit-scoped (LANE-01, BR-21)
- [ ] Delete lane with tasks → prompt confirmation, unassign tasks (LANE-04)

### 8.3 — Kanban Board Page

- [ ] Create `app/(dashboard)/unite/[unitId]/kanban/page.tsx`:
  - Render kibo-ui Kanban with lanes as columns
  - Task cards showing: title, assignee avatar, due date, tags, overdue badge (TASK-08, TASK-11)
  - Overdue badge: red badge when `dueDate < NOW && !complete` (TASK-11)
  - Phase and SubPhase NOT shown on card — only in detail sheet (TASK-14)

### 8.4 — Cascading Filter Bar

- [ ] Build filter bar above Kanban (TASK-18):
  - Dropdown 1: Project (filters tasks to selected project)
  - Dropdown 2: Phase (narrows to selected project's phases)
  - Dropdown 3: SubPhase (narrows to selected phase's sub-phases)
  - Each selection cascades and narrows downstream dropdowns

### 8.5 — Drag and Drop

- [ ] ADMIN/OWNER can drag any task between lanes (TASK-09)
- [ ] USER can drag only their own assigned tasks (TASK-10)
- [ ] On drop: update `laneId` and `order` via server action

### 8.6 — Task CRUD

- [ ] Create `actions/task.ts`:
  - `createTask()`:
    - **CRITICAL** `projectId` derived from `Phase.projectId` server-side (TASK-03)
    - **CRITICAL** `assignedUserId` must be TeamMember of project (TASK-04)
    - **CRITICAL** `subPhaseId` must be child of `phaseId` (TASK-05)
    - **CRITICAL** Check `Plan.maxTasksPerProject` before INSERT (TASK-06)
    - Send TASK notification to assigned user (TASK-07)
  - `updateTask()` — same validations as create
  - `deleteTask()`
  - `moveTask()` — update laneId + order on drag-drop
  - `completeTask()` — USER can complete own tasks; ADMIN/OWNER can complete any (TASK-15)
    - Task completion does NOT auto-update SubPhase.progress (TASK-16)

### 8.7 — Task Detail Side Sheet

- [ ] Create `components/kanban/task-detail-sheet.tsx` — 480px slide-over (TASK-12):
  - Title (editable)
  - Description (editable)
  - Status / Complete toggle
  - Current lane display
  - Assignee picker (dropdown of TeamMembers) (TASK-13)
  - Due date picker (TASK-13)
  - Tags section (add/remove tags) (TASK-13)
  - Project → Phase → SubPhase context section (display only) (TASK-13, TASK-14)
  - Time entries for this task (TASK-13)
  - Comments tab (TASK-24)

### 8.8 — Tag Management

- [ ] Create `actions/tag.ts`: `createTag()`, `deleteTag()` (TASK-17)
- [ ] Tags are Unit-scoped with name and color (TASK-17)

### 8.9 — Task Comments

- [ ] Create `actions/comment.ts`:
  - `createComment()` — parse @mentions, create TaskMention records, send notifications (TASK-19 to TASK-30)
  - `updateComment()` — set `edited = true` (TASK-21, TASK-23)
  - `deleteComment()` — author can delete own; ADMIN/OWNER can delete any (TASK-21, TASK-22)
- [ ] Build comment list in Task Detail Sheet (TASK-24):
  - Ordered by `createdAt` ascending
  - **CRITICAL** Always fetched fresh — no caching (TASK-25)
  - "edited" label next to timestamp for edited comments (TASK-23)
- [ ] Build `@mention` autocomplete (TASK-26, TASK-27):
  - Typing `@` triggers dropdown of eligible users
  - Eligible: TeamMembers of task's project + ADMIN + OWNER (excluding comment author)
- [ ] Render mentioned usernames as highlighted chips (TASK-30)
- [ ] On save: parse `@username` patterns, resolve to userId, create TaskMention records (TASK-28)
- [ ] **CRITICAL** Deduplicate mentions: `@@unique([commentId, mentionedUserId])` (TASK-29)
- [ ] Send `TASK` notification per mentioned user: `"[Author] vous a mentionné dans [Task title]"` (NOTIF-11)

---

## Milestone 9: Production, Time Tracking & Notifications

**Status:** `[ ] NOT STARTED`
**Depends on:** Milestone 6 (phases exist), Milestone 8 (tasks exist for time tracking)
**Goal:** Production monitoring with charts, time entry logging with timer, and full notification system.

### 9.1 — Production Module

- [ ] Install chart library: `pnpm add recharts`
- [ ] Create `actions/production.ts`:
  - `createProduct()` — one per phase max (PROD-01, PROD-02)
  - `createProduction()` — auto-calculate `mntProd = Phase.montantHT * (taux / 100)` (PROD-03, PROD-04)
  - **CRITICAL** On save: if `Production.taux < (Product.taux * Company.productionAlertThreshold / 100)` → create PRODUCTION notification for OWNER (PROD-07, BR-14)
- [ ] Build Production tab in Project Detail:
  - Product creation form (planned taux, montantProd, date)
  - Production entry form (actual taux, date)
  - Line chart: Planned vs Actual production rate (PROD-05)
  - Grouped bar chart: Planned vs Actual amount (PROD-05)
  - Data table: date, planned taux, actual taux, variance, variance % — red rows when actual < planned (PROD-06)

### 9.2 — Time Tracking

- [ ] Create `actions/time-entry.ts`:
  - `createTimeEntry()` — manual entry with startTime, endTime, description (TIME-05)
  - `startTimer()` — create entry with startTime=now, endTime=null (TIME-04)
  - `stopTimer()` — set endTime=now, calculate duration in minutes (TIME-04)
  - `updateTimeEntry()` — users edit own; ADMIN/OWNER edit any in scope (TIME-06)
  - `deleteTimeEntry()` — same permissions as edit (TIME-06)
  - **CRITICAL** USERs can only log time on projects where they are TeamMember (TIME-07)
- [ ] Build Time Tracking tab in Project Detail (TIME-08):
  - Entries grouped by user
  - Total duration per user per week
  - Grand total
- [ ] Build time entries section in Task Detail Sheet (TIME-09)
- [ ] Build live timer UI component: start/stop button with elapsed time display (TIME-04)

### 9.3 — Notification System

- [ ] Create `actions/notification.ts`:
  - `getUnreadCount()` — returns count for current user (NOTIF-08, NOTIF-10)
  - `getNotifications()` — list with filters by type and read status (NOTIF-04)
  - `markAsRead()` — single notification (NOTIF-04)
  - `markAllAsRead()` — all unread for user (NOTIF-05)
  - `createNotification()` — used internally by other server actions
- [ ] Role-targeted delivery: notifications with `targetRole: OWNER` go only to OWNER (NOTIF-06)
- [ ] USER receives PROJECT notifications only for assigned projects (NOTIF-07)
- [ ] Build `components/notifications/notification-bell.tsx` — Client Component (NOTIF-02, NOTIF-08, NOTIF-09):
  - Unread count badge on bell icon
  - **CRITICAL** Polling every 30 seconds via `setInterval` + Server Action call (NOTIF-08, NOTIF-09)
  - Only count is polled — not full list (NOTIF-10)
- [ ] Build bell dropdown: latest 5 unread with type icon, message, timestamp (NOTIF-03)
- [ ] Create `app/(dashboard)/dashboard/notifications/page.tsx` (NOTIF-04):
  - Full notification list with filter tabs: All / Unread / by Type
  - "Mark all as read" button (NOTIF-05)

### 9.4 — Integrate Notifications Into All Triggers

- [ ] Invitation accepted/rejected → INVITATION notification (NOTIF table row 1)
- [ ] Project status change → PROJECT notification (NOTIF table row 2)
- [ ] Task assigned → TASK notification (NOTIF table row 3)
- [ ] @mention in comment → TASK notification (NOTIF table row 3, NOTIF-11)
- [ ] Team member added/removed → TEAM notification (NOTIF table row 4)
- [ ] Phase status change → PHASE notification (NOTIF table row 5)
- [ ] Client added/updated → CLIENT notification (NOTIF table row 6)
- [ ] Production underperformance → PRODUCTION notification (NOTIF table row 7)
- [ ] Lane created/deleted → LANE notification (NOTIF table row 8)
- [ ] Tag created/deleted → TAG notification (NOTIF table row 9)
- [ ] Trial warnings (day 30, 53, 57) → GENERAL notification (NOTIF table row 10)

---

## Milestone 10: Activity Logs, User Dashboard & Polish

**Status:** `[ ] NOT STARTED`
**Depends on:** Milestones 1-9 (all features exist)
**Goal:** Activity logging, USER personal dashboard, subscription lifecycle, landing page, and UI polish.

### 10.1 — Activity Logs

- [ ] Create `actions/activity-log.ts`:
  - `createActivityLog()` — used by all other server actions on create/edit/delete (ACT-01)
  - `getActivityLogs()` — scoped by role: OWNER all, ADMIN unit, USER assigned projects (ACT-03 to ACT-05)
- [ ] Integrate activity log creation into all existing server actions (ACT-01):
  - Projects, Phases, Tasks, Clients, Members — create/edit/delete
- [ ] Build activity log display component:
  - Filter by: date range, entityType, user (ACT-06)
  - Display in Company Dashboard (OWNER), Unit Dashboard (ADMIN)

### 10.2 — User Personal Dashboard

- [ ] Create `app/(dashboard)/user/[userId]/page.tsx` — USER only (Section 7.14):
  - Assigned Tasks: simplified Kanban or list view of all tasks assigned to this user
  - My Time Entries: all time entries logged by this user, grouped by week
  - Notifications: recent unread notifications
  - Assigned Projects: list of projects where user is TeamMember with status and progress
  - Personal Profile / Settings: name, avatar, notification preferences

### 10.3 — Subscription Lifecycle

- [ ] Implement trial countdown notifications (Section 7.3):
  - Day 30: GENERAL notification → OWNER: "Your trial expires in 30 days"
  - Day 53: GENERAL notification → OWNER: "Your trial expires in 7 days"
  - Day 57: GENERAL notification → OWNER: "Your trial ends in 3 days"
- [ ] Build persistent upgrade banner shown after trial ends (day 60-67) (SUB-02)
- [ ] **CRITICAL** Implement read-only mode (day 67+) (SUB-03, BR-08):
  - All create/update/delete Server Actions check subscription status
  - Block mutations with error + redirect to billing page
- [ ] Build upgrade request form on billing page (SUB-04):
  - Plan selection, preferred payment method, contact info
- [ ] **CRITICAL** Prevent downgrade from Pro/Premium back to Starter (BR-09)

### 10.4 — Landing Page

- [ ] Build public landing page at `/` (currently placeholder):
  - Hero section with product description
  - Features showcase
  - Plan comparison table (Starter, Pro, Premium)
  - Call-to-action buttons → sign-up

### 10.5 — UI Polish & Quality

- [ ] Add loading states (Skeleton components) on all pages
- [ ] Add error boundaries and user-friendly error states
- [ ] Add empty states for all list/table views (no projects, no clients, no tasks, etc.)
- [ ] Responsive design review — ensure all pages work on tablet widths
- [ ] Accessibility audit — keyboard navigation, ARIA labels, contrast
- [ ] Performance check: LCP < 2.5s, Server Actions < 500ms (NFR-01, NFR-02)
- [ ] Gantt: test with 50 phases (NFR-03)
- [ ] Kanban: test with 200 tasks across 10 lanes (NFR-04)

### 10.6 — Security Audit

- [ ] Verify ALL database queries are scoped by `companyId` (SEC-01, BR-01)
- [ ] Verify ALL role checks happen in Server Actions, not just UI (SEC-02)
- [ ] Verify file upload validation for type and size (SEC-03)
- [ ] Verify USERs cannot access financial data for non-assigned projects (SEC-04)

---

## Summary Table

| #         | Milestone                                 | Tasks   | Status |
| --------- | ----------------------------------------- | ------- | ------ |
| 1         | Foundation & Database                     | 26      | `[x]`  |
| 2         | Layout & Navigation                       | 13      | `[x]`  |
| 3         | Onboarding & Auth Flow                    | 9       | `[x]`  |
| 4         | Company & Unit Management                 | 16      | `[ ]`  |
| 5         | Client CRM                                | 7       | `[ ]`  |
| 6         | Project Management & Phases               | 17      | `[ ]`  |
| 7         | Gantt Chart                               | 8       | `[ ]`  |
| 8         | Kanban Board & Tasks                      | 21      | `[ ]`  |
| 9         | Production, Time Tracking & Notifications | 18      | `[ ]`  |
| 10        | Activity Logs, User Dashboard & Polish    | 17      | `[ ]`  |
| **TOTAL** |                                           | **152** | 3/10   |

---

_End of Tasks Document — PMA v3.0.0_

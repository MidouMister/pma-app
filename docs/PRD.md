# PMA — Product Requirements Document
### Version 3.0.0 — AI-Implementable Edition

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack](#2-tech-stack)
3. [Problem Statement](#3-problem-statement)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [User Personas](#5-user-personas)
6. [System Architecture Overview](#6-system-architecture-overview)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [Business Rules & Constraints](#10-business-rules--constraints)
11. [Data Models Summary](#11-data-models-summary)
12. [Page & Route Inventory](#12-page--route-inventory)
13. [Navigation Structure](#13-navigation-structure)
14. [UI Component Library](#14-ui-component-library)
15. [Out of Scope](#15-out-of-scope)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

**PMA** (Project Management App) is a multi-tenant, enterprise-grade web application targeting construction, engineering, and public works companies in Algeria.

The platform is structured around a **Company → Units → Projects** hierarchy:
- A single **Company Owner (OWNER)** bootstraps the account and has company-wide visibility with no unit assignment.
- A Company contains one or more **Units**, each managed by an **Admin (ADMIN)**.
- Each Unit operates semi-independently with its own members, clients, projects, and Kanban board.
- Regular **Members (USER)** interact only with projects they are explicitly assigned to.

PMA replaces fragmented spreadsheet workflows with a single, role-enforced platform covering project financials (HT/TTC), Gantt-based planning, production output monitoring, Kanban task management, time tracking, and client CRM.

---

## 2. Tech Stack

> **This section is the authoritative reference for every implementation decision. Do not deviate from these choices.**

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16 | App Router, Server Actions, Server Components |
| UI Library | React | 19 | |
| Styling | Tailwind CSS | 4 | |
| Component Library | shadcn/ui | v4 | Already initialized — do NOT re-run init |
| Sidebar Foundation | shadcn `sidebar-07` block | — | Base for all sidebar layouts |
| Navigation Source of Truth | `src/lib/nav.ts` | — | Single file defining all role-based nav items |
| Database ORM | Prisma | 7 | |
| Database | Supabase (PostgreSQL) | — | DB only — no Supabase Storage, no Supabase Auth |
| Auth | Clerk | — | Email/password + OAuth; webhooks for user sync |
| File Uploads | Uploadthing | — | Logos, project documents, all file uploads |
| State Management | Jotai | — | Client-side global state |
| Gantt Component | kibo-ui Gantt | — | `npx kibo-ui add gantt` |
| Kanban Component | kibo-ui Kanban | — | `npx kibo-ui add kanban` |
| Package Manager | pnpm | — | Do not use npm or yarn |
| Drag & Drop | dnd-kit | — | Bundled with kibo-ui components |

### Key Architecture Decisions

- **Server Actions** are used for all mutations — no separate API routes for data mutations.
- **Server Components** are the default — use Client Components only when interactivity or browser APIs are required.
- **Supabase is used as a PostgreSQL database only** — accessed via Prisma, not via Supabase client SDK or Supabase Auth.
- **Clerk handles all authentication** — user sessions, OAuth, invitation flows, and webhooks.
- **Uploadthing handles all file uploads** — company logos, unit logos, project documents.
- **No Supabase Realtime** — notification count is polled every 30 seconds via a Client Component using `setInterval` + Server Action.

---

## 3. Problem Statement

| Pain Point | Description |
|---|---|
| Fragmented planning tools | Gantt charts in Excel, tasks in another app, financials elsewhere — no single project health view |
| No production accountability | Planned vs. actual production tracked manually (if at all) — underperformance detected too late |
| Weak access control | Spreadsheet sharing exposes sensitive financial data to all roles indiscriminately |
| Multi-unit chaos | No structured way to manage multiple regional branches under one organizational roof |
| Subscription scalability | Small teams need a lightweight entry point; enterprises need no hard limits |

---

## 4. Goals & Success Metrics

### Product Goals

| # | Goal | Description |
|---|---|---|
| G1 | Unified project view | Every project's financial, planning, and production data accessible from one screen |
| G2 | Role-enforced data access | Users see only what their role permits — no over-exposure of sensitive data |
| G3 | Production variance detection | Automated alerts when actual production falls below planned thresholds |
| G4 | Structured multi-tenancy | Companies manage multiple independent units under one account |
| G5 | Scalable monetization | Tiered plans that grow with the customer without requiring code changes |

### Key Metrics (KPIs — 6 months post-launch)

| Metric | Target |
|---|---|
| User activation rate (onboarding completed) | > 75% of signups |
| Weekly Active Users (WAU) | > 60% of registered users |
| Average projects per active unit | ≥ 3 |
| Trial-to-paid conversion within 2 months | > 25% |
| Support tickets related to permissions | < 5% of active users/month |

---

## 5. User Personas

### Persona 1 — The Company Owner (OWNER)

> *"I need a 10,000-foot view of every project in every unit at any time."*

- **Who:** Founder or CEO of a construction/engineering firm
- **Goals:** Track overall financial performance, manage subscriptions, ensure units are staffed
- **Pain points:** Calls unit managers for updates; no real-time financial visibility across projects
- **Key features:** Company dashboard KPIs, company settings, billing, cross-unit overview, all notifications
- **unitId:** Always `null` — OWNER is company-wide, not assigned to any unit

---

### Persona 2 — The Unit Administrator (ADMIN)

> *"I run my unit. I need to create projects, assign work, and monitor delivery."*

- **Who:** Branch manager, project director, or site supervisor
- **Goals:** Create and track projects end-to-end, manage their team, record production progress
- **Pain points:** Gantt in Excel; no automatic variance alerts; no structured task assignment
- **Key features:** Project creation, Gantt planning, phase management, production recording, Kanban, client CRM, invitations
- **unitId:** Set to their assigned unit

---

### Persona 3 — The Regular Member (USER)

> *"Tell me what I need to do today and let me log my work."*

- **Who:** Engineer, technician, field worker, or analyst
- **Goals:** See assigned tasks, update progress, log working hours
- **Pain points:** Instructions via WhatsApp; no structured place to report progress
- **Key features:** Personal dashboard, assigned tasks (Kanban view), time tracking, notifications
- **unitId:** Set to their assigned unit

---

## 6. System Architecture Overview

```
Company (1 OWNER · 1 Subscription · 1 Plan)
  └── Unit (1 ADMIN · N Members)
        ├── Projects
        │     ├── Phases → SubPhases → GanttMarkers
        │     ├── Team (TeamMembers)
        │     ├── Product → Productions
        │     └── TimeEntries
        ├── Clients
        ├── Lanes → Tasks (Tags, Comments, Mentions)
        └── Invitations
```

### Hierarchy Rules

- One Company is owned by exactly **one User** (the OWNER — bootstrapped at onboarding).
- A Company contains **one or more Units** (count limited by Plan).
- Each Unit has **one ADMIN** and **zero or more Members**.
- Projects belong to a Unit; Members access only projects where they are a **TeamMember**.
- The OWNER has **no unitId** — they access all units through the company/unit switcher in the sidebar.
- All entities are isolated by `companyId` at the data layer. **Every database query must be scoped by `companyId`. No exceptions.**

---

## 7. Functional Requirements

### 7.1 Authentication & Onboarding

**Auth Provider:** Clerk (email/password + OAuth)

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Users register and log in via Clerk (email/password or OAuth) | Must Have |
| AUTH-02 | On first login with no associated Company and no pending invite, redirect to `/onboarding` | Must Have |
| AUTH-03 | Onboarding wizard collects: Company name, email, address, phone, logo, NIF, legal form, state (wilaya), sector | Must Have |
| AUTH-04 | Completing onboarding creates: Company record, assigns OWNER role to that user (`unitId = null`), auto-creates a 2-month Starter trial subscription, creates the first Unit. No operator action required. | Must Have |
| AUTH-05 | Users arriving via invitation link skip onboarding entirely and are assigned to their Unit directly after Clerk authentication | Must Have |
| AUTH-06 | All dashboard routes are protected; unauthenticated users redirect to sign-in | Must Have |
| AUTH-07 | Clerk webhook `user.created` fires when a new user is created. At this point, the webhook payload includes the user's email. The server checks if a pending Invitation exists for that email: if yes, the user is immediately assigned to the Unit with the invited role; if no, the user record is created without a Company or Unit (triggering onboarding on next page load). | Must Have |

#### Onboarding Steps

**Step 1 — Company Profile**
Fields: Company name, logo (Uploadthing upload), legal form (`formJur`), NIF, sector, wilaya (Algerian state), address, phone, email.

**Step 2 — First Unit**
Fields: Unit name, address, phone, email.
This Unit is auto-created on submission. The OWNER does NOT become a member of this unit (`unitId` remains `null`).

**Step 3 — Invite Team (optional, skippable)**
Fields: Email + role picker (ADMIN or USER). Can be skipped entirely. Invitations are sent via email with a unique token.

---

### 7.2 Company Management

| ID | Requirement | Priority |
|---|---|---|
| COMP-01 | OWNER can edit all Company fields (name, logo, address, legal info) | Must Have |
| COMP-02 | Company logo uploaded via Uploadthing, stored as URL in the database | Must Have |
| COMP-03 | OWNER is the only user with `Role.OWNER`; it cannot be granted via invitation. OWNER role is assigned only during onboarding. | Must Have |
| COMP-04 | `Company.ownerId` is unique and immutable after creation | Must Have |
| COMP-05 | OWNER can view aggregated data across all units (projects, members, financials) | Must Have |
| COMP-06 | OWNER can delete the Company — cascades deletion of all related data | Should Have |

---

### 7.3 Subscription & Plans

#### Algerian Payment Context

All commercial transactions use offline methods: physical cheques and bank wire transfers (virement bancaire). **There is no payment gateway integrated into PMA.** The PMA platform operator activates, renews, or suspends subscriptions manually after confirming payment receipt via an operator panel. The operator panel is **out of scope for v1** and will be defined in a future PRD.

#### Plan Tiers

| Feature | Starter (Trial) | Pro | Premium |
|---|---|---|---|
| Duration | 2 months free | Annual (paid) | Annual (paid) |
| Price (DA HT) | 0 DA | Paid | Paid |
| Max Units | 1 | 5 | Unlimited (`null`) |
| Max Projects | 5 | 30 | Unlimited (`null`) |
| Max Tasks / Project | 20 | 200 | Unlimited (`null`) |
| Max Members | 10 | 50 | Unlimited (`null`) |
| Support | None | Email | Dedicated |

> A `null` value in any limit field means unlimited — the server-side check is skipped entirely for that limit.

#### Starter Trial Lifecycle

```
Day 0   → Trial starts automatically at onboarding (startAt = now, endAt = now + 2 months)
Day 30  → GENERAL notification sent to OWNER: "Your trial expires in 30 days"
Day 53  → GENERAL notification sent to OWNER: "Your trial expires in 7 days"
Day 57  → GENERAL notification sent to OWNER: "Your trial ends in 3 days"
Day 60  → Trial ends: persistent upgrade banner shown across all pages, 7-day grace period begins
Day 67  → Account enters READ-ONLY mode: all create/update/delete Server Actions are blocked, data preserved
```

After trial expiry, downgrade back to Starter is not permitted.

#### Subscription Requirements

| ID | Requirement | Priority |
|---|---|---|
| SUB-01 | Starter trial automatically activates at onboarding completion with no operator action | Must Have |
| SUB-02 | After trial ends (day 60), a 7-day grace period allows continued full access with a persistent upgrade banner | Must Have |
| SUB-03 | After grace period (day 67+), account enters read-only mode — all mutations are blocked and user is redirected to the billing page | Must Have |
| SUB-04 | OWNER can submit an upgrade request (plan selection, preferred payment method, contact info) | Must Have |
| SUB-05 | PMA operator manually activates paid subscriptions via a separate operator panel (out of scope for v1) | Must Have |
| SUB-06 | On activation, `Subscription.status` changes to `ACTIVE`, `startAt` and `endAt` are set by the operator | Must Have |
| SUB-07 | All plan limits are enforced server-side in Server Actions before any INSERT operation | Must Have |
| SUB-08 | Billing page shows: current plan, usage vs limits for each limit field, trial countdown (if applicable), upgrade CTA | Must Have |

---

### 7.4 Unit Management

| ID | Requirement | Priority |
|---|---|---|
| UNIT-01 | OWNER can create Units (limited by `Plan.maxUnits`) | Must Have |
| UNIT-02 | Unit fields: name, address, phone, email, logo (Uploadthing URL) | Must Have |
| UNIT-03 | Each Unit has exactly one ADMIN, assigned at creation or via promotion | Must Have |
| UNIT-04 | OWNER can reassign the ADMIN role of a Unit to another member of that unit | Must Have |
| UNIT-05 | OWNER sees all units on the company dashboard | Must Have |
| UNIT-06 | Deleting a Unit requires explicit confirmation and cascades to all projects, tasks, clients, and members | Should Have |

---

### 7.5 Team & Invitations

| ID | Requirement | Priority |
|---|---|---|
| INV-01 | ADMIN or OWNER can invite users to a Unit by email, specifying a role (ADMIN or USER) | Must Have |
| INV-02 | Invitation creates a pending `Invitation` record with a unique token; an email containing the invite link is sent to the invitee | Must Have |
| INV-03 | Invitee clicks link → authenticates via Clerk → Clerk `user.created` webhook fires → server detects pending Invitation for that email → user is assigned to the Unit with the specified role | Must Have |
| INV-04 | Duplicate invitations to the same email within the same unit are rejected with a user-facing error | Must Have |
| INV-05 | Invitations expire after 7 days (`Invitation.expiresAt`) | Should Have |
| INV-06 | ADMIN or OWNER can revoke a pending invitation (sets `status = EXPIRED`) | Must Have |
| INV-07 | ADMIN or OWNER can remove a member from a Unit — tasks and time entries are retained, unit membership is deleted, access is revoked | Must Have |
| INV-08 | A Unit cannot exceed `Plan.maxMembers`; invite is rejected if limit would be breached | Must Have |
| INV-09 | Company-level team page (OWNER only) shows all members across all units | Must Have |

---

### 7.6 Client CRM

| ID | Requirement | Priority |
|---|---|---|
| CLT-01 | Clients are **Unit-scoped** — each Unit manages its own independent client list. A client in Unit A is invisible to Unit B, even within the same Company. | Must Have |
| CLT-02 | ADMIN or OWNER can create, edit, and delete Clients | Must Have |
| CLT-03 | Client fields: name (unique within unit), wilaya, phone, email (unique within unit) | Must Have |
| CLT-04 | Client profile page shows: contact details, all linked projects, total TTC contract value across all projects | Must Have |
| CLT-05 | USERs can view client info (read-only) only for clients linked to their assigned projects | Must Have |
| CLT-06 | Client list supports search by name and sort by name / total contract value | Must Have |
| CLT-07 | A Client cannot be deleted if they have at least one project with status `InProgress` | Should Have |

---

### 7.7 Project Management

| ID | Requirement | Priority |
|---|---|---|
| PROJ-01 | ADMIN or OWNER can create a Project within their Unit | Must Have |
| PROJ-02 | Project fields: name, code (unique within unit), type, montantHT, montantTTC, ODS date, delaiMonths, delaiDays, status, signe, clientId | Must Have |
| PROJ-03 | Project status lifecycle: `New → InProgress → Pause → Complete` | Must Have |
| PROJ-04 | `signe` is a boolean flag indicating whether the contract is signed. It is **display-only** — no feature is blocked or unlocked based on its value. | Must Have |
| PROJ-05 | Project overview shows: financials (HT, TTC, TVA amount, TVA %), progress (weighted average of Phase progress by montantHT), team members, client, ODS date, délai | Must Have |
| PROJ-06 | Project detail page has tabs: Overview, Gantt, Production, Tasks, Time Tracking, Documents | Must Have |
| PROJ-07 | A Project automatically creates an empty Team record on creation | Must Have |
| PROJ-08 | OWNER sees all projects across all units; ADMIN sees only their unit's projects; USER sees only projects where they are a TeamMember | Must Have |
| PROJ-09 | Project list supports filter by status, unit (OWNER only), client, and sort by date / montantTTC | Must Have |
| PROJ-10 | Documents tab supports file uploads via Uploadthing (PDFs, images, drawings) | Should Have |
| PROJ-11 | ADMIN can soft-delete (archive) a project | Should Have |
| PROJ-12 | Project creation checks `Plan.maxProjects` before INSERT; returns user-facing error if limit reached | Must Have |

#### Financial Formulas

| Formula | Expression |
|---|---|
| TVA Amount | `montantTTC - montantHT` |
| TVA % | `((montantTTC - montantHT) / montantHT) × 100` |
| Project Progress | `Σ(Phase.progress × Phase.montantHT) / Σ(Phase.montantHT)` (weighted average) |
| Délai Display | `"{delaiMonths} mois {delaiDays} jours"` |

All monetary amounts display in Algerian format: `1 234 567,89 DA`

---

### 7.8 Phase & Gantt Planning

#### Phase Requirements

| ID | Requirement | Priority |
|---|---|---|
| PH-01 | ADMIN or OWNER can create Phases for a Project | Must Have |
| PH-02 | Phase fields: name, code, montantHT, startDate, endDate, status, observations, progress (0–100 integer), duration (auto-calculated in days) | Must Have |
| PH-03 | `Phase.startDate` must be ≥ `Project.ods`. **Block the save and return an error if violated.** | Must Have |
| PH-04 | `Phase.duration` is auto-calculated as `(endDate - startDate)` in calendar days on every save. It is never set manually. | Must Have |
| PH-05 | The sum of `montantHT` across all Phases of a Project must never exceed `Project.montantHT`. This is checked on every `createPhase()` and `updatePhase()`. **If the sum would exceed the project total: block the save and return an error.** The error message must show the remaining available budget: `(Project.montantHT - currentPhasesSum)`. | Must Have |
| PH-06 | Each Phase can have multiple SubPhases | Must Have |
| PH-07 | SubPhase fields: name, code, status (`TODO` / `COMPLETED`), progress (0–100), startDate, endDate | Must Have |
| PH-08 | SubPhase `startDate` and `endDate` must fall within the parent Phase's date range. **Block the save and return an error if violated.** | Must Have |
| PH-09 | When a Phase has SubPhases, `Phase.progress` auto-calculates as the average of all `SubPhase.progress` values. When no SubPhases exist, `Phase.progress` is set manually. | Should Have |
| PH-10 | ADMIN/OWNER can add GanttMarkers to a Project: label, date, optional CSS class name | Must Have |
| PH-11 | Overlapping phases within the same project trigger a visual warning indicator on the Gantt chart | Should Have |

#### Gantt Chart UI (uses kibo-ui Gantt component)

| ID | Requirement | Priority | kibo-ui Native? |
|---|---|---|---|
| GNT-01 | Phases displayed as horizontal bars on a timeline, color-coded by status | Must Have | ✅ Yes |
| GNT-02 | SubPhases display as nested, indented bars beneath their parent Phase (using kibo-ui grouping) | Must Have | ✅ Yes (grouping) |
| GNT-03 | GanttMarkers render as vertical dashed lines with a diamond icon and label (using kibo-ui Markers feature) | Must Have | ✅ Yes |
| GNT-04 | Each phase bar shows a progress fill overlay representing `Phase.progress %` | Must Have | 🔧 Custom render |
| GNT-05 | Timeline header supports Month / Week / Day zoom levels | Must Have | 🔧 Custom wiring |
| GNT-06 | ADMIN/OWNER can drag phase bars to reschedule (updates startDate, endDate, duration) — USERs see read-only version | Should Have | ✅ Yes (draggable) |
| GNT-07 | Clicking a phase bar opens a Phase detail side sheet | Must Have | 🔧 Custom handler |
| GNT-TODAY | A "Today" marker is shown as a vertical line on the timeline | Must Have | ✅ Yes (built-in) |

**Installation:** `npx kibo-ui add gantt`
**Dependencies bundled:** dnd-kit, date-fns, lodash, lucide-react, jotai

---

### 7.9 Production Monitoring

The production module tracks planned vs. actual output per Phase.

- **Product** — the planned baseline for a Phase (one per phase): planned `taux` (%), planned `montantProd`, reference `date`
- **Production** — individual actual output records logged against a Product: actual `taux`, computed `mntProd`, `date`

| ID | Requirement | Priority |
|---|---|---|
| PROD-01 | Each Phase can have **at most one** Product (planned baseline). Attempting to create a second Product for a Phase returns an error. | Must Have |
| PROD-02 | ADMIN/OWNER creates the Product first, defining the planned `taux` and `montantProd` | Must Have |
| PROD-03 | ADMIN/OWNER records individual Production entries (actual results) against the Product | Must Have |
| PROD-04 | `Production.mntProd = Phase.montantHT × (Production.taux / 100)` — **auto-calculated on every save, never user-editable** | Must Have |
| PROD-05 | Production tab shows two charts: (1) Planned vs Actual production rate — line chart, (2) Planned vs Actual amount — grouped bar chart | Must Have |
| PROD-06 | Data table below charts shows rows: date, planned taux, actual taux, variance (actual - planned), variance %. Rows are colored red if actual < planned. | Must Have |
| PROD-07 | If `Production.taux < (Product.taux × Company.productionAlertThreshold / 100)`, immediately create a `PRODUCTION` notification targeting OWNER on save | Must Have |
| PROD-08 | When a Phase is marked Complete and its production milestone is reached, create a `PRODUCTION` notification | Must Have |
| PROD-09 | `Company.productionAlertThreshold` defaults to `80` (percent). Range: 1–100. Configurable by OWNER only. | Must Have |

---

### 7.10 Task & Kanban Board

#### Lane Requirements

| ID | Requirement | Priority |
|---|---|---|
| LANE-01 | Lanes are **Unit-scoped** — shared across all projects within a unit | Must Have |
| LANE-02 | ADMIN or OWNER can create, rename, reorder, change color of, and delete Lanes | Must Have |
| LANE-03 | Lanes have an `order` integer field; displayed in ascending order | Must Have |
| LANE-04 | Deleting a Lane that contains tasks prompts confirmation; if confirmed, tasks are unassigned from the lane (`laneId = null`) | Must Have |

#### Task Requirements

| ID | Requirement | Priority |
|---|---|---|
| TASK-01 | ADMIN or OWNER can create Tasks within a Lane, scoped to a Unit | Must Have |
| TASK-02 | Task fields: title, description, startDate, dueDate, endDate, complete (boolean), assignedUserId, laneId, order (integer), tags[], phaseId (required), subPhaseId (optional) | Must Have |
| TASK-03 | `projectId` on Task is always derived server-side from `Phase.projectId` on save — **never set independently by the client** | Must Have |
| TASK-04 | `assignedUserId` must be a TeamMember of the task's linked Project — **enforced in Server Action, not just UI** | Must Have |
| TASK-05 | `subPhaseId` must be a child of `phaseId` — **enforced in Server Action** | Must Have |
| TASK-06 | Task creation checks `Plan.maxTasksPerProject` before INSERT; returns user-facing error if limit reached | Must Have |
| TASK-07 | Assigning a task to a user sends them a `TASK` notification | Must Have |
| TASK-08 | Tasks displayed as cards on the Kanban board, ordered by `Task.order` within each lane | Must Have |
| TASK-09 | ADMIN/OWNER can drag tasks between lanes (updates `laneId` and `order`) | Must Have |
| TASK-10 | USER can drag only their own assigned tasks between lanes | Must Have |
| TASK-11 | A task is **overdue** if `dueDate < NOW` and `complete = false` — display a red overdue badge on the task card | Must Have |
| TASK-12 | Clicking a task card opens a **Task Detail Side Sheet** (480px slide-over panel from the right) | Must Have |
| TASK-13 | Task Detail Sheet shows: title, description, status, current lane, assignee picker, due date picker, tags, time entries, activity log, and a **Project → Phase → SubPhase context section** | Must Have |
| TASK-14 | Phase and SubPhase context is **NOT shown on the task card** — only visible inside the Task Detail Sheet | Must Have |
| TASK-15 | Any unit member can mark a task complete if assigned to them; ADMIN/OWNER can mark any task complete | Must Have |
| TASK-16 | Task completion does **NOT** automatically update `SubPhase.progress` — SubPhase progress is updated manually | Must Have |
| TASK-17 | Tags are Unit-scoped, have a name and a color, and can be applied to multiple tasks | Must Have |
| TASK-18 | Kanban filter bar has 3 cascading dropdowns: **Project → Phase → SubPhase**. Selecting a Project immediately filters the visible tasks to only that project's tasks AND narrows the Phase dropdown to that project's phases. Selecting a Phase further filters tasks to that phase AND narrows SubPhase dropdown. | Must Have |

#### Task Comments

| ID | Requirement | Priority |
|---|---|---|
| TASK-19 | Any TeamMember of the task's project, plus the ADMIN and OWNER of the unit, can post comments on a task | Must Have |
| TASK-20 | Comment fields: body (plain text), authorId, timestamp (`createdAt`), `edited` boolean | Must Have |
| TASK-21 | Comment author can edit or delete their own comment | Must Have |
| TASK-22 | ADMIN and OWNER can delete any comment within their unit | Must Have |
| TASK-23 | Edited comments show an "edited" label displayed next to the timestamp | Must Have |
| TASK-24 | Comments are displayed in the Task Detail Sheet under a "Comments" tab, ordered by `createdAt` ascending | Must Have |
| TASK-25 | Comments are **never cached** — always fetched fresh from the database on every open | Must Have |
| TASK-26 | Comment body supports `@mention` syntax — typing `@` triggers an autocomplete dropdown of eligible users | Must Have |
| TASK-27 | The `@mention` autocomplete shows only users eligible to be mentioned: TeamMembers of the task's project + ADMIN + OWNER of the unit. The comment author is excluded (cannot mention themselves). | Must Have |
| TASK-28 | On comment save, the server parses all `@username` patterns, resolves them to `userId`, creates one `TaskMention` record per unique mentioned user, and sends one `TASK` notification per mentioned user | Must Have |
| TASK-29 | Duplicate mentions of the same user in one comment → only one `TaskMention` record and one notification (enforced by `@@unique([commentId, mentionedUserId])` at the DB level) | Must Have |
| TASK-30 | Mentioned usernames are rendered as highlighted chips in the displayed comment — not as raw `@username` text | Must Have |

**Kanban Installation:** `npx kibo-ui add kanban`
**Dependencies bundled:** dnd-kit

---

### 7.11 Time Tracking

| ID | Requirement | Priority |
|---|---|---|
| TIME-01 | Any user (OWNER, ADMIN, USER) can log time entries | Must Have |
| TIME-02 | A TimeEntry can be linked to a Task, a Project, or both (`taskId` is nullable) | Must Have |
| TIME-03 | Fields: description, startTime, endTime, duration (minutes, auto-calculated as `endTime - startTime`) | Must Have |
| TIME-04 | Users can start a live timer on a task; stopping it auto-fills `endTime` and calculates `duration` | Must Have |
| TIME-05 | Manual entry form allows direct input of startTime, endTime, and description | Must Have |
| TIME-06 | Users can only edit or delete their own time entries; OWNER and ADMIN can edit/delete any time entry within their scope | Must Have |
| TIME-07 | USERs can only log time on projects where they are a TeamMember | Must Have |
| TIME-08 | Project Time Tracking tab shows: entries grouped by user, total duration per user per week, grand total | Must Have |
| TIME-09 | Task Detail Sheet shows all time entries for that task with user, duration, and description | Must Have |

---

### 7.12 Notifications

#### Notification Types by Role

| Type | OWNER | ADMIN | USER | Trigger |
|---|---|---|---|---|
| `INVITATION` | ✓ | ✓ | ✓ | Invite accepted or rejected |
| `PROJECT` | ✓ | ✓ | Assigned only | Project status change |
| `TASK` | ✓ | ✓ | ✓ (assigned or mentioned) | Task assigned or @mentioned |
| `TEAM` | ✓ | ✓ | ✓ | Added to / removed from project team |
| `PHASE` | ✓ | ✓ | — | Phase status change |
| `CLIENT` | ✓ | ✓ | — | Client added or updated |
| `PRODUCTION` | ✓ | — | — | Production underperformance or milestone |
| `LANE` | ✓ | ✓ | — | Lane created or deleted |
| `TAG` | ✓ | ✓ | — | Tag created or deleted |
| `GENERAL` | ✓ | ✓ | ✓ | System-wide, trial warnings |

#### Notification Requirements

| ID | Requirement | Priority |
|---|---|---|
| NOTIF-01 | Notifications stored in DB with: userId, companyId, unitId, type, message, read (boolean), targetRole, targetUserId | Must Have |
| NOTIF-02 | Bell icon in the app header shows an unread count badge | Must Have |
| NOTIF-03 | Bell dropdown shows the latest 5 unread notifications with type icon, message, and timestamp | Must Have |
| NOTIF-04 | Full notifications page at `/dashboard/notifications` with filter tabs: All / Unread / by Type | Must Have |
| NOTIF-05 | "Mark all as read" action on the notifications page | Must Have |
| NOTIF-06 | Role-targeted notifications (`targetRole: OWNER`) are delivered only to the single OWNER user of that company | Must Have |
| NOTIF-07 | USER receives `PROJECT` notifications only for projects where they are a TeamMember | Must Have |
| NOTIF-08 | The unread notification **count** (bell badge) is refreshed via **polling every 30 seconds** — no Supabase Realtime | Must Have |
| NOTIF-09 | Polling is implemented as a **Client Component** using `setInterval` + a Server Action call — not a `useEffect` fetch to an API route | Must Have |
| NOTIF-10 | Only the unread **count** is polled — the full notification list is fetched on demand when the user opens the bell dropdown | Must Have |
| NOTIF-11 | A `@mention` in a task comment sends a `TASK` notification to the mentioned user with message format: `"[Author] vous a mentionné dans [Task title]"` | Must Have |
| NOTIF-12 | A user can only be @mentioned if they are a TeamMember of the task's project, or an ADMIN/OWNER of the unit | Must Have |

---

### 7.13 Activity Logs

| ID | Requirement | Priority |
|---|---|---|
| ACT-01 | Key actions generate an ActivityLog entry: create/edit/delete for Projects, Phases, Tasks, Clients, Members | Must Have |
| ACT-02 | ActivityLog fields: companyId, unitId, userId, action (string), entityType (string), entityId, metadata (JSON), createdAt | Must Have |
| ACT-03 | OWNER can view all activity logs company-wide | Must Have |
| ACT-04 | ADMIN can view activity logs for their unit only | Must Have |
| ACT-05 | USER can view activity logs scoped to their assigned projects only | Must Have |
| ACT-06 | Activity log supports filter by: date range, entityType, user | Should Have |

---

### 7.14 User Dashboard

**Route:** `/user/[userId]`
**Access:** USER role only (OWNER and ADMIN are redirected to their own dashboards)

This is the personal workspace for a USER. It is a dashboard page, not a redirect. It contains:

| Section | Description |
|---|---|
| Assigned Tasks | A personal view of all tasks assigned to this user, displayed as a simplified Kanban or list view |
| My Time Entries | All time entries logged by this user, grouped by week |
| Notifications | Recent unread notifications for this user |
| Assigned Projects | List of all projects where this user is a TeamMember, with status and progress |
| Personal Profile / Settings | User's name, avatar, notification preferences |

---

## 8. Non-Functional Requirements

### Performance

| ID | Requirement |
|---|---|
| NFR-01 | Initial page load (LCP) < 2.5s on standard broadband |
| NFR-02 | Server Actions (mutations) respond in < 500ms under normal load |
| NFR-03 | Gantt chart renders up to 50 phases without visible lag |
| NFR-04 | Kanban board renders up to 200 tasks across 10 lanes without degradation |

### Security

| ID | Requirement |
|---|---|
| SEC-01 | All database queries are scoped by `companyId` to enforce tenant isolation — no exceptions |
| SEC-02 | Role checks are enforced at the Server Action level — not just in the UI |
| SEC-03 | File uploads are validated for type and size before Uploadthing submission |
| SEC-04 | No sensitive data (financial totals, full client records) is accessible to USER unless they are an assigned TeamMember |

### Reliability

| ID | Requirement |
|---|---|
| REL-01 | Data is never permanently deleted when a user is removed from a unit — only access is revoked |
| REL-02 | All subscription state changes are logged in ActivityLog |

---

## 9. Role-Based Access Control

### Role Definitions

| Role | Scope | `unitId` | Description |
|---|---|---|---|
| `OWNER` | Company-wide | `null` | Created at onboarding. One per Company. Full visibility across all units. Manages billing. |
| `ADMIN` | Unit-scoped | Set to their unit | Manages a single Unit. Full operational control within their unit. |
| `USER` | Project-scoped | Set to their unit | Access only to projects where they are a TeamMember. |

### Permission Matrix

| Action | OWNER | ADMIN | USER |
|---|---|---|---|
| View all units | ✅ | ❌ (own unit only) | ❌ |
| Manage Company settings | ✅ | ❌ | ❌ |
| Manage billing / subscription | ✅ | ❌ | ❌ |
| Create / delete Units | ✅ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ (own unit) | ❌ |
| Create / edit Projects | ✅ | ✅ (own unit) | ❌ |
| View Projects | ✅ (all) | ✅ (own unit) | ✅ (assigned only) |
| Manage Phases & Gantt | ✅ | ✅ (own unit) | ❌ |
| Record Production | ✅ | ✅ (own unit) | ❌ |
| Manage Clients | ✅ | ✅ (own unit) | ❌ (view assigned only) |
| Create / manage Lanes | ✅ | ✅ (own unit) | ❌ |
| Create Tasks | ✅ | ✅ (own unit) | ❌ |
| Drag any task | ✅ | ✅ | ❌ (own tasks only) |
| Mark task complete | ✅ | ✅ (any task) | ✅ (own tasks only) |
| Log time entries | ✅ (any project) | ✅ (own unit projects) | ✅ (assigned projects only) |
| Edit/delete others' time entries | ✅ | ✅ (own unit) | ❌ |
| View activity logs | ✅ (all) | ✅ (own unit) | ✅ (assigned projects) |
| Post task comments | ✅ | ✅ | ✅ (if TeamMember) |
| Delete others' comments | ✅ | ✅ (own unit) | ❌ |

---

## 10. Business Rules & Constraints

### Tenant Isolation
- **BR-01:** Every database query involving user data must be scoped by `companyId`. No exceptions.
- **BR-02:** A User belongs to exactly one Company. Cross-company access is architecturally impossible.

### Onboarding
- **BR-03:** The first User to complete onboarding for a Company is permanently assigned `Role.OWNER` with `unitId = null`.
- **BR-04:** Only one OWNER exists per Company. OWNER role cannot be granted via invitation or promotion.

### Subscription & Limits
- **BR-05:** Plan limits (`maxUnits`, `maxProjects`, `maxTasksPerProject`, `maxMembers`) are checked server-side before every INSERT. Exceeding a limit returns a user-facing error message — not a raw database error.
- **BR-06:** A `null` limit means unlimited — the server-side check is skipped entirely for that field.
- **BR-07:** Trial expiry and grace period transitions are computed from `Subscription.endAt` on every page load. No background job is required for display. However, all mutation Server Actions must check `Subscription.status` before proceeding.
- **BR-08:** After grace period ends (day 67+), all create/update/delete Server Actions return an error and redirect the user to the billing page.
- **BR-09:** Once upgraded to Pro or Premium, downgrade back to Starter is not permitted.

### Financial Rules
- **BR-10:** `Phase.montantHT` represents the contractual price of that phase. The sum of all `Phase.montantHT` values within a project must never exceed `Project.montantHT`. **This is a hard block — the save is rejected and an error is returned showing the remaining available budget.** (Note: this replaces and overrides any earlier "warn only" language — the save is always blocked.)
- **BR-11:** `Phase.startDate` must be ≥ `Project.ods` date. **Block the save and return an error if violated.**
- **BR-12:** SubPhase dates must be within the parent Phase date range. **Block the save and return an error if violated.**
- **BR-13:** `Production.mntProd` is always system-calculated as `Phase.montantHT × (taux / 100)`. It is never directly editable by the user.

### Production Alerts
- **BR-14:** If `Production.taux < (Product.taux × Company.productionAlertThreshold / 100)`, create a `PRODUCTION` notification targeting OWNER immediately on save.
- **BR-15:** `Company.productionAlertThreshold` defaults to `80`. Range: 1–100. Configurable by OWNER only.

### User Removal
- **BR-16:** When a User is removed from a Unit, their tasks and time entries are **retained**. Only their unit membership is deleted. Their `assignedUserId` on tasks remains but they lose access to the application.

### Project Progress
- **BR-17:** `Project.progress = Σ(Phase.progress × Phase.montantHT) / Σ(Phase.montantHT)`. Recalculated on every `Phase.progress` change.

### Délai Field
- **BR-18:** Project deadline is stored as two integer fields: `delaiMonths` and `delaiDays`. Both default to 0. Always displayed as: `"{delaiMonths} mois {delaiDays} jours"`.

### Clients
- **BR-19:** Clients are Unit-scoped. A client in Unit A is invisible to Unit B, even within the same Company.
- **BR-20:** A Client with at least one Project in `InProgress` status cannot be deleted.

### Kanban
- **BR-21:** Lanes are Unit-scoped — shared across all projects within the unit. A task retains its Kanban lane (`laneId`) when it is reassigned between projects.

### Contract Flag
- **BR-22:** The `signe` field on a Project is a boolean display flag only. It does not gate, unlock, or block any application feature or workflow.

---

## 11. Data Models Summary

### Core Entities

| Model | Key Fields | Relationships |
|---|---|---|
| `Plan` | id, name, maxUnits, maxProjects, maxTasksPerProject, maxMembers, priceDA | hasMany Subscriptions |
| `Company` | id, name, ownerId, logo, NIF, formJur, sector, wilaya, address, phone, email, productionAlertThreshold | hasOne Subscription, hasMany Units, hasMany Users |
| `Subscription` | id, companyId, planId, status (`TRIAL` / `ACTIVE` / `GRACE` / `READONLY` / `SUSPENDED`), startAt, endAt | belongsTo Company, belongsTo Plan |
| `User` | id, clerkId, name, email, role (`OWNER` / `ADMIN` / `USER`), companyId, unitId (nullable — null for OWNER) | belongsTo Company, belongsTo Unit (nullable) |
| `Unit` | id, companyId, adminId, name, address, phone, email, logo | belongsTo Company, hasMany Projects, Clients, Lanes, Invitations |
| `Invitation` | id, companyId, unitId, email, role, token, status (`PENDING` / `ACCEPTED` / `REJECTED` / `EXPIRED`), expiresAt | belongsTo Company, Unit |

### Operational Entities

| Model | Key Fields | Relationships |
|---|---|---|
| `Client` | id, unitId, companyId, name, wilaya, phone, email | belongsTo Unit, hasMany Projects |
| `Project` | id, unitId, companyId, clientId, name, code, type, montantHT, montantTTC, ods, delaiMonths, delaiDays, status, signe (boolean) | belongsTo Unit, Client; hasMany Phases, TeamMembers, TimeEntries |
| `Team` | id, projectId | belongsTo Project, hasMany TeamMembers |
| `TeamMember` | id, teamId, userId, roleLabel | belongsTo Team, User |
| `Phase` | id, projectId, name, code, montantHT, startDate, endDate, duration (auto), status, progress (0–100), observations | belongsTo Project; hasMany SubPhases, GanttMarkers; hasOne Product |
| `SubPhase` | id, phaseId, name, code, status (`TODO` / `COMPLETED`), progress (0–100), startDate, endDate | belongsTo Phase |
| `GanttMarker` | id, projectId, label, date, className | belongsTo Project |
| `Product` | id, phaseId, taux, montantProd, date | belongsTo Phase, hasMany Productions |
| `Production` | id, productId, phaseId, taux, mntProd (auto-calculated), date | belongsTo Product |

### Execution & Tracking

| Model | Key Fields | Relationships |
|---|---|---|
| `Lane` | id, unitId, companyId, name, color, order | belongsTo Unit, hasMany Tasks |
| `Task` | id, unitId, companyId, projectId (derived from phase), phaseId (required), subPhaseId (nullable), laneId, assignedUserId, title, description, startDate, dueDate, endDate, complete (boolean), order | belongsTo Unit, Lane, User, Project, Phase, SubPhase; hasManyThrough Tags |
| `Tag` | id, unitId, name, color | belongsTo Unit |
| `TaskComment` | id, taskId, authorId, companyId, body, edited (boolean), createdAt | belongsTo Task, User, Company; hasMany TaskMentions |
| `TaskMention` | id, commentId, mentionedUserId, companyId | belongsTo TaskComment, User — unique constraint on `[commentId, mentionedUserId]` |
| `TimeEntry` | id, companyId, userId, projectId, taskId (nullable), description, startTime, endTime, duration (minutes) | belongsTo User, Project, Task (nullable) |
| `Notification` | id, companyId, unitId, userId, type, message, read (boolean), targetRole, targetUserId | belongsTo Company, Unit, User |
| `ActivityLog` | id, companyId, unitId, userId, action, entityType, entityId, metadata (JSON), createdAt | belongsTo Company, Unit, User |

---

## 12. Page & Route Inventory

### Public Routes

| Route | Page | Notes |
|---|---|---|
| `/` | Landing page | Public |
| `/company/sign-in/[[...sign-in]]` | Clerk Sign In | Clerk catch-all |
| `/company/sign-up/[[...sign-up]]` | Clerk Sign Up | Clerk catch-all |

### Routing Hub

| Route | Behavior |
|---|---|
| `/dashboard` | Pure redirect hub — no UI of its own. OWNER → `/company/[companyId]`, ADMIN → `/unite/[unitId]`, USER → `/user/[userId]` |

### Onboarding

| Route | Page | Access |
|---|---|---|
| `/onboarding` | Multi-step onboarding wizard (3 steps) | Authenticated users with no Company |

### Company Routes (OWNER only)

| Route | Page |
|---|---|
| `/company/[companyId]` | Company Dashboard (KPIs, units overview, cross-unit financials) |
| `/company/[companyId]/settings` | Company Settings (name, logo, legal info, production threshold) |
| `/company/[companyId]/settings/billing` | Billing & Plans (current plan, limits usage, upgrade CTA) |
| `/company/[companyId]/units` | Units Management (list, create, delete) |
| `/company/[companyId]/users` | Company-wide members & Invitations |

### Unit Routes (ADMIN + OWNER)

| Route | Page |
|---|---|
| `/unite/[unitId]` | Unit Dashboard |
| `/unite/[unitId]/members` | Unit Members Management |
| `/unite/[unitId]/clients` | Client List |
| `/unite/[unitId]/clients/[clientId]` | Client Profile |
| `/unite/[unitId]/projects` | Project List |
| `/unite/[unitId]/projects/[projectId]` | Project Detail (tabbed: Overview, Gantt, Production, Tasks, Time Tracking, Documents) |
| `/unite/[unitId]/kanban` | Kanban Board |
| `/unite/[unitId]/settings` | Unit Settings |

### User Workspace Routes

| Route | Page | Access |
|---|---|---|
| `/user/[userId]` | USER Personal Dashboard (tasks, time entries, notifications, assigned projects, profile) | USER only |
| `/dashboard/notifications` | Full Notifications Page | All roles |

---

## 13. Navigation Structure

### OWNER Sidebar Behavior

The OWNER sidebar contains a **Company/Unit Switcher** at the top. This switcher lists the Company and all its Units. The OWNER selects one at a time:

- Selecting **"Company"** → displays the Company navigation section
- Selecting **a Unit** → displays that unit's Admin navigation (OWNER retains full permissions)

The sidebar uses the `sidebar-07` shadcn block as its foundation. Navigation items are defined in `src/lib/nav.ts` as the single source of truth.

### Sidebar Navigation by Role

| Section | OWNER | ADMIN | USER |
|---|---|---|---|
| Company/Unit Switcher | ✅ (company + all units) | ❌ | ❌ |
| Company Dashboard | ✅ | ❌ | ❌ |
| Units Management | ✅ | ❌ | ❌ |
| Company Team | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ |
| Unit Dashboard | ✅ (when unit selected) | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ (assigned only) |
| Kanban | ✅ | ✅ | ❌ (tasks accessible via personal dashboard) |
| Clients | ✅ | ✅ | ❌ |
| Unit Members | ✅ | ✅ | ❌ |
| Unit Settings | ✅ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ✅ |
| Personal Dashboard | ❌ | ❌ | ✅ |

---

## 14. UI Component Library

### kibo-ui Gantt

**Install:** `npx kibo-ui add gantt`

**Bundled dependencies:** dnd-kit, date-fns, lodash (throttle), lucide-react, jotai

| Feature | Status | Notes |
|---|---|---|
| Horizontal bars with grouping | ✅ Native | Use for Phase → SubPhase hierarchy |
| Draggable & resizable bars | ✅ Native | Used for ADMIN/OWNER; disabled for USER |
| Read-only mode | ✅ Native | Used for USER role |
| Markers (vertical lines) | ✅ Native | Used for GanttMarkers |
| Today marker | ✅ Native | Built-in |
| Progress fill overlay on bar | 🔧 Custom | Render progress as a filled div inside each bar |
| Month/Week/Day zoom toggle | 🔧 Custom | Wire to kibo-ui's timeline range props |
| Phase bar click → side sheet | 🔧 Custom | Add onClick handler to each bar |
| Overlap warning indicator | 🔧 Custom | Detect overlapping date ranges, add visual flag |

### kibo-ui Kanban

**Install:** `npx kibo-ui add kanban`

**Bundled dependencies:** dnd-kit

| Feature | Status | Notes |
|---|---|---|
| Drag & drop between columns | ✅ Native | Used for ADMIN/OWNER full drag; USER restricted to own tasks |
| Customizable card contents | ✅ Native | Custom card: title, assignee avatar, due date, tags, overdue badge |
| Overdue badge on card | 🔧 Custom | Add red badge when `dueDate < NOW && !complete` |
| Cascading filter bar (Project → Phase → SubPhase) | 🔧 Custom | Build above the board; filters visible tasks and narrows dropdowns |
| Task Detail Side Sheet (480px) | 🔧 Custom | shadcn Sheet component, opens on card click |

### Other shadcn/ui Components Used

The following shadcn/ui components are expected to be used throughout the app. They are already available after the initial shadcn setup — do not re-run `shadcn init`.

- `Sheet` — Task Detail Side Sheet, Phase detail
- `Dialog` — Confirmation modals (delete, remove member)
- `Tabs` — Project detail page tabs
- `Form` + `Input` + `Select` + `DatePicker` — All forms
- `Badge` — Status labels, overdue indicators, unread count
- `Avatar` — User avatars throughout
- `DropdownMenu` — Context menus, bell notification dropdown
- `Sidebar` (sidebar-07 block) — App sidebar for all roles
- `Table` — Production data table, member lists, project lists
- `Progress` — Phase and project progress bars
- `Skeleton` — Loading states

---

## 15. Out of Scope (v1.0)

| Feature | Reason Deferred |
|---|---|
| Operator Panel (subscription activation) | Not designed yet — will be a separate PRD |
| Mobile native app (iOS / Android) | Desktop-first; mobile web sufficient for v1 |
| Real-time collaborative editing (live cursors) | Complexity; polling + Server Actions sufficient |
| Gantt task dependency arrows (FS, SS, FF, SF) | Schema enum defined for future use |
| Advanced reporting & PDF export | Phase 2 |
| Two-factor authentication (2FA) | Delegated to Clerk settings |
| Custom domain / white-labeling | Enterprise tier, post-launch |
| Offline mode / PWA | Out of scope for v1 |
| External calendar sync | Phase 2 |
| Public project share links | Phase 2 |
| Comment character limits | Not defined — no limit enforced in v1 |
| Comment file attachments | Phase 2 |
| Comment markdown rendering | Plain text only in v1 |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **HT (Hors Taxe)** | Pre-tax amount (excluding VAT) |
| **TTC (Toutes Taxes Comprises)** | Total amount including all taxes |
| **TVA** | Taxe sur la Valeur Ajoutée — VAT in Algeria |
| **ODS** | Ordre de Service — official project start order date |
| **Délai** | Contractual deadline, stored as `delaiMonths` + `delaiDays` integers. Displayed as `"X mois Y jours"`. |
| **Taux** | Production rate, expressed as a percentage (0–100) |
| **montantProd** | Produced monetary amount = `Phase.montantHT × (taux / 100)` |
| **montantHT** | Pre-tax monetary amount |
| **montantTTC** | Tax-inclusive monetary amount |
| **Phase** | Major deliverable block within a project, with its own budget (`montantHT`) and timeline |
| **SubPhase** | Granular sub-task within a Phase |
| **GanttMarker** | Vertical milestone line on the Gantt chart with a label, date, and optional CSS class |
| **Product** | Planned production baseline for a Phase (one per phase) |
| **Production** | Individual actual production record logged against a Product |
| **Lane** | Kanban board column (e.g. "To Do", "In Progress") — Unit-scoped |
| **TeamMember** | Junction record linking a User to a Project's Team |
| **Multi-Tenant** | One app instance serves multiple isolated companies — all data isolated by `companyId` |
| **RBAC** | Role-Based Access Control — permissions enforced server-side based on `User.role` |
| **Onboarding** | First-run wizard that creates the Company, first Unit, and sets the OWNER |
| **Virement Bancaire** | Bank wire transfer — primary offline payment method used in Algeria |
| **Wilaya** | An Algerian administrative state/province |
| **formJur** | Legal form of the company (e.g. SARL, SPA, EURL) |
| **NIF** | Numéro d'Identification Fiscale — Algerian tax identification number |
| **signe** | Boolean flag on Project indicating the contract is signed — display only, no feature gates |
| **OWNER** | The company-wide role. `unitId = null`. Created only at onboarding. One per company. |
| **ADMIN** | Unit-scoped role. Full control within their unit. `unitId` is set. |
| **USER** | Project-scoped role. Accesses only assigned projects. `unitId` is set. |
| **Server Action** | Next.js 16 server-side function used for all data mutations |
| **kibo-ui** | shadcn-compatible component library providing Gantt and Kanban components |

---

*End of Document — PMA PRD v3.0.0*

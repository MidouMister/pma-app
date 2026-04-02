# PMA — Implementation Plan

> **Generated:** 2026-03-30
> **Source:** PRD v3.0.0 + Project Gap Analysis
> **Status:** PENDING USER APPROVAL

---

## 1. Current State Analysis

### What Exists (Done)

| Area                | Status         | Details                                                                                                                                   |
| ------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16 scaffold | ✅ Done        | App Router, Turbopack dev script                                                                                                          |
| React 19            | ✅ Done        | v19.2.4                                                                                                                                   |
| Tailwind CSS 4      | ✅ Done        | v4.2.1 with PostCSS                                                                                                                       |
| shadcn/ui v4        | ✅ Initialized | `components.json` present, only `button` component installed                                                                              |
| ThemeProvider       | ✅ Done        | Dark mode toggle via `next-themes`                                                                                                        |
| Prisma 7            | ⚠️ Partial     | Installed but `prisma/schema.prisma` is **empty** (only generator + datasource). Full schema exists in `docs/schema.prisma` as reference. |
| Fonts               | ✅ Done        | Oxanium (sans) + Geist Mono configured                                                                                                    |
| Prettier            | ✅ Done        | With Tailwind plugin                                                                                                                      |
| ESLint              | ✅ Done        | Next.js config                                                                                                                            |

### What Does NOT Exist (Gap)

| Area                     | Status           | PRD Ref                                |
| ------------------------ | ---------------- | -------------------------------------- |
| Clerk authentication     | ❌ Not installed | AUTH-01 to AUTH-07                     |
| Uploadthing              | ❌ Not installed | COMP-02, PROJ-10                       |
| Jotai state management   | ❌ Not installed | Tech Stack                             |
| kibo-ui Gantt            | ❌ Not installed | GNT-01 to GNT-07                       |
| kibo-ui Kanban           | ❌ Not installed | TASK-08 to TASK-18                     |
| dnd-kit                  | ❌ Not installed | Bundled with kibo-ui                   |
| Database schema (active) | ❌ Empty         | Section 11                             |
| Database migrations      | ❌ None          | —                                      |
| Any app routes           | ❌ None          | Section 12 (all routes)                |
| Sidebar / Navigation     | ❌ None          | Section 13, `sidebar-07`               |
| `lib/nav.ts`             | ❌ None          | Navigation source of truth             |
| Server Actions           | ❌ None          | All mutations                          |
| API routes / Webhooks    | ❌ None          | Clerk webhook                          |
| Onboarding flow          | ❌ None          | AUTH-02 to AUTH-05                     |
| Company management       | ❌ None          | COMP-01 to COMP-06                     |
| Unit management          | ❌ None          | UNIT-01 to UNIT-06                     |
| Project CRUD             | ❌ None          | PROJ-01 to PROJ-12                     |
| Phase & Gantt            | ❌ None          | PH-01 to PH-11, GNT-01 to GNT-07       |
| Production monitoring    | ❌ None          | PROD-01 to PROD-09                     |
| Kanban board             | ❌ None          | LANE-01 to LANE-04, TASK-01 to TASK-30 |
| Time tracking            | ❌ None          | TIME-01 to TIME-09                     |
| Notifications            | ❌ None          | NOTIF-01 to NOTIF-12                   |
| Activity logs            | ❌ None          | ACT-01 to ACT-06                       |
| User dashboard           | ❌ None          | Section 7.14                           |
| Subscription/billing     | ❌ None          | SUB-01 to SUB-08                       |
| Client CRM               | ❌ None          | CLT-01 to CLT-07                       |
| RBAC enforcement         | ❌ None          | Section 9                              |
| shadcn components        | ⚠️ Only `button` | 15+ components needed                  |

---

### Schema Gap Analysis (docs/schema.prisma vs PRD)

The reference schema in `docs/schema.prisma` is **mostly aligned** with the PRD but has these discrepancies that must be fixed before migration:

| Issue                                         | Current Schema               | PRD Requirement                                                            | Fix Needed                                      |
| --------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| Missing `clerkId` on User                     | Not present                  | Required for Clerk sync (AUTH-07)                                          | Add `clerkId String @unique`                    |
| `delai` is String                             | `delai String`               | Should be `delaiMonths Int` + `delaiDays Int` (BR-18)                      | Split into two Int fields                       |
| Missing `companyId` on Project                | Not present                  | Every query scoped by `companyId` (BR-01)                                  | Add `companyId String`                          |
| Missing `companyId` on Client                 | Not present                  | Required for tenant isolation (BR-01)                                      | Add `companyId String`                          |
| Missing `companyId` on Task                   | Not present                  | Required for tenant isolation (BR-01)                                      | Add `companyId String`                          |
| Missing `companyId` on TimeEntry              | Not present                  | Required for tenant isolation                                              | Add `companyId String`                          |
| Missing `productionAlertThreshold` on Company | Not present                  | Required (PROD-09, BR-15)                                                  | Add `productionAlertThreshold Int @default(80)` |
| Subscription missing `status` enum            | Uses `active Boolean`        | Needs `SubscriptionStatus` enum: TRIAL, ACTIVE, GRACE, READONLY, SUSPENDED | Replace Boolean with enum                       |
| Plan `monthlyCost` naming                     | `monthlyCost Float`          | PRD says `priceDA`                                                         | Rename field                                    |
| Plan `userLimit` naming                       | `userLimit Int?`             | PRD says `maxMembers`                                                      | Rename field                                    |
| Invitation missing fields                     | Missing `token`, `expiresAt` | Required (INV-02, INV-05)                                                  | Add fields                                      |
| Invitation email not scoped                   | `email @unique` globally     | Should be `@@unique([email, unitId])` (INV-04)                             | Change constraint                               |
| Client name not scoped                        | `name @unique` globally      | Should be `@@unique([name, unitId])` (CLT-03)                              | Change constraint                               |
| Client email not scoped                       | `email @unique` globally     | Should be `@@unique([email, unitId])` (CLT-03)                             | Change constraint                               |
| Task missing `projectId`                      | Not present                  | Derived from Phase (TASK-03)                                               | Add `projectId` + relation                      |
| Task missing `phaseId`                        | Not present                  | Required (TASK-02)                                                         | Add `phaseId` + relation                        |
| Task missing `subPhaseId`                     | Not present                  | Optional (TASK-02)                                                         | Add `subPhaseId` + relation                     |
| Production missing `phaseId`                  | Not present                  | Required (PRD Section 11)                                                  | Add `phaseId` + relation                        |
| Missing `TaskComment` model                   | Not present                  | Required (TASK-19 to TASK-30)                                              | Create model                                    |
| Missing `TaskMention` model                   | Not present                  | Required (TASK-26 to TASK-30)                                              | Create model                                    |
| Missing `ActivityLog` model                   | Not present                  | Required (ACT-01 to ACT-06)                                                | Create model                                    |
| Phase field naming                            | `start`/`end`                | PRD says `startDate`/`endDate`                                             | Rename fields                                   |
| SubPhase field naming                         | `start`/`end`                | PRD says `startDate`/`endDate`                                             | Rename fields                                   |
| Unit missing logo field                       | Not present                  | Required (UNIT-02)                                                         | Add `logo String?`                              |

---

## 2. Architecture Decisions

### File Structure Convention

```
pma-app/
├── app/
│   ├── (auth)/                        # Auth route group
│   │   ├── company/
│   │   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── sign-up/[[...sign-up]]/
│   ├── (dashboard)/                   # Protected route group
│   │   ├── layout.tsx                 # Sidebar + auth wrapper
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Redirect hub
│   │   │   └── notifications/
│   │   │       └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   ├── company/
│   │   │   └── [companyId]/
│   │   │       ├── page.tsx           # Company dashboard
│   │   │       ├── settings/
│   │   │       │   ├── page.tsx
│   │   │       │   └── billing/
│   │   │       │       └── page.tsx
│   │   │       ├── units/
│   │   │       │   └── page.tsx
│   │   │       └── users/
│   │   │           └── page.tsx
│   │   ├── unite/
│   │   │   └── [unitId]/
│   │   │       ├── page.tsx           # Unit dashboard
│   │   │       ├── members/
│   │   │       ├── clients/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [clientId]/
│   │   │       │       └── page.tsx
│   │   │       ├── projects/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [projectId]/
│   │   │       │       └── page.tsx   # Tabbed project detail
│   │   │       ├── kanban/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   └── user/
│   │       └── [userId]/
│   │           └── page.tsx           # User personal dashboard
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts           # Clerk webhook handler
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page
│   └── globals.css
├── components/
│   ├── ui/                            # shadcn primitives
│   ├── sidebar/                       # Sidebar components
│   ├── onboarding/                    # Onboarding wizard steps
│   ├── company/                       # Company-specific components
│   ├── unit/                          # Unit-specific components
│   ├── project/                       # Project components (tabs, forms)
│   ├── gantt/                         # Gantt chart wrappers
│   ├── kanban/                        # Kanban board wrappers
│   ├── production/                    # Production charts and tables
│   ├── time-tracking/                 # Time entry components
│   ├── notifications/                 # Notification bell and panel
│   └── shared/                        # Reusable across features
├── lib/
│   ├── prisma.ts                      # Prisma client singleton
│   ├── nav.ts                         # Navigation source of truth
│   ├── auth.ts                        # Auth helpers (Clerk wrappers)
│   ├── utils.ts                       # General utilities
│   ├── format.ts                      # Algerian number/date formatters
│   ├── validators.ts                  # Zod schemas for form validation
│   └── constants.ts                   # App-wide constants
├── actions/                           # Server Actions by domain
│   ├── company.ts
│   ├── unit.ts
│   ├── project.ts
│   ├── phase.ts
│   ├── production.ts
│   ├── task.ts
│   ├── lane.ts
│   ├── client.ts
│   ├── invitation.ts
│   ├── time-entry.ts
│   ├── notification.ts
│   └── activity-log.ts
├── hooks/
│   ├── use-current-user.ts
│   ├── use-notifications.ts
│   └── use-subscription.ts
├── prisma/
│   ├── schema.prisma                  # Full production schema
│   ├── seed.ts                        # Seed data (Plans)
│   └── migrations/
└── docs/
```

### Server Action Pattern

All server actions follow this pattern:

```typescript
"use server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function createProject(data: CreateProjectInput) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // 2. Get user + company context
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  // 3. Check subscription status (block if READONLY)
  // 4. Check RBAC permissions
  // 5. Check plan limits
  // 6. Validate business rules
  // 7. Execute mutation
  // 8. Create activity log
  // 9. Create notification(s)
  // 10. Revalidate path
}
```

### RBAC Helper Pattern

```typescript
// lib/auth.ts
export async function requireRole(roles: Role[]) {
  const { userId } = await auth()
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user || !roles.includes(user.role)) throw new Error("Forbidden")
  return user
}

export async function requireCompanyScope(companyId: string) {
  const user = await requireRole(["OWNER", "ADMIN", "USER"])
  if (user.companyId !== companyId) throw new Error("Forbidden")
  return user
}
```

---

## 3. Implementation Milestones

### Milestone 1: Foundation & Database

**Goal:** Establish the database, auth, and core infrastructure.

- Fix and finalize `prisma/schema.prisma` from `docs/schema.prisma` with all gap fixes
- Install and configure Clerk (auth provider)
- Install and configure Uploadthing
- Install Jotai
- Set up Prisma client singleton (`lib/prisma.ts`)
- Create database seed script for Plans (Starter, Pro, Premium)
- Run initial migration
- Set up Clerk webhook route (`/api/webhooks/clerk/route.ts`)
- Create auth helpers (`lib/auth.ts`)
- Create utility modules (`lib/format.ts`, `lib/validators.ts`, `lib/constants.ts`)
- Install required shadcn/ui components

### Milestone 2: Layout & Navigation

**Goal:** Build the app shell — sidebar, navigation, role-based routing.

- Install shadcn `sidebar-07` block as sidebar foundation
- Create `lib/nav.ts` — single navigation source of truth
- Build the `(dashboard)/layout.tsx` with sidebar + auth protection
- Implement Company/Unit Switcher for OWNER
- Build role-based sidebar rendering (OWNER / ADMIN / USER views)
- Implement `/dashboard` redirect hub (OWNER → company, ADMIN → unit, USER → personal)
- Create shared page header component
- Create loading skeletons for layouts

### Milestone 3: Onboarding & Auth Flow

**Goal:** Complete auth flow from sign-up to first dashboard visit.

- Build Clerk sign-in page (`/company/sign-in`)
- Build Clerk sign-up page (`/company/sign-up`)
- Build onboarding wizard (3 steps):
  - Step 1: Company Profile (with Uploadthing logo upload)
  - Step 2: First Unit creation
  - Step 3: Invite Team (optional, skippable)
- Server Actions: `createCompany`, `createUnit`, `sendInvitation`
- Auto-create Starter trial subscription on onboarding completion
- Implement Clerk webhook handler for `user.created` (invitation detection)
- Redirect logic: no company → onboarding, has company → dashboard

### Milestone 4: Company & Unit Management

**Goal:** OWNER can manage company settings, units, and billing display.

- Company Dashboard page (`/company/[companyId]`) with KPI cards
- Company Settings page (edit company fields, logo, production threshold)
- Billing page (plan display, usage vs limits, trial countdown, upgrade CTA)
- Units Management page (list, create, delete units)
- Company-wide Team page (all members across all units)
- Unit Dashboard page (`/unite/[unitId]`)
- Unit Settings page
- Unit Members page (list, invite, remove, promote admin)
- Server Actions: `updateCompany`, `createUnit`, `deleteUnit`, `inviteMember`, `removeMember`, `revokeInvitation`
- Implement plan limit checks on all create actions

### Milestone 5: Client CRM

**Goal:** Unit-scoped client management.

- Client List page (`/unite/[unitId]/clients`) with search and sort
- Client Profile page (`/unite/[unitId]/clients/[clientId]`) with linked projects and TTC total
- Client create/edit forms
- Server Actions: `createClient`, `updateClient`, `deleteClient`
- Business rule: block delete if client has InProgress project
- RBAC: ADMIN/OWNER create/edit; USER read-only for assigned project clients

### Milestone 6: Project Management & Phases

**Goal:** Full project CRUD, team management, phase and sub-phase creation.

- Project List page with filters (status, unit, client) and sorting
- Project Create/Edit form (all fields including financial)
- Project Detail page with tabs: Overview, Gantt, Production, Tasks, Time Tracking, Documents
- Project Overview tab: financials (HT, TTC, TVA), progress bar, team, client, ODS, delai
- Team management: add/remove TeamMembers
- Phase CRUD with all business rules:
  - Sum of phase montantHT <= project montantHT (hard block)
  - Phase startDate >= project ODS (hard block)
  - Auto-calculate duration
- SubPhase CRUD with date range validation
- GanttMarker CRUD
- Server Actions: `createProject`, `updateProject`, `archiveProject`, `createPhase`, `updatePhase`, `deletePhase`, `createSubPhase`, `updateSubPhase`, `deleteSubPhase`, `addTeamMember`, `removeTeamMember`, `createGanttMarker`
- Auto-create empty Team on project creation
- Weighted progress calculation (BR-17)
- Algerian currency formatting (1 234 567,89 DA)
- Documents tab with Uploadthing file upload

### Milestone 7: Gantt Chart

**Goal:** Interactive Gantt visualization using kibo-ui.

- Install kibo-ui Gantt (`npx kibo-ui add gantt`)
- Build Gantt wrapper component
- Phases as horizontal bars, color-coded by status
- SubPhases as nested/indented bars
- GanttMarkers as vertical dashed lines
- Progress fill overlay on each bar
- Month/Week/Day zoom toggle
- Today marker
- Drag-to-reschedule for ADMIN/OWNER (read-only for USER)
- Click bar → Phase detail side sheet (shadcn Sheet)
- Overlap warning indicator

### Milestone 8: Kanban Board & Tasks

**Goal:** Full Kanban board with task management, comments, and mentions.

- Install kibo-ui Kanban (`npx kibo-ui add kanban`)
- Lane CRUD (unit-scoped, ordered, colored)
- Task CRUD with all fields and constraints:
  - `projectId` derived from Phase server-side
  - `assignedUserId` must be TeamMember (server-enforced)
  - `subPhaseId` must be child of `phaseId` (server-enforced)
  - Plan maxTasksPerProject check
- Kanban Board page (`/unite/[unitId]/kanban`)
- Task cards: title, assignee avatar, due date, tags, overdue badge
- Drag-and-drop: ADMIN/OWNER any task, USER own tasks only
- Cascading filter bar: Project → Phase → SubPhase
- Task Detail Side Sheet (480px):
  - Title, description, status, lane, assignee picker, due date
  - Tags management
  - Project → Phase → SubPhase context section
  - Time entries for this task
  - Comments tab
- Tag CRUD (unit-scoped, name + color)
- Task Comments system:
  - Post, edit, delete comments
  - `@mention` autocomplete (eligible users only)
  - TaskMention record creation + notification
  - Highlighted mention chips in display
  - Always fresh-fetched (no cache)
- Server Actions for all task/lane/tag/comment operations
- Notifications: task assignment, @mention

### Milestone 9: Production, Time Tracking & Notifications

**Goal:** Production monitoring, time logging, and notification system.

**Production Module:**

- Product creation (one per phase, planned baseline)
- Production entry recording (actual results)
- Auto-calculate `mntProd = Phase.montantHT * (taux / 100)`
- Production tab with two charts:
  - Planned vs Actual rate (line chart)
  - Planned vs Actual amount (grouped bar chart)
- Data table with variance highlighting (red if actual < planned)
- Production alert notifications (below threshold)
- Server Actions: `createProduct`, `createProduction`

**Time Tracking:**

- TimeEntry CRUD
- Live timer (start/stop auto-fills endTime, calculates duration)
- Manual entry form
- Project Time Tracking tab: entries grouped by user, weekly totals
- Task Detail Sheet: time entries per task
- RBAC: users edit own; ADMIN/OWNER edit any in scope
- Server Actions: `createTimeEntry`, `updateTimeEntry`, `deleteTimeEntry`, `startTimer`, `stopTimer`

**Notifications:**

- Notification model with all types
- Bell icon with unread count badge
- Polling every 30s (Client Component + setInterval + Server Action)
- Bell dropdown: latest 5 unread
- Full Notifications page (`/dashboard/notifications`) with filter tabs
- "Mark all as read" action
- Role-targeted delivery logic
- Server Actions: `getUnreadCount`, `getNotifications`, `markAsRead`, `markAllAsRead`
- Create notifications from all trigger points

### Milestone 10: Activity Logs, User Dashboard & Polish

**Goal:** Complete remaining features and polish the application.

**Activity Logs:**

- ActivityLog creation on all key actions (create/edit/delete)
- OWNER sees company-wide, ADMIN unit-scoped, USER project-scoped
- Filter by date range, entityType, user

**User Dashboard (`/user/[userId]`):**

- Assigned Tasks (simplified Kanban or list)
- My Time Entries (grouped by week)
- Recent Notifications
- Assigned Projects (with status and progress)
- Personal Profile / Settings

**Subscription Lifecycle:**

- Trial countdown notifications (day 30, 53, 57)
- Grace period banner (day 60-67)
- Read-only mode enforcement (day 67+) — block all mutations
- Billing page upgrade request form

**Landing Page:**

- Build a proper public landing page at `/`

**Polish:**

- Loading states (Skeleton components) on all pages
- Error boundaries and error states
- Empty states for all list views
- Responsive design review
- Accessibility audit
- Performance optimization (NFR-01 to NFR-04)

---

## 4. Dependency Installation Order

```bash
# Milestone 1 — Foundation
pnpm add @clerk/nextjs
pnpm add uploadthing @uploadthing/react
pnpm add jotai
pnpm add zod
pnpm add svix

# Milestone 6 — Charts for production
pnpm add recharts

# Milestone 7 — Gantt
npx kibo-ui add gantt

# Milestone 8 — Kanban
npx kibo-ui add kanban
```

### shadcn/ui Components to Install

```bash
npx shadcn@latest add sidebar sheet dialog tabs form input select label textarea
npx shadcn@latest add badge avatar dropdown-menu table progress skeleton
npx shadcn@latest add card separator tooltip popover command calendar
npx shadcn@latest add alert checkbox radio-group switch scroll-area
npx shadcn@latest add sonner
```

---

## 5. Environment Variables Required

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/company/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/company/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
CLERK_WEBHOOK_SECRET="whsec_..."

# Uploadthing
UPLOADTHING_TOKEN="..."
```

---

## 6. Verification Strategy

### Per-Milestone Verification

| Check              | Method                                         |
| ------------------ | ---------------------------------------------- |
| Schema correctness | `pnpm prisma validate` + `pnpm prisma db push` |
| TypeScript compile | `pnpm typecheck`                               |
| Build success      | `pnpm build`                                   |
| Visual UI          | Browser DevTools MCP inspection                |
| Auth flow          | Manual sign-up/sign-in via browser             |
| Server Actions     | Test via forms + check DB state                |
| RBAC               | Test with OWNER/ADMIN/USER accounts            |
| Business rules     | Attempt violations, verify error responses     |
| Notifications      | Trigger events, check bell badge + dropdown    |

### End-to-End Smoke Tests

1. Sign up → Complete onboarding → Arrive at company dashboard
2. Create unit → Invite ADMIN → ADMIN logs in → Sees unit dashboard
3. Create client → Create project → Add team → Create phases
4. View Gantt → Drag phase → Verify dates updated
5. Create lanes → Create tasks → Drag between lanes on Kanban
6. Log production → Check chart + variance table
7. Start timer → Stop timer → Verify time entry
8. @mention user in comment → Verify notification received
9. Trial expires → Verify read-only mode blocks mutations
10. OWNER browses all units → Verify cross-unit visibility

---

## Open Questions

**Q1:** The `docs/schema.prisma` has multiple naming discrepancies vs the PRD (e.g., `start`/`end` vs `startDate`/`endDate`, `delai` as String vs two Int fields). **Should I use PRD naming as the authoritative source and rename all fields?**

**Q2:** The current `prisma/schema.prisma` is empty. **Should I overwrite it with the corrected/aligned version from the gap analysis, or keep the reference in `docs/` and build incrementally?**

**Q3:** Do you want me to start execution from Milestone 1, or do you want to review and approve this plan first?

---

_End of Implementation Plan_

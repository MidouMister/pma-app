# PMA — Product Requirements Document

### Version 3.2.0 — AI-Implementable Edition

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack](#2-tech-stack)
3. [Code Architecture](#3-code-architecture)
4. [Caching Strategy](#4-caching-strategy)
5. [Deployment & Git Workflow](#5-deployment--git-workflow)
6. [Problem Statement](#6-problem-statement)
7. [Goals & Success Metrics](#7-goals--success-metrics)
8. [User Personas](#8-user-personas)
9. [System Architecture Overview](#9-system-architecture-overview)
10. [Functional Requirements](#10-functional-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Role-Based Access Control](#12-role-based-access-control)
13. [Business Rules & Constraints](#13-business-rules--constraints)
14. [Data Models Summary](#14-data-models-summary)
15. [Page & Route Inventory](#15-page--route-inventory)
16. [Navigation Structure](#16-navigation-structure)
17. [UI Component Library](#17-ui-component-library)
18. [Out of Scope](#18-out-of-scope)
19. [Glossary](#19-glossary)

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

| Layer                      | Technology                | Version | Notes                                           |
| -------------------------- | ------------------------- | ------- | ----------------------------------------------- |
| Framework                  | Next.js                   | 16      | App Router, Server Actions, Server Components   |
| UI Library                 | React                     | 19      |                                                 |
| Styling                    | Tailwind CSS              | 4       |                                                 |
| Component Library          | shadcn/ui                 | v4      | Already initialized — do NOT re-run init        |
| Sidebar Foundation         | shadcn `sidebar-07` block | —       | Base for all sidebar layouts                    |
| Navigation Source of Truth | `src/lib/nav.ts`          | —       | Single file defining all role-based nav items   |
| Database ORM               | Prisma                    | 7       |                                                 |
| Database                   | Supabase (PostgreSQL)     | —       | DB only — no Supabase Storage, no Supabase Auth |
| Auth                       | Clerk                     | —       | Email/password + OAuth; webhooks for user sync  |
| File Uploads               | Uploadthing               | —       | Logos, project documents, all file uploads      |
| State Management           | Jotai                     | —       | Client-side global state (`store/` directory)   |
| Gantt Component            | kibo-ui Gantt             | —       | `npx kibo-ui add gantt`                         |
| Kanban Component           | kibo-ui Kanban            | —       | `npx kibo-ui add kanban`                        |
| Package Manager            | pnpm                      | —       | Do not use npm or yarn                          |
| Drag & Drop                | dnd-kit                   | —       | Bundled with kibo-ui components                 |

### Key Architecture Decisions

- **Server Actions** are used for all mutations — no separate API routes for data mutations.
- **Server Components** are the default — use Client Components only when interactivity or browser APIs are required.
- **Supabase is used as a PostgreSQL database only** — accessed via Prisma, not via Supabase client SDK or Supabase Auth.
- **Clerk handles all authentication** — user sessions, OAuth, invitation flows, and webhooks.
- **Uploadthing handles all file uploads** — company logos, unit logos, project documents.
- **No Supabase Realtime** — notification count polled every 30 seconds via Client Component `setInterval` + Server Action.
- **Next.js 16 uses `proxy.ts` for middleware** — NOT `middleware.ts`. Critical naming difference.

---

## 3. Code Architecture

> **This section defines the canonical file and directory structure. Every agent must follow this exactly. Do not create files outside these locations.**

### 3.1 Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── company/sign-in/[[...sign-in]]/page.tsx
│   │   ├── company/sign-up/[[...sign-up]]/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Auth guard + SidebarProvider
│   │   ├── dashboard/page.tsx            # Pure redirect hub
│   │   ├── onboarding/page.tsx
│   │   ├── company/[companyId]/          # OWNER routes
│   │   ├── unite/[unitId]/               # ADMIN + OWNER routes
│   │   └── user/[userId]/               # USER workspace routes
│   ├── api/
│   │   ├── uploadthing/                  # Uploadthing route handler
│   │   └── webhooks/clerk/               # Clerk webhook
│   ├── layout.tsx                        # Root layout with ClerkProvider
│   └── site/page.tsx                     # Marketing landing page
│
├── components/
│   ├── ui/                               # shadcn/ui primitives (do not modify)
│   ├── global/                           # App-wide components
│   │   ├── app-header.tsx                # Top header with notification bell + user menu
│   │   ├── breadcrumb.tsx                # Dynamic breadcrumb navigation
│   │   ├── theme-toggle.tsx              # Dark/light mode switch
│   │   ├── subscription-banner.tsx       # Persistent upgrade banner (grace period)
│   │   └── read-only-guard.tsx           # Blocks mutations when READONLY
│   ├── forms/                            # Reusable form field components
│   │   ├── wilaya-select.tsx             # Dropdown of 48 Algerian wilayas
│   │   ├── currency-input.tsx            # Numeric input formatted as DA
│   │   ├── date-picker.tsx               # Date picker with French locale
│   │   ├── logo-uploader.tsx             # Uploadthing logo upload + preview
│   │   ├── role-select.tsx               # Role picker (ADMIN / USER)
│   │   ├── status-select.tsx             # Project/Phase status picker
│   │   └── user-combobox.tsx             # Searchable user picker from unit members
│   ├── sidebar/
│   │   ├── app-sidebar.tsx
│   │   ├── company-unit-switcher.tsx     # OWNER context switcher
│   │   ├── nav-main.tsx
│   │   └── nav-user.tsx
│   ├── shared/                           # Reusable UI blocks
│   │   ├── page-header.tsx
│   │   ├── data-table.tsx
│   │   ├── empty-state.tsx
│   │   └── loading-skeleton.tsx
│   ├── onboarding/                       # Onboarding wizard steps
│   ├── project/                          # Project-specific components
│   ├── gantt/                            # Gantt chart components
│   ├── kanban/                           # Kanban board components
│   └── notifications/                    # Notification bell, dropdown, list
│
├── actions/                              # Server Actions — ALL mutations live here
│   ├── onboarding.ts
│   ├── company.ts
│   ├── unit.ts
│   ├── invitation.ts
│   ├── client.ts
│   ├── project.ts
│   ├── phase.ts
│   ├── subphase.ts
│   ├── gantt-marker.ts
│   ├── task.ts
│   ├── lane.ts
│   ├── tag.ts
│   ├── comment.ts
│   ├── production.ts
│   ├── time-entry.ts
│   ├── notification.ts
│   ├── activity-log.ts
│   └── team.ts
│
├── lib/
│   ├── prisma.ts                         # Prisma client singleton
│   ├── auth.ts                           # getCurrentUser(), requireRole(), requireCompanyScope()
│   ├── cache.ts                          # ALL cacheTag() constants + cacheLife() profiles
│   ├── queries.ts                        # ALL data-fetching functions with 'use cache'
│   ├── types.ts                          # ALL TypeScript interfaces, types, and enums
│   ├── format.ts                         # formatCurrency(), formatDate(), formatDelai()
│   ├── validators.ts                     # Zod schemas for all entities
│   ├── constants.ts                      # Plan tiers, wilayas, notification types
│   ├── subscription.ts                   # Subscription status computation
│   ├── nav.ts                            # Navigation items — single source of truth
│   └── utils.ts                          # cn(), calcProgress(), other utilities
│
├── hooks/
│   ├── use-timer.ts                      # Live timer for time entries
│   └── use-notifications.ts             # Notification polling
│
├── store/                                # Jotai atoms
│   ├── sidebar.ts                        # Sidebar state (active unit, collapsed)
│   └── theme.ts                          # Theme atom
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
└── proxy.ts                              # Next.js 16 Middleware (NOT middleware.ts)
```

### 3.2 `lib/queries.ts` — Data Fetching Source of Truth

All database **read** operations live in `lib/queries.ts`. These are async server functions with the `'use cache'` directive. No raw Prisma queries belong in page components.

```typescript
// lib/queries.ts
import { prisma } from './prisma'
import { cacheTag, cacheLife, unstable_noStore } from 'next/cache'
import { companyTag, unitTasksTag } from './cache'

export async function getCompanyById(companyId: string) {
  'use cache'
  cacheTag(companyTag(companyId))
  cacheLife('days')
  return prisma.company.findUnique({ where: { id: companyId } })
}

export async function getUnitTasks(unitId: string) {
  'use cache'
  cacheTag(unitTasksTag(unitId))
  cacheLife('seconds')
  return prisma.task.findMany({ where: { unitId } })
}

// Never cached — always fresh
export async function getUnreadCount(userId: string) {
  unstable_noStore()
  return prisma.notification.count({ where: { userId, read: false } })
}
```

### 3.3 `lib/types.ts` — TypeScript Source of Truth

All shared TypeScript interfaces and complex return types live here. Do not define types inline in components or actions.

```typescript
// lib/types.ts
export interface ProjectWithPhases {
  id: string
  name: string
  montantHT: number
  phases: Phase[]
}

export interface UserWithRole {
  id: string
  clerkId: string
  role: Role
  companyId: string
  unitId: string | null
  jobTitle?: string
  avatarUrl?: string
}
```

### 3.4 Server Action Pattern

All Server Actions in `actions/` follow this exact sequence:

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { unitProjectsTag } from '@/lib/cache'

export async function createProject(data: CreateProjectInput) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // 2. Get user + validate company/unit scope
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user?.companyId) throw new Error('No company')

  // 3. Check subscription status (block READONLY)
  // 4. Check RBAC permissions
  // 5. Check plan limits
  // 6. Validate business rules
  // 7. Execute mutation
  // 8. Create ActivityLog
  // 9. Create Notifications
  // 10. Revalidate cache tags
  revalidateTag(unitProjectsTag(user.unitId!))
}
```

---

## 4. Caching Strategy

> **PMA uses the Next.js 16 `use cache` directive system.** All cache configuration lives in `src/lib/cache.ts` as the single source of truth.

### 4.1 Caching Primitives

| Primitive            | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `'use cache'`        | Marks an async server function as cacheable                              |
| `cacheTag(tag)`      | Associates cache entry with named tags for targeted invalidation         |
| `cacheLife(profile)` | Sets TTL using named profiles                                            |
| `revalidateTag(tag)` | Called in Server Actions after mutations to purge specific cache entries |
| `unstable_noStore()` | Opts a function fully out of caching — for real-time data                |

### 4.2 Cache Life Profiles

| Profile              | Stale  | Revalidate | Expire | Used For                                      |
| -------------------- | ------ | ---------- | ------ | --------------------------------------------- |
| `"static"`           | ∞      | ∞          | ∞      | Plan definitions — never change at runtime    |
| `"days"`             | 1 day  | 1 day      | 7 days | Company profile, Unit profile                 |
| `"hours"`            | 1 hour | 1 hour     | 1 day  | Project list, Client list, Team members       |
| `"minutes"`          | 1 min  | 1 min      | 5 min  | Project detail, Phase list, Production charts |
| `"seconds"` (custom) | 30 sec | 30 sec     | 2 min  | Kanban lanes & tasks — high interactivity     |
| `noStore`            | —      | —          | —      | Notifications, Activity logs — always fresh   |

### 4.3 Cache Tag Taxonomy (`src/lib/cache.ts`)

```typescript
// src/lib/cache.ts

export const PLANS_TAG = 'plans'

// Company
export const companyTag = (id: string) => `company:${id}`
export const companyTeamTag = (id: string) => `company:${id}:team`

// Subscription
export const subscriptionTag = (companyId: string) => `subscription:${companyId}`

// Unit
export const unitTag = (id: string) => `unit:${id}`
export const unitMembersTag = (id: string) => `unit:${id}:members`
export const unitProjectsTag = (id: string) => `unit:${id}:projects`
export const unitClientsTag = (id: string) => `unit:${id}:clients`
export const unitLanesTag = (id: string) => `unit:${id}:lanes`
export const unitTasksTag = (id: string) => `unit:${id}:tasks`
export const unitTagsTag = (id: string) => `unit:${id}:tags`
export const unitProductionsTag = (id: string) => `unit:${id}:productions`

// Project
export const projectTag = (id: string) => `project:${id}`
export const projectPhasesTag = (id: string) => `project:${id}:phases`
export const projectGanttTag = (id: string) => `project:${id}:gantt`
export const projectTeamTag = (id: string) => `project:${id}:team`
export const projectTimeTag = (id: string) => `project:${id}:time`

// Phase
export const phaseTag = (id: string) => `phase:${id}`
export const phaseProductionTag = (id: string) => `phase:${id}:production`

// User
export const userTag = (id: string) => `user:${id}`
export const userTasksTag = (id: string) => `user:${id}:tasks`
export const userProjectsTag = (id: string) => `user:${id}:projects`
export const userAnalyticsTag = (id: string) => `user:${id}:analytics`
```

### 4.4 Caching Decision Map

#### Company Domain

| Function            | Cache Strategy        | Tags                         |
| ------------------- | --------------------- | ---------------------------- |
| `getCompanyById()`  | `cacheLife("days")`   | `companyTag(id)`             |
| `getCompanyKPIs()`  | `cacheLife("hours")`  | `companyTag(id)`             |
| `getAllUnits()`     | `cacheLife("hours")`  | `companyTag(id)`             |
| `getCompanyTeam()`  | `cacheLife("hours")`  | `companyTeamTag(id)`         |
| `getSubscription()` | `cacheLife("hours")`  | `subscriptionTag(companyId)` |
| `getPlans()`        | `cacheLife("static")` | `PLANS_TAG`                  |

#### Unit Domain

| Function               | Cache Strategy         | Tags                     |
| ---------------------- | ---------------------- | ------------------------ |
| `getUnitById()`        | `cacheLife("days")`    | `unitTag(id)`            |
| `getUnitMembers()`     | `cacheLife("hours")`   | `unitMembersTag(id)`     |
| `getUnitProjects()`    | `cacheLife("hours")`   | `unitProjectsTag(id)`    |
| `getUnitClients()`     | `cacheLife("hours")`   | `unitClientsTag(id)`     |
| `getUnitLanes()`       | `cacheLife("seconds")` | `unitLanesTag(id)`       |
| `getUnitTasks()`       | `cacheLife("seconds")` | `unitTasksTag(id)`       |
| `getUnitTags()`        | `cacheLife("hours")`   | `unitTagsTag(id)`        |
| `getUnitProductions()` | `cacheLife("minutes")` | `unitProductionsTag(id)` |

#### Project Domain

| Function               | Cache Strategy         | Tags                     |
| ---------------------- | ---------------------- | ------------------------ |
| `getProjectById()`     | `cacheLife("minutes")` | `projectTag(id)`         |
| `getProjectPhases()`   | `cacheLife("minutes")` | `projectPhasesTag(id)`   |
| `getGanttData()`       | `cacheLife("minutes")` | `projectGanttTag(id)`    |
| `getProjectTeam()`     | `cacheLife("hours")`   | `projectTeamTag(id)`     |
| `getTimeEntries()`     | `cacheLife("minutes")` | `projectTimeTag(id)`     |
| `getPhaseProduction()` | `cacheLife("minutes")` | `phaseProductionTag(id)` |

#### User Domain

| Function             | Cache Strategy         | Tags                   |
| -------------------- | ---------------------- | ---------------------- |
| `getUserById()`      | `cacheLife("days")`    | `userTag(id)`          |
| `getUserTasks()`     | `cacheLife("seconds")` | `userTasksTag(id)`     |
| `getUserProjects()`  | `cacheLife("hours")`   | `userProjectsTag(id)`  |
| `getUserAnalytics()` | `cacheLife("minutes")` | `userAnalyticsTag(id)` |

#### Never Cached

| Function                | Strategy             | Reason                                     |
| ----------------------- | -------------------- | ------------------------------------------ |
| `getNotifications()`    | `unstable_noStore()` | Must always reflect real-time unread state |
| `getActivityLogs()`     | `unstable_noStore()` | Audit trail must be exactly current        |
| `getUnreadCount()`      | `unstable_noStore()` | Bell badge must be accurate                |
| `getInvitationStatus()` | `unstable_noStore()` | Changes externally via Clerk               |

### 4.5 Cache Invalidation — Server Actions

| Server Action          | Tags Invalidated                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `createUnit()`         | `companyTag(companyId)`                                                              |
| `updateUnit()`         | `unitTag(unitId)`                                                                    |
| `deleteUnit()`         | `companyTag(companyId)`, `unitTag(unitId)`                                           |
| `createProject()`      | `unitProjectsTag(unitId)`                                                            |
| `updateProject()`      | `projectTag(projectId)`, `unitProjectsTag(unitId)`                                   |
| `deleteProject()`      | `unitProjectsTag(unitId)`, `projectTag(projectId)`                                   |
| `createPhase()`        | `projectPhasesTag(projectId)`, `projectGanttTag(projectId)`, `projectTag(projectId)` |
| `updatePhase()`        | `projectPhasesTag(projectId)`, `projectGanttTag(projectId)`, `projectTag(projectId)` |
| `deletePhase()`        | `projectPhasesTag(projectId)`, `projectGanttTag(projectId)`                          |
| `createProduction()`   | `phaseProductionTag(phaseId)`, `unitProductionsTag(unitId)`                          |
| `updateProduction()`   | `phaseProductionTag(phaseId)`, `unitProductionsTag(unitId)`                          |
| `createTask()`         | `unitTasksTag(unitId)`, `userTasksTag(assignedUserId)`                               |
| `updateTask()`         | `unitTasksTag(unitId)`, `userTasksTag(assignedUserId)`                               |
| `moveTask()`           | `unitTasksTag(unitId)`, `unitLanesTag(unitId)`                                       |
| `deleteTask()`         | `unitTasksTag(unitId)`, `userTasksTag(assignedUserId)`                               |
| `createLane()`         | `unitLanesTag(unitId)`                                                               |
| `updateLane()`         | `unitLanesTag(unitId)`                                                               |
| `deleteLane()`         | `unitLanesTag(unitId)`, `unitTasksTag(unitId)`                                       |
| `createClient()`       | `unitClientsTag(unitId)`                                                             |
| `updateClient()`       | `unitClientsTag(unitId)`                                                             |
| `deleteClient()`       | `unitClientsTag(unitId)`                                                             |
| `addTeamMember()`      | `projectTeamTag(projectId)`, `userProjectsTag(userId)`, `companyTeamTag(companyId)`  |
| `removeTeamMember()`   | `projectTeamTag(projectId)`, `userProjectsTag(userId)`, `companyTeamTag(companyId)`  |
| `createTimeEntry()`    | `projectTimeTag(projectId)`, `userAnalyticsTag(userId)`                              |
| `updateTimeEntry()`    | `projectTimeTag(projectId)`, `userAnalyticsTag(userId)`                              |
| `updateSubscription()` | `subscriptionTag(companyId)`                                                         |
| `updateCompany()`      | `companyTag(companyId)`                                                              |
| `updateUser()`         | `userTag(userId)`                                                                    |
| `acceptInvitation()`   | `unitMembersTag(unitId)`, `companyTeamTag(companyId)`                                |

### 4.6 Caching Requirements

| ID       | Requirement                                                                                | Priority  |
| -------- | ------------------------------------------------------------------------------------------ | --------- |
| CACHE-01 | All data-fetching functions in `queries.ts` must use `'use cache'` directive               | Must Have |
| CACHE-02 | All cache tags defined as typed constants in `lib/cache.ts` — no inline string literals    | Must Have |
| CACHE-03 | Every Server Action mutation calls `revalidateTag()` for the minimum set of tags           | Must Have |
| CACHE-04 | Notifications, activity logs, unread count, invitation status use `unstable_noStore()`     | Must Have |
| CACHE-05 | `cacheLife("static")` on `getPlans()` — Plan data never changes at runtime                 | Must Have |
| CACHE-06 | Kanban lanes and tasks use `cacheLife("seconds")`                                          | Must Have |
| CACHE-07 | Cache tags scoped to entity ID — never global broad tags                                   | Must Have |
| CACHE-08 | `use cache` only in Server Components and async server functions — never Client Components | Must Have |
| CACHE-09 | Phase progress update must also invalidate `projectTag(projectId)`                         | Must Have |
| CACHE-10 | Subscription activation by operator invalidates `subscriptionTag(companyId)` immediately   | Must Have |

---

## 5. Deployment & Git Workflow

> **These rules apply to every agent on every task. Read before touching any file.**

### 5.1 Two Environments

| Environment | Branch    | URL                      | Purpose                      |
| ----------- | --------- | ------------------------ | ---------------------------- |
| Production  | `main`    | `pma.yourdomain.com`     | Live app — real users        |
| Staging     | `staging` | `staging-pma.vercel.app` | All development happens here |

Fully isolated — separate Clerk apps, separate Supabase projects, separate Uploadthing apps.

### 5.2 Branch Structure

```
main          ← production only. Never commit here directly.
└── staging   ← all development lands here via PRs.
      └── feature/your-task-name
```

### 5.3 Three Non-Negotiable Rules

**Rule 1 — `main` is protected.** Never commit directly. If on `main`, stop and branch.

**Rule 2 — Always on a feature branch.**

```bash
git checkout staging && git pull origin staging
git checkout -b feature/task-name
```

**Rule 3 — Atomic commits.** One logical change. Conventional Commits format:

```
feat: add phase budget validation hard block
fix: correct subscription grace period logic
chore: create lib/cache.ts with tag constants
```

### 5.4 PR Rules

- Every PR targets `staging` — never `main`.
- Before opening: `git rebase staging`, `pnpm typecheck`, `pnpm lint`.

### 5.5 Merging to Production

```bash
git checkout main && git merge staging && git push origin main
```

---

## 6. Problem Statement

| Pain Point                   | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Fragmented planning tools    | Gantt in Excel, tasks elsewhere, financials separate — no unified project view |
| No production accountability | Planned vs. actual tracked manually — underperformance detected too late       |
| Weak access control          | Spreadsheets expose financial data to all roles indiscriminately               |
| Multi-unit chaos             | No structured way to manage regional branches under one roof                   |
| Subscription scalability     | Small teams need lightweight entry; enterprises need no hard limits            |

---

## 7. Goals & Success Metrics

### Product Goals

| #   | Goal                          | Description                                                     |
| --- | ----------------------------- | --------------------------------------------------------------- |
| G1  | Unified project view          | Financial, planning, production data accessible from one screen |
| G2  | Role-enforced data access     | Users see only what their role permits                          |
| G3  | Production variance detection | Automated alerts when actual production falls below threshold   |
| G4  | Structured multi-tenancy      | Companies manage multiple independent units under one account   |
| G5  | Scalable monetization         | Tiered plans that grow without code changes                     |

### KPIs (6 months post-launch)

| Metric                                   | Target                     |
| ---------------------------------------- | -------------------------- |
| User activation rate                     | > 75% of signups           |
| Weekly Active Users (WAU)                | > 60% of registered users  |
| Average projects per active unit         | ≥ 3                        |
| Notification open rate                   | > 40%                      |
| Trial-to-paid conversion within 2 months | > 25%                      |
| Support tickets related to permissions   | < 5% of active users/month |

---

## 8. User Personas

### Persona 1 — The Company Owner (OWNER)

> _"I need a 10,000-foot view of every project in every unit at any time."_

- **Who:** Founder or CEO of a construction/engineering firm
- **Tech comfort:** Moderate
- **Goals:** Track financial performance, manage subscriptions, ensure units are staffed
- **unitId:** Always `null` — company-wide, not assigned to any unit

---

### Persona 2 — The Unit Administrator (ADMIN)

> _"I run my unit. I need to create projects, assign work, and monitor delivery."_

- **Who:** Branch manager, project director, or site supervisor
- **Tech comfort:** Moderate to high
- **Goals:** Create and track projects end-to-end, manage team, record production
- **unitId:** Set to their assigned unit

---

### Persona 3 — The Regular Member (USER)

> _"Tell me what I need to do today and let me log my work."_

- **Who:** Engineer, technician, field worker, or analyst
- **Tech comfort:** Low to moderate
- **Goals:** See assigned tasks, update progress, log working hours
- **unitId:** Set to their assigned unit

---

## 9. System Architecture Overview

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

- One Company → exactly one OWNER (bootstrapped at onboarding).
- OWNER has `unitId = null` — accesses all units via the sidebar switcher.
- Each Unit has one ADMIN and zero or more Members.
- Members access only projects where they are a TeamMember.
- **Every database query must be scoped by `companyId`. No exceptions.**

---

## 10. Functional Requirements

### 10.1 Authentication & Onboarding

**Auth Provider:** Clerk — **Middleware file: `src/proxy.ts`** (not `middleware.ts`)

| ID      | Requirement                                                                                                                                           | Priority  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AUTH-01 | Users register and log in via Clerk (email/password or OAuth)                                                                                         | Must Have |
| AUTH-02 | First login with no Company and no pending invite → redirect to `/onboarding`                                                                         | Must Have |
| AUTH-03 | Onboarding collects: Company name, email, address, phone, logo, NIF, formJur, wilaya, sector                                                          | Must Have |
| AUTH-04 | Completing onboarding: creates Company, assigns OWNER (`unitId = null`), creates Starter trial, creates first Unit                                    | Must Have |
| AUTH-05 | Invited users skip onboarding. After auth: ADMIN → `/unite/[unitId]`, USER → `/user/[userId]`                                                         | Must Have |
| AUTH-06 | All dashboard routes protected; unauthenticated → `/company/sign-in`                                                                                  | Must Have |
| AUTH-07 | Clerk `user.created` webhook: check pending Invitation for email. If found → assign role. If not → create User without Company (triggers onboarding). | Must Have |

#### `src/proxy.ts` Responsibilities

| Responsibility      | Detail                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Route Protection    | `auth.protect()` gates `/company/*`, `/unite/*`, `/user/*`                         |
| Invitation Handling | Detects `__clerk_ticket` param → routes to `/company/sign-up`                      |
| URL Normalization   | `/sign-in` → `/company/sign-in`                                                    |
| Path Masking        | Rewrites `/` to serve `/site` — browser URL stays clean                            |
| Role Redirect       | OWNER → `/company/[companyId]`, ADMIN → `/unite/[unitId]`, USER → `/user/[userId]` |
| Unrecognized role   | Redirect to `/unauthorized`                                                        |

#### Onboarding Steps

**Step 1 — Company Profile:** Name, logo (Uploadthing), `formJur`, NIF, sector, wilaya, address, phone, email.

**Step 2 — First Unit:** Name, address, phone, email. OWNER's `unitId` remains `null`.

**Step 3 — Invite Team (optional, skippable):** Email + role picker (ADMIN/USER).

---

### 10.2 Company Management

| ID      | Requirement                                                       | Priority    |
| ------- | ----------------------------------------------------------------- | ----------- |
| COMP-01 | OWNER can edit all Company fields                                 | Must Have   |
| COMP-02 | Company logo uploaded via Uploadthing, stored as URL              | Must Have   |
| COMP-03 | OWNER is the only `Role.OWNER` — cannot be granted via invitation | Must Have   |
| COMP-04 | `Company.ownerId` is unique and immutable                         | Must Have   |
| COMP-05 | OWNER can view aggregated data across all units                   | Must Have   |
| COMP-06 | OWNER can delete Company — cascades all data                      | Should Have |

---

### 10.3 Subscription & Plans

#### Payment Methods (Algeria)

| Method             | FR Term               | Flow                                                     |
| ------------------ | --------------------- | -------------------------------------------------------- |
| Bank Wire Transfer | Virement Bancaire     | Company sends transfer; operator confirms and activates  |
| Business Cheque    | Chèque                | Company hands over cheque; operator cashes and activates |
| Service Contract   | Contrat de Prestation | Signed contract defines plan, duration, and price        |

#### Plan Tiers

| Feature             | Starter (Trial) | Pro           | Premium            |
| ------------------- | --------------- | ------------- | ------------------ |
| Duration            | 2 months free   | Annual (paid) | Annual (paid)      |
| Max Units           | 1               | 5             | `null` (unlimited) |
| Max Projects        | **3**           | 30            | `null` (unlimited) |
| Max Tasks / Project | 20              | 200           | `null` (unlimited) |
| Max Members         | 10              | 50            | `null` (unlimited) |
| Contract Required   | No              | Yes           | Yes                |
| Support             | None            | Email         | Dedicated          |

#### Trial Lifecycle

```
Day 0   → Trial starts (startAt = now, endAt = now + 2 months)
Day 30  → GENERAL notification: "Your trial expires in 30 days"
Day 53  → GENERAL notification: "Your trial expires in 7 days"
Day 57  → GENERAL notification: "Your trial ends in 3 days"
Day 60  → Trial ends: persistent upgrade banner, 7-day grace period begins
Day 67  → READ-ONLY mode: all mutations blocked, data preserved
```

After trial: downgrade back to Starter not permitted.

#### Renewal & Suspension (Pro / Premium)

- Paid subscriptions have `startAt` and `endAt` set by PMA operator.
- 30 days before expiry: OWNER receives GENERAL notification to renew.
- After `endAt`: same grace period → read-only flow applies.

| ID     | Requirement                                                               | Priority  |
| ------ | ------------------------------------------------------------------------- | --------- |
| SUB-01 | Starter trial auto-activates at onboarding                                | Must Have |
| SUB-02 | After day 60: 7-day grace period with persistent upgrade banner           | Must Have |
| SUB-03 | After day 67: read-only mode — mutations blocked, redirect to billing     | Must Have |
| SUB-04 | OWNER can submit upgrade request (plan, payment method, contact info)     | Must Have |
| SUB-05 | Operator manually activates subscriptions (out of scope v1)               | Must Have |
| SUB-06 | On activation: `status = ACTIVE`, `startAt`/`endAt` set by operator       | Must Have |
| SUB-07 | All plan limits checked server-side before INSERT                         | Must Have |
| SUB-08 | Billing page: current plan, usage vs limits, trial countdown, upgrade CTA | Must Have |

---

### 10.4 Unit Management

| ID      | Requirement                                                      | Priority    |
| ------- | ---------------------------------------------------------------- | ----------- |
| UNIT-01 | OWNER can create Units (limited by `Plan.maxUnits`)              | Must Have   |
| UNIT-02 | Unit fields: name, address, phone, email, logo (Uploadthing URL) | Must Have   |
| UNIT-03 | Each Unit has exactly one ADMIN                                  | Must Have   |
| UNIT-04 | OWNER can reassign ADMIN role within a unit                      | Must Have   |
| UNIT-05 | OWNER sees all units on company dashboard                        | Must Have   |
| UNIT-06 | Delete Unit: confirmation required, cascades all data            | Should Have |

---

### 10.5 Team & Invitations

| ID     | Requirement                                                               | Priority    |
| ------ | ------------------------------------------------------------------------- | ----------- |
| INV-01 | ADMIN or OWNER can invite users by email with role (ADMIN/USER)           | Must Have   |
| INV-02 | Creates pending Invitation record with unique token; email sent           | Must Have   |
| INV-03 | Invite click → Clerk auth → webhook → user assigned to Unit               | Must Have   |
| INV-04 | Duplicate invitations to same email in same unit rejected                 | Must Have   |
| INV-05 | Invitations expire after 7 days                                           | Should Have |
| INV-06 | ADMIN/OWNER can revoke pending invitation (`status = EXPIRED`)            | Must Have   |
| INV-07 | Remove member: tasks/entries retained, membership deleted, access revoked | Must Have   |
| INV-08 | Unit cannot exceed `Plan.maxMembers`                                      | Must Have   |
| INV-09 | Company team page (OWNER): all members across all units                   | Must Have   |

---

### 10.6 Client CRM

| ID     | Requirement                                                    | Priority    |
| ------ | -------------------------------------------------------------- | ----------- |
| CLT-01 | Clients are Unit-scoped — Unit A's clients invisible to Unit B | Must Have   |
| CLT-02 | ADMIN/OWNER can create, edit, delete Clients                   | Must Have   |
| CLT-03 | Fields: name (unique/unit), wilaya, phone, email (unique/unit) | Must Have   |
| CLT-04 | Client profile: contact details, linked projects, total TTC    | Must Have   |
| CLT-05 | USERs view client info only for assigned projects (read-only)  | Must Have   |
| CLT-06 | Client list: search by name, sort by name / total TTC          | Must Have   |
| CLT-07 | Client with any `InProgress` project cannot be deleted         | Should Have |

---

### 10.7 Project Management

| ID      | Requirement                                                                                                         | Priority    |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| PROJ-01 | ADMIN/OWNER can create Projects within their Unit                                                                   | Must Have   |
| PROJ-02 | Fields: name, code (unique/unit), type, montantHT, montantTTC, ODS, delaiMonths, delaiDays, status, signe, clientId | Must Have   |
| PROJ-03 | Status lifecycle: `New → InProgress → Pause → Complete`                                                             | Must Have   |
| PROJ-04 | `signe` is boolean, display-only — no features gated by it                                                          | Must Have   |
| PROJ-05 | Overview: financials (HT, TTC, TVA, TVA%), progress, team, client, ODS, délai                                       | Must Have   |
| PROJ-06 | Tabs: Overview, Gantt, Production, Tasks, Time Tracking, Documents                                                  | Must Have   |
| PROJ-07 | Project auto-creates empty Team on creation                                                                         | Must Have   |
| PROJ-08 | OWNER sees all; ADMIN sees unit; USER sees assigned only                                                            | Must Have   |
| PROJ-09 | Filter: status, unit (OWNER), client; Sort: date, montantTTC                                                        | Must Have   |
| PROJ-10 | Documents tab: Uploadthing upload (PDF, images, drawings)                                                           | Should Have |
| PROJ-11 | ADMIN can soft-delete (archive) a project                                                                           | Should Have |
| PROJ-12 | `Plan.maxProjects` checked before INSERT                                                                            | Must Have   |

#### Financial Formulas

| Formula          | Expression                                                 |
| ---------------- | ---------------------------------------------------------- |
| TVA Amount       | `montantTTC - montantHT`                                   |
| TVA %            | `((montantTTC - montantHT) / montantHT) × 100`             |
| Project Progress | `Σ(Phase.progress × Phase.montantHT) / Σ(Phase.montantHT)` |
| Délai Display    | `"{delaiMonths} mois {delaiDays} jours"`                   |

---

### 10.8 Phase & Gantt Planning

| ID    | Requirement                                                                                                | Priority    |
| ----- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| PH-01 | ADMIN/OWNER can create Phases                                                                              | Must Have   |
| PH-02 | Fields: name, code, montantHT, startDate, endDate, status, observations, progress (0–100), duration (auto) | Must Have   |
| PH-03 | `Phase.startDate` ≥ `Project.ods` — **hard block**                                                         | Must Have   |
| PH-04 | `Phase.duration` auto-calculated `(endDate - startDate)` in days                                           | Must Have   |
| PH-05 | Sum of `Phase.montantHT` ≤ `Project.montantHT` — **hard block, show remaining budget**                     | Must Have   |
| PH-06 | Each Phase can have multiple SubPhases                                                                     | Must Have   |
| PH-07 | SubPhase fields: name, code, status (`TODO`/`COMPLETED`), progress (0–100), startDate, endDate             | Must Have   |
| PH-08 | SubPhase dates within parent Phase range — **hard block**                                                  | Must Have   |
| PH-09 | When SubPhases exist: `Phase.progress = avg(SubPhase.progress)` auto-calculated                            | Should Have |
| PH-10 | ADMIN/OWNER can add GanttMarkers: label, date, optional CSS class                                          | Must Have   |
| PH-11 | Overlapping phases → visual warning on Gantt                                                               | Should Have |

#### Gantt UI (kibo-ui)

| ID        | Requirement                                               | kibo-ui Native? |
| --------- | --------------------------------------------------------- | --------------- |
| GNT-01    | Phase bars color-coded by status                          | ✅              |
| GNT-02    | SubPhases as nested indented bars                         | ✅ (grouping)   |
| GNT-03    | GanttMarkers as vertical dashed lines + diamond + label   | ✅              |
| GNT-04    | Progress fill overlay on bars                             | 🔧 Custom       |
| GNT-05    | Month/Week/Day zoom toggle                                | 🔧 Custom       |
| GNT-06    | Drag bars to reschedule (ADMIN/OWNER); read-only for USER | ✅              |
| GNT-07    | Phase bar click → Phase detail side sheet                 | 🔧 Custom       |
| GNT-TODAY | Today marker                                              | ✅ Built-in     |

---

### 10.9 Production Monitoring

| ID      | Requirement                                                                                       | Priority  |
| ------- | ------------------------------------------------------------------------------------------------- | --------- |
| PROD-01 | Each Phase has at most one Product (planned baseline)                                             | Must Have |
| PROD-02 | ADMIN creates Product: planned taux, montantProd                                                  | Must Have |
| PROD-03 | ADMIN records Production entries (actual taux)                                                    | Must Have |
| PROD-04 | `Production.mntProd = Phase.montantHT × (taux / 100)` — auto-calculated, never editable           | Must Have |
| PROD-05 | Two charts: (1) Planned vs Actual rate — line, (2) Planned vs Actual amount — grouped bar         | Must Have |
| PROD-06 | Data table: date, planned taux, actual taux, variance, variance %; red rows when actual < planned | Must Have |
| PROD-07 | `actual taux < (Product.taux × alertThreshold / 100)` → PRODUCTION notification to OWNER          | Must Have |
| PROD-08 | Phase Complete + milestone reached → PRODUCTION notification                                      | Must Have |
| PROD-09 | `Company.productionAlertThreshold` default 80, range 1–100, OWNER configurable                    | Must Have |

---

### 10.10 Task & Kanban Board

#### Lane Requirements

| ID      | Requirement                                                                | Priority  |
| ------- | -------------------------------------------------------------------------- | --------- |
| LANE-01 | Lanes are Unit-scoped (shared across all projects in unit)                 | Must Have |
| LANE-02 | ADMIN/OWNER: create, rename, reorder, change color, delete Lanes           | Must Have |
| LANE-03 | `order` integer field; displayed ascending                                 | Must Have |
| LANE-04 | Delete lane with tasks → confirmation → tasks unassigned (`laneId = null`) | Must Have |

#### Task Requirements

| ID      | Requirement                                                                                                                                         | Priority  |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| TASK-01 | ADMIN/OWNER can create Tasks within a Lane                                                                                                          | Must Have |
| TASK-02 | Fields: title, description, startDate, dueDate, endDate, complete, assignedUserId, laneId, order, tags[], phaseId (required), subPhaseId (optional) | Must Have |
| TASK-03 | `projectId` derived server-side from `Phase.projectId` — never set by client                                                                        | Must Have |
| TASK-04 | `assignedUserId` must be TeamMember of task's project — Server Action enforced                                                                      | Must Have |
| TASK-05 | `subPhaseId` must be child of `phaseId` — Server Action enforced                                                                                    | Must Have |
| TASK-06 | `Plan.maxTasksPerProject` checked before INSERT                                                                                                     | Must Have |
| TASK-07 | Assigning a task sends TASK notification to assigned user                                                                                           | Must Have |
| TASK-08 | Cards ordered by `Task.order` within each lane                                                                                                      | Must Have |
| TASK-09 | ADMIN/OWNER can drag tasks between lanes                                                                                                            | Must Have |
| TASK-10 | USER can drag only their own assigned tasks                                                                                                         | Must Have |
| TASK-11 | Overdue: `dueDate < NOW && !complete` → red badge on card                                                                                           | Must Have |
| TASK-12 | Clicking card opens Task Detail Side Sheet (480px)                                                                                                  | Must Have |
| TASK-13 | Sheet: title, description, status, lane, assignee picker, due date, tags, time entries, Project→Phase→SubPhase context                              | Must Have |
| TASK-14 | Phase/SubPhase context NOT on task card — only in Task Detail Sheet                                                                                 | Must Have |
| TASK-15 | USER completes own tasks; ADMIN/OWNER complete any task                                                                                             | Must Have |
| TASK-16 | Task completion does NOT auto-update `SubPhase.progress`                                                                                            | Must Have |
| TASK-17 | Tags: Unit-scoped, name + color                                                                                                                     | Must Have |
| TASK-18 | Kanban filter: Project → Phase → SubPhase cascading dropdowns. Selecting Project immediately filters visible tasks.                                 | Must Have |

#### Task Comments

| ID      | Requirement                                                                                        | Priority  |
| ------- | -------------------------------------------------------------------------------------------------- | --------- |
| TASK-19 | TeamMembers + ADMIN + OWNER of unit can post comments                                              | Must Have |
| TASK-20 | Fields: body (plain text), authorId, createdAt, edited (boolean)                                   | Must Have |
| TASK-21 | Author can edit/delete own comment                                                                 | Must Have |
| TASK-22 | ADMIN/OWNER can delete any comment in their unit                                                   | Must Have |
| TASK-23 | Edited comments show "edited" label next to timestamp                                              | Must Have |
| TASK-24 | Comments ordered by `createdAt` ascending in Task Detail Sheet                                     | Must Have |
| TASK-25 | Comments **never cached** — always fetched fresh                                                   | Must Have |
| TASK-26 | Typing `@` triggers autocomplete of eligible users                                                 | Must Have |
| TASK-27 | Autocomplete: TeamMembers + ADMIN + OWNER, excluding comment author                                | Must Have |
| TASK-28 | On save: parse `@username`, create TaskMention records, send TASK notifications                    | Must Have |
| TASK-29 | Duplicate mentions → one TaskMention + one notification (`@@unique([commentId, mentionedUserId])`) | Must Have |
| TASK-30 | Mentioned usernames render as highlighted chips — not raw `@username`                              | Must Have |

---

### 10.11 Time Tracking

| ID      | Requirement                                                                      | Priority  |
| ------- | -------------------------------------------------------------------------------- | --------- |
| TIME-01 | Any user can log time entries                                                    | Must Have |
| TIME-02 | TimeEntry linked to Task, Project, or both (`taskId` nullable)                   | Must Have |
| TIME-03 | Fields: description, startTime, endTime, duration (minutes, auto-calculated)     | Must Have |
| TIME-04 | Live timer: start → stop auto-fills endTime and calculates duration              | Must Have |
| TIME-05 | Manual entry: direct input of startTime, endTime, description                    | Must Have |
| TIME-06 | Users edit/delete own entries; OWNER/ADMIN edit/delete any in scope              | Must Have |
| TIME-07 | USERs only log time on assigned projects                                         | Must Have |
| TIME-08 | Project Time Tracking tab: grouped by user, total per user per week, grand total | Must Have |
| TIME-09 | Task Detail Sheet shows all time entries for that task                           | Must Have |

---

### 10.12 Notifications

#### Notification Types by Role

| Type         | OWNER | ADMIN | USER                   | Trigger                              |
| ------------ | ----- | ----- | ---------------------- | ------------------------------------ |
| `INVITATION` | ✓     | ✓     | ❌                     | Invite accepted or rejected          |
| `PROJECT`    | ✓     | ✓     | Assigned only          | Project status change                |
| `TASK`       | ✓     | ✓     | ✓ (assigned/mentioned) | Task assigned or @mentioned          |
| `TEAM`       | ✓     | ✓     | ✓                      | Added to / removed from project team |
| `PHASE`      | ✓     | ✓     | —                      | Phase status change                  |
| `CLIENT`     | ✓     | ✓     | —                      | Client added or updated              |
| `PRODUCTION` | ✓     | —     | —                      | Underperformance or milestone        |
| `LANE`       | ✓     | ✓     | —                      | Lane created or deleted              |
| `TAG`        | ✓     | ✓     | —                      | Tag created or deleted               |
| `GENERAL`    | ✓     | ✓     | ✓                      | System-wide, trial warnings          |

| ID       | Requirement                                                                                 | Priority  |
| -------- | ------------------------------------------------------------------------------------------- | --------- |
| NOTIF-01 | Stored: userId, companyId, unitId, type, message, read, targetRole, targetUserId            | Must Have |
| NOTIF-02 | Bell icon shows unread count badge                                                          | Must Have |
| NOTIF-03 | Bell dropdown: latest 5 unread with type icon, message, timestamp                           | Must Have |
| NOTIF-04 | Full page at `/notifications`: filter tabs All / Unread / by Type                           | Must Have |
| NOTIF-05 | "Mark all as read" on notifications page                                                    | Must Have |
| NOTIF-06 | `targetRole: OWNER` → delivers to single OWNER only                                         | Must Have |
| NOTIF-07 | USER receives PROJECT notifications only for assigned projects                              | Must Have |
| NOTIF-08 | Unread count polled every 30 seconds via Client Component `setInterval` + Server Action     | Must Have |
| NOTIF-09 | Polling: Client Component with `setInterval` + Server Action — not `useEffect` fetch to API | Must Have |
| NOTIF-10 | Only count polled — full list fetched on demand when bell opened                            | Must Have |
| NOTIF-11 | `@mention` → TASK notification: `"[Author] vous a mentionné dans [Task title]"`             | Must Have |
| NOTIF-12 | ADMIN notifications fan out to all ADMIN users within the relevant unit                     | Must Have |

---

### 10.13 Activity Logs

| ID     | Requirement                                                                                        | Priority    |
| ------ | -------------------------------------------------------------------------------------------------- | ----------- |
| ACT-01 | Key actions generate ActivityLog: create/edit/delete for Projects, Phases, Tasks, Clients, Members | Must Have   |
| ACT-02 | Fields: companyId, unitId, userId, action, entityType, entityId, metadata (JSON), createdAt        | Must Have   |
| ACT-03 | OWNER views all logs company-wide                                                                  | Must Have   |
| ACT-04 | ADMIN views logs for their unit                                                                    | Must Have   |
| ACT-05 | USER views logs for assigned projects                                                              | Must Have   |
| ACT-06 | Filter: date range, entityType, user                                                               | Should Have |

---

### 10.14 User Personal Dashboard

**Route:** `/user/[userId]` and sub-routes

| Sub-route                  | Description                                                                        | Access                     |
| -------------------------- | ---------------------------------------------------------------------------------- | -------------------------- |
| `/user/[userId]`           | Landing: today's tasks, active projects summary, unread count, recent time entries | USER (own) · OWNER · ADMIN |
| `/user/[userId]/tasks`     | All tasks assigned to this user — filterable                                       | USER (own) · ADMIN         |
| `/user/[userId]/projects`  | Projects where user is TeamMember — status, role, progress                         | USER (own) · ADMIN         |
| `/user/[userId]/analytics` | Performance metrics: hours/week, tasks completed vs pending                        | USER (own) · OWNER · ADMIN |
| `/user/[userId]/profile`   | Edit name, job title, avatar; notification preferences                             | USER (own)                 |

---

## 11. Non-Functional Requirements

### Performance

| ID     | Requirement                                                        |
| ------ | ------------------------------------------------------------------ |
| NFR-01 | Initial page load (LCP) < 2.5s on standard broadband               |
| NFR-02 | Server Actions respond in < 500ms under normal load                |
| NFR-03 | Gantt renders up to 50 phases without visible lag                  |
| NFR-04 | Kanban renders up to 200 tasks across 10 lanes without degradation |

### Security

| ID     | Requirement                                                                          |
| ------ | ------------------------------------------------------------------------------------ |
| NFR-05 | All auth handled by Clerk — no passwords stored in PMA's database                    |
| NFR-06 | All queries include `companyId` scope — tenant isolation enforced at DB level        |
| NFR-07 | Role checks enforced in Server Actions on every mutation — never trusted from client |
| NFR-08 | File uploads validated by Uploadthing (file type, max size)                          |
| NFR-09 | Server Actions validate session and role before executing                            |

### Reliability

| ID     | Requirement                                                             |
| ------ | ----------------------------------------------------------------------- |
| NFR-10 | System uptime target: 99.5% monthly                                     |
| NFR-11 | Supabase automated daily backups                                        |
| NFR-12 | Failed mutations surface a user-facing toast error — no silent failures |
| NFR-13 | Data never permanently deleted on user removal — only access revoked    |
| NFR-14 | All subscription state changes logged in ActivityLog                    |

### Scalability

| ID     | Requirement                                                              |
| ------ | ------------------------------------------------------------------------ |
| NFR-15 | New Plan tiers added without code changes (Plan is a DB entity)          |
| NFR-16 | New notification types added to enum without breaking existing consumers |

### Usability

| ID     | Requirement                                           |
| ------ | ----------------------------------------------------- |
| NFR-17 | Desktop-first; responsive down to 768px (tablet)      |
| NFR-18 | **Dark mode by default**; light mode toggle available |
| NFR-19 | All monetary amounts: `1 234 567,89 DA`               |
| NFR-20 | All dates: `DD MMM YYYY` (e.g. `15 Jan 2026`)         |
| NFR-21 | Skeleton loaders on all data-fetching components      |
| NFR-22 | Empty states: illustration + message + contextual CTA |

---

## 12. Role-Based Access Control

### Role Definitions

| Role    | Scope          | `unitId` | How Assigned                                      |
| ------- | -------------- | -------- | ------------------------------------------------- |
| `OWNER` | Company-wide   | `null`   | Automatically at company creation only            |
| `ADMIN` | Unit-scoped    | Set      | Via invitation `role: ADMIN` or promoted by OWNER |
| `USER`  | Project-scoped | Set      | Via invitation `role: USER`                       |

### Permission Matrix

| Action                           | OWNER          | ADMIN             | USER                    |
| -------------------------------- | -------------- | ----------------- | ----------------------- |
| Create / delete Company          | ✅             | ❌                | ❌                      |
| Manage billing                   | ✅             | ❌                | ❌                      |
| Create / delete Units            | ✅             | ❌                | ❌                      |
| Edit Unit profile                | ✅             | Own only          | ❌                      |
| Invite / remove members          | ✅             | Own unit          | ❌                      |
| Create / edit Projects           | ✅             | Own unit          | ❌                      |
| View Projects                    | ✅ All         | Own unit          | Assigned only           |
| Manage Phases & Gantt            | ✅             | Own unit          | ❌                      |
| Record Production                | ✅             | Own unit          | ❌                      |
| View Production charts           | ✅             | ✅                | Assigned only           |
| Manage Clients                   | ✅             | Own unit          | ❌ (view assigned only) |
| Create / manage Lanes            | ✅             | Own unit          | ❌                      |
| Create Tasks                     | ✅             | Own unit          | ❌                      |
| Drag any task                    | ✅             | ✅                | Own tasks only          |
| Mark task complete               | ✅             | Any task          | Own tasks only          |
| Log time entries                 | ✅ Any project | Own unit projects | Assigned projects only  |
| Edit/delete others' time entries | ✅             | Own unit          | ❌                      |
| Manage Tags                      | ✅             | Own unit          | ❌                      |
| View activity logs               | ✅ All         | Own unit          | Assigned projects       |
| Post task comments               | ✅             | ✅                | If TeamMember           |
| Delete others' comments          | ✅             | Own unit          | ❌                      |

---

## 13. Business Rules & Constraints

### Tenant Isolation

- **BR-01:** Every query must be scoped by `companyId`. No exceptions.
- **BR-02:** A User belongs to exactly one Company. Cross-company access is architecturally impossible.

### Onboarding

- **BR-03:** First User to complete onboarding → `Role.OWNER` with `unitId = null`.
- **BR-04:** One OWNER per Company. Cannot be granted via invitation or promotion.

### Subscription & Limits

- **BR-05:** Plan limits checked server-side before every INSERT. User-facing error — not a DB error.
- **BR-06:** `null` limit = unlimited — check is skipped entirely.
- **BR-07:** Trial expiry computed from `Subscription.endAt` on every page load. Mutations also check status.
- **BR-08:** After grace period (day 67+): all mutations blocked, redirect to billing.
- **BR-09:** Once upgraded to Pro or Premium, downgrade to Starter not permitted.

### Financial Rules

- **BR-10:** Sum of `Phase.montantHT` must never exceed `Project.montantHT`. **Hard block — show remaining budget in error message.**
- **BR-11:** `Phase.startDate` ≥ `Project.ods`. **Hard block.**
- **BR-12:** SubPhase dates within parent Phase range. **Hard block.**
- **BR-13:** `Production.mntProd = Phase.montantHT × (taux / 100)` — system-calculated only.

### Production Alerts

- **BR-14:** `Production.taux < (Product.taux × alertThreshold / 100)` → PRODUCTION notification to OWNER on save.
- **BR-15:** `productionAlertThreshold` default 80, range 1–100, OWNER configurable.

### User Removal

- **BR-16:** Removing a User from a Unit: tasks and time entries retained. Only membership deleted.

### Project Progress

- **BR-17:** `Project.progress = Σ(Phase.progress × Phase.montantHT) / Σ(Phase.montantHT)`. Recalculated on every Phase.progress change.

### Délai Field

- **BR-18:** `delaiMonths Int` + `delaiDays Int`, both default 0. Display: `"{delaiMonths} mois {delaiDays} jours"`.

### Clients

- **BR-19:** Clients Unit-scoped. Unit A's clients invisible to Unit B.
- **BR-20:** Client with any `InProgress` project cannot be deleted.

### Kanban

- **BR-21:** Lanes Unit-scoped. Task retains `laneId` when reassigned between projects.

### Contract Flag

- **BR-22:** `signe` is boolean display flag only. No feature is gated by it.

### Notification Fan-out

- **BR-23:** `targetRole: OWNER` → delivers to the single OWNER. `targetRole: ADMIN` → fan-outs to all ADMINs in the relevant unit.

---

## 14. Data Models Summary

### Core Entities

| Model          | Key Fields                                                                                                    | Relationships                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `Plan`         | id, name, maxUnits, maxProjects, maxTasksPerProject, maxMembers, priceDA                                      | hasMany Subscriptions                                            |
| `Company`      | id, name, ownerId, logo, NIF, formJur, sector, wilaya, address, phone, email, productionAlertThreshold        | hasOne Subscription, hasMany Units, Users                        |
| `Subscription` | id, companyId, planId, status (`TRIAL`/`ACTIVE`/`GRACE`/`READONLY`/`SUSPENDED`), startAt, endAt               | belongsTo Company, Plan                                          |
| `User`         | id, clerkId, name, email, **jobTitle (String?)**, **avatarUrl (String?)**, role, companyId, unitId (nullable) | belongsTo Company, Unit                                          |
| `Unit`         | id, companyId, adminId, name, address, phone, email, logo                                                     | belongsTo Company, hasMany Projects, Clients, Lanes, Invitations |
| `Invitation`   | id, companyId, unitId, email, role, token, status (`PENDING`/`ACCEPTED`/`REJECTED`/`EXPIRED`), expiresAt      | belongsTo Company, Unit                                          |

### Operational Entities

| Model         | Key Fields                                                                                                                     | Relationships                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `Client`      | id, unitId, companyId, name, wilaya, phone, email                                                                              | belongsTo Unit, hasMany Projects                                   |
| `Project`     | id, unitId, companyId, clientId, name, code, type, montantHT, montantTTC, ods, delaiMonths, delaiDays, status, signe (boolean) | belongsTo Unit, Client; hasMany Phases, TeamMembers, TimeEntries   |
| `Team`        | id, projectId                                                                                                                  | belongsTo Project, hasMany TeamMembers                             |
| `TeamMember`  | id, teamId, userId, roleLabel                                                                                                  | belongsTo Team, User                                               |
| `Phase`       | id, projectId, name, code, montantHT, startDate, endDate, duration (auto), status, progress (0–100), observations              | belongsTo Project; hasMany SubPhases, GanttMarkers; hasOne Product |
| `SubPhase`    | id, phaseId, name, code, status (`TODO`/`COMPLETED`), progress, startDate, endDate                                             | belongsTo Phase                                                    |
| `GanttMarker` | id, projectId, label, date, className                                                                                          | belongsTo Project                                                  |
| `Product`     | id, phaseId, taux, montantProd, date                                                                                           | belongsTo Phase, hasMany Productions                               |
| `Production`  | id, productId, phaseId, taux, mntProd (auto-calculated), date                                                                  | belongsTo Product                                                  |

### Execution & Tracking

| Model          | Key Fields                                                                                                                                                                      | Relationships                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `Lane`         | id, unitId, companyId, name, color, order                                                                                                                                       | belongsTo Unit, hasMany Tasks                        |
| `Task`         | id, unitId, companyId, projectId (derived), phaseId (required), subPhaseId (nullable), laneId, assignedUserId, title, description, startDate, dueDate, endDate, complete, order | belongsTo Unit, Lane, User, Project, Phase, SubPhase |
| `Tag`          | id, unitId, name, color                                                                                                                                                         | belongsTo Unit                                       |
| `TaskComment`  | id, taskId, authorId, companyId, body, edited, createdAt                                                                                                                        | belongsTo Task, User; hasMany TaskMentions           |
| `TaskMention`  | id, commentId, mentionedUserId, companyId                                                                                                                                       | `@@unique([commentId, mentionedUserId])`             |
| `TimeEntry`    | id, companyId, userId, projectId, taskId (nullable), description, startTime, endTime, duration (minutes)                                                                        | belongsTo User, Project, Task                        |
| `Notification` | id, companyId, unitId, userId, type, message, read, targetRole, targetUserId                                                                                                    | belongsTo Company, Unit, User                        |
| `ActivityLog`  | id, companyId, unitId, userId, action, entityType, entityId, metadata (JSON), createdAt                                                                                         | belongsTo Company, Unit, User                        |

> `User.jobTitle` and `User.avatarUrl` are optional (`String?`). Add via Prisma migration if not already in schema.

---

## 15. Page & Route Inventory

### 15.1 Routing Middleware — `src/proxy.ts`

| Responsibility      | Detail                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Route Protection    | `auth.protect()` gates `/company/*`, `/unite/*`, `/user/*`                         |
| Invitation Handling | Detects `__clerk_ticket` param → routes to `/company/sign-up`                      |
| URL Normalization   | `/sign-in` → `/company/sign-in`                                                    |
| Path Masking        | Rewrites `/` to `/site` — browser URL stays clean                                  |
| Role Redirect       | OWNER → `/company/[companyId]`, ADMIN → `/unite/[unitId]`, USER → `/user/[userId]` |

| Scenario               | Behavior                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| New Owner (no company) | Redirect to `/company` — onboarding launchpad                    |
| Invited User           | `InvitationProcessor` assigns role before routing to destination |
| No role / no companyId | Redirect to `/unauthorized`                                      |

### 15.2 Public Routes

| Route              | Description                                  |
| ------------------ | -------------------------------------------- |
| `/`                | Rewritten to `/site` — browser URL stays `/` |
| `/site`            | Marketing landing page                       |
| `/company/sign-in` | Clerk Sign In                                |
| `/company/sign-up` | Clerk Sign Up — invitation links land here   |

### 15.3 Routing Hub

| Route        | Behavior                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `/dashboard` | Pure redirect: OWNER → `/company/[companyId]`, ADMIN → `/unite/[unitId]`, USER → `/user/[userId]` |

### 15.4 Onboarding

| Route         | Description                                               |
| ------------- | --------------------------------------------------------- |
| `/onboarding` | Multi-step wizard — authenticated users with no Company   |
| `/company`    | Onboarding launchpad for new owners before company exists |

### 15.5 Company Routes (OWNER only)

| Route                                   | Page                                                                  |
| --------------------------------------- | --------------------------------------------------------------------- |
| `/company/[companyId]`                  | Company Dashboard — KPIs, all units, financial summary, activity feed |
| `/company/[companyId]/units`            | Units Management — list, create, delete, assign admins                |
| `/company/[companyId]/users`            | Company Team — all members, roles, pending invitations                |
| `/company/[companyId]/settings`         | Company Settings — metadata, logo, legal info                         |
| `/company/[companyId]/settings/billing` | Billing — plan, usage, Request Upgrade form, renewal                  |

### 15.6 Unit Routes (ADMIN + OWNER)

| Route                                  | Access                          | Description                            |
| -------------------------------------- | ------------------------------- | -------------------------------------- |
| `/unite`                               | ADMIN                           | Unit selection page                    |
| `/unite/[unitId]`                      | OWNER · ADMIN                   | Unit Dashboard — KPIs, activity        |
| `/unite/[unitId]/projects`             | OWNER · ADMIN                   | Project list, create new               |
| `/unite/[unitId]/projects/[projectId]` | OWNER · ADMIN · USER (assigned) | Project detail — tabbed                |
| `/unite/[unitId]/tasks`                | OWNER · ADMIN                   | **Kanban board** — all lanes and tasks |
| `/unite/[unitId]/clients`              | OWNER · ADMIN                   | Client CRM                             |
| `/unite/[unitId]/clients/[clientId]`   | OWNER · ADMIN                   | Client Profile                         |
| `/unite/[unitId]/productions`          | OWNER · ADMIN                   | Unit-wide production monitoring        |
| `/unite/[unitId]/members`              | OWNER · ADMIN                   | Member directory, invitations          |
| `/unite/[unitId]/settings`             | OWNER · ADMIN                   | Unit settings                          |

### 15.7 User Workspace Routes

| Route                      | Access                     | Description                               |
| -------------------------- | -------------------------- | ----------------------------------------- |
| `/user/[userId]`           | USER (own) · OWNER · ADMIN | Personal dashboard                        |
| `/user/[userId]/tasks`     | USER (own) · ADMIN         | Assigned tasks, filterable                |
| `/user/[userId]/projects`  | USER (own) · ADMIN         | Assigned projects                         |
| `/user/[userId]/analytics` | USER (own) · OWNER · ADMIN | Performance metrics                       |
| `/user/[userId]/profile`   | USER (own)                 | Edit name, job title, avatar, preferences |

### 15.8 Shared / Utility Routes

| Route            | Access                  | Description                                                |
| ---------------- | ----------------------- | ---------------------------------------------------------- |
| `/notifications` | All authenticated roles | Full notifications page — filter by type, mark all as read |
| `/unauthorized`  | Any authenticated user  | Shown when role does not permit access                     |

---

## 16. Navigation Structure

### 16.1 OWNER Sidebar Behavior

Company/Unit Switcher at the top: selecting "Company" shows company nav; selecting a Unit shows admin nav for that unit (OWNER retains full permissions). Built on shadcn `sidebar-07`. All nav items in `src/lib/nav.ts`.

### 16.2 Sidebar Menu — By Role & Context

#### OWNER — Company Context

| Menu (FR)       | Route                                   |
| --------------- | --------------------------------------- |
| Tableau de Bord | `/company/[companyId]`                  |
| Unités          | `/company/[companyId]/units`            |
| Équipe          | `/company/[companyId]/users`            |
| Paiement        | `/company/[companyId]/settings/billing` |
| Paramètres      | `/company/[companyId]/settings`         |
| Notifications   | `/notifications`                        |

#### OWNER (Unit selected) / ADMIN

| Menu (FR)       | Route                         |
| --------------- | ----------------------------- |
| Tableau de Bord | `/unite/[unitId]`             |
| Projets         | `/unite/[unitId]/projects`    |
| Tâches          | `/unite/[unitId]/tasks`       |
| Clients         | `/unite/[unitId]/clients`     |
| Production      | `/unite/[unitId]/productions` |
| Membres         | `/unite/[unitId]/members`     |
| Paramètres      | `/unite/[unitId]/settings`    |
| Notifications   | `/notifications`              |

#### USER

| Menu (FR)     | Route                      |
| ------------- | -------------------------- |
| Mon Espace    | `/user/[userId]`           |
| Mes Tâches    | `/user/[userId]/tasks`     |
| Mes Projets   | `/user/[userId]/projects`  |
| Analytiques   | `/user/[userId]/analytics` |
| Notifications | `/notifications`           |

### 16.3 Sidebar Requirements

| ID     | Requirement                                                                |
| ------ | -------------------------------------------------------------------------- |
| SDB-01 | Sidebar adapts based on User role AND current view context                 |
| SDB-02 | OWNER sees Company/Unit Switcher — other roles do not                      |
| SDB-03 | Active route highlighted                                                   |
| SDB-04 | Sidebar collapsible to icon-only mode                                      |
| SDB-05 | Unread count badge on Notifications menu item                              |
| SDB-06 | All nav items defined in `src/lib/nav.ts` — no hardcoded nav in components |
| SDB-07 | Sidebar footer: logged-in user name, role badge, avatar                    |

---

## 17. UI Component Library

### kibo-ui Gantt — `npx kibo-ui add gantt`

| Feature                       | Status    |
| ----------------------------- | --------- |
| Horizontal bars with grouping | ✅ Native |
| Draggable & resizable bars    | ✅ Native |
| Read-only mode                | ✅ Native |
| Markers (vertical lines)      | ✅ Native |
| Today marker                  | ✅ Native |
| Progress fill overlay         | 🔧 Custom |
| Month/Week/Day zoom           | 🔧 Custom |
| Phase bar click → side sheet  | 🔧 Custom |
| Overlap warning               | 🔧 Custom |

### kibo-ui Kanban — `npx kibo-ui add kanban`

| Feature                                           | Status    |
| ------------------------------------------------- | --------- |
| Drag & drop between columns                       | ✅ Native |
| Customizable card contents                        | ✅ Native |
| Overdue badge on card                             | 🔧 Custom |
| Cascading filter bar (Project → Phase → SubPhase) | 🔧 Custom |
| Task Detail Side Sheet (480px)                    | 🔧 Custom |

### shadcn/ui Components

`Sheet`, `Dialog`, `Tabs`, `Form`, `Input`, `Select`, `Badge`, `Avatar`, `DropdownMenu`, `Sidebar` (sidebar-07), `Table`, `Progress`, `Skeleton`, `Sonner`, `Card`, `Separator`, `Tooltip`, `Popover`, `Command`, `Calendar`, `Alert`, `Checkbox`, `Switch`, `ScrollArea`

---

## 18. Out of Scope (v1.0)

| Feature                                  | Reason                               |
| ---------------------------------------- | ------------------------------------ |
| Operator Panel (subscription activation) | Not designed yet — separate PRD      |
| Mobile native app                        | Desktop-first; mobile web sufficient |
| Real-time collaborative editing          | Polling sufficient for v1            |
| Gantt dependency arrows                  | Schema enum defined for future use   |
| Advanced reporting & PDF export          | Phase 2                              |
| Two-factor authentication                | Delegated to Clerk settings          |
| Custom domain / white-labeling           | Enterprise tier, post-launch         |
| Offline mode / PWA                       | Phase 2                              |
| External calendar sync                   | Phase 2                              |
| Public project share links               | Phase 2                              |
| Comment character limits                 | No limit in v1                       |
| Comment file attachments                 | Phase 2                              |
| Comment markdown rendering               | Plain text only in v1                |

---

## 19. Glossary

| Term                             | Definition                                                            |
| -------------------------------- | --------------------------------------------------------------------- |
| **HT (Hors Taxe)**               | Pre-tax amount (excluding VAT)                                        |
| **TTC (Toutes Taxes Comprises)** | Total amount including all taxes                                      |
| **TVA**                          | Taxe sur la Valeur Ajoutée — VAT in Algeria                           |
| **ODS**                          | Ordre de Service — official project start order date                  |
| **Délai**                        | `delaiMonths + delaiDays` integers. Display: `"X mois Y jours"`       |
| **Taux**                         | Production rate as percentage (0–100)                                 |
| **montantProd**                  | `Phase.montantHT × (taux / 100)`                                      |
| **Phase**                        | Major deliverable block — own budget and timeline                     |
| **SubPhase**                     | Granular sub-task within a Phase                                      |
| **GanttMarker**                  | Vertical milestone line on Gantt — label, date, optional CSS class    |
| **Product**                      | Planned production baseline for a Phase (one per phase)               |
| **Production**                   | Actual production record logged against a Product                     |
| **Lane**                         | Kanban column — Unit-scoped                                           |
| **TeamMember**                   | Junction linking a User to a Project's Team                           |
| **Multi-Tenant**                 | One app, multiple isolated companies — isolated by `companyId`        |
| **RBAC**                         | Role-Based Access Control — enforced server-side                      |
| **Onboarding**                   | First-run wizard — creates Company, first Unit, sets OWNER            |
| **Virement Bancaire**            | Bank wire transfer — primary offline payment in Algeria               |
| **Wilaya**                       | Algerian administrative province (48 total)                           |
| **formJur**                      | Legal form of company (SARL, SPA, EURL, etc.)                         |
| **NIF**                          | Numéro d'Identification Fiscale — Algerian tax ID                     |
| **signe**                        | Boolean flag — contract signed indicator, display only                |
| **OWNER**                        | Company-wide role. `unitId = null`. One per company. Onboarding only. |
| **ADMIN**                        | Unit-scoped role. Full control within unit.                           |
| **USER**                         | Project-scoped role. Accesses only assigned projects.                 |
| **Server Action**                | Next.js 16 server-side function — all mutations                       |
| **proxy.ts**                     | Next.js 16 middleware (NOT `middleware.ts`) — routing + auth          |
| **kibo-ui**                      | shadcn-compatible library — Gantt and Kanban components               |
| **`use cache`**                  | Next.js 16 directive marking a server function as cacheable           |
| **cacheTag**                     | Associates cache entry with a named tag for invalidation              |
| **cacheLife**                    | Sets the TTL profile for a cached function                            |
| **queries.ts**                   | `lib/queries.ts` — all data-fetching with caching                     |
| **cache.ts**                     | `lib/cache.ts` — all cache tag constants and profiles                 |

---

_End of Document — PMA PRD v3.2.0_

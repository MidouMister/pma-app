# PMA (Project Management App)

**Version:** 0.0.1  
**Framework:** Next.js 16 (App Router)  
**Package Manager:** pnpm (do not use npm or yarn)

---

## Project Overview

PMA is a multi-tenant, enterprise-grade project management web application targeting construction, engineering, and public works companies in Algeria. The platform replaces fragmented spreadsheet workflows with a unified system covering:

- **Project financials** (HT/TTC with Algerian formatting)
- **Gantt-based planning** (phases, sub-phases, markers)
- **Production monitoring** (planned vs. actual output tracking)
- **Kanban task management** (lanes, tasks, comments, @mentions)
- **Time tracking** (manual entries + live timer)
- **Client CRM** (unit-scoped client management)
- **Role-based notifications** (production alerts, task assignments, invitations)

### Multi-Tenant Architecture

```
Company (1 OWNER · 1 Subscription · 1 Plan)
  └── Unit (1 ADMIN · N Members)
        ├── Projects → Phases → SubPhases
        ├── Clients
        ├── Lanes → Tasks
        └── Invitations
```

**Key hierarchy rules:**
- One Company is owned by exactly one User (the OWNER)
- A Company contains one or more Units (count limited by Plan)
- Each Unit has one ADMIN and zero or more Members
- Projects belong to a Unit; Members access only projects they are assigned to
- The OWNER has no `unitId` — they access all units through a switcher
- **CRITICAL:** All database queries must be scoped by `companyId` (BR-01)

---

## Tech Stack (Do Not Deviate)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16 | App Router, Server Actions, Server Components |
| UI Library | React | 19 | |
| Styling | Tailwind CSS | 4 | |
| Components | shadcn/ui | v4 | Already initialized — do NOT re-run init |
| Database ORM | Prisma | 7 | |
| Database | Supabase PostgreSQL | — | DB only — no Supabase SDK or Auth |
| Auth | Clerk | — | Email/password + OAuth; webhooks for user sync |
| File Uploads | Uploadthing | — | Logos, project documents |
| State | Jotai | — | Client-side global state |
| Gantt/Kanban | kibo-ui | — | `npx kibo-ui add gantt/kanban` |

---

## Building and Running

### Development

```bash
pnpm dev                    # Start dev server with Turbopack (http://localhost:3000)
```

### Production

```bash
pnpm build                  # Production build
pnpm start                  # Start production server
```

### Code Quality

```bash
pnpm lint                   # Run ESLint on all files
pnpm typecheck              # Run TypeScript compiler (no emit)
pnpm format                 # Format all files with Prettier
```

### Database Operations

```bash
pnpm prisma validate                  # Validate Prisma schema
pnpm prisma db push                   # Push schema to database
pnpm prisma db seed                   # Run database seed (Plan records)
pnpm prisma migrate dev --name <name> # Create new migration
```

**Note:** No test framework is installed. Verify code correctness via `pnpm typecheck` and `pnpm lint`.

---

## Project Structure

```
pma-app/
├── app/
│   ├── (auth)/              # Public auth routes (Clerk sign-in/up)
│   ├── (dashboard)/         # Protected routes with sidebar
│   │   ├── dashboard/       # Redirect hub based on role
│   │   ├── company/         # OWNER company views
│   │   ├── unite/           # Unit views (ADMIN/USER)
│   │   └── user/            # USER personal views
│   ├── api/
│   │   └── uploadthing/     # File upload endpoints
│   ├── layout.tsx           # Root layout with ClerkProvider
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui primitives (28 installed)
│   ├── theme-provider.tsx   # next-themes provider
│   ├── sidebar/             # Sidebar components
│   ├── shared/              # Reusable components (page-header, data-table, empty-state)
│   ├── onboarding/          # Onboarding wizard steps
│   ├── project/             # Project-specific components
│   ├── kanban/              # Kanban board components
│   ├── gantt/               # Gantt chart components
│   └── notifications/       # Notification components
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth.ts              # Clerk auth helpers
│   ├── format.ts            # Algerian currency/date formatting
│   ├── validators.ts        # Zod schemas for forms
│   ├── constants.ts         # Plan limits, wilayas, notification types
│   ├── subscription.ts      # Subscription status computation
│   ├── utils.ts             # cn() utility
│   └── nav.ts               # Navigation source of truth (role-based)
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data (Plan records)
├── proxy.ts                 # Clerk middleware (Next.js 16 uses proxy.ts, not middleware.ts)
└── docs/
    ├── PRD.md               # Product Requirements Document
    ├── tasks.md             # Project tasks & milestones
    └── implementation_plan.md
```

---

## Development Conventions

### TypeScript

- **Strict mode enabled** — no `any` types, no implicit returns
- Use explicit types for all function parameters and return values
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `enum` — prefer const objects or string unions
- Always use the `@/` path alias (configured in tsconfig.json)

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files (components) | kebab-case | `task-card.tsx` |
| Files (server actions) | kebab-case | `create-task.ts` |
| React Components | PascalCase | `TaskCard.tsx` |
| Server Actions | camelCase (exported) | `createTask()` |
| Variables/Functions | camelCase | `totalAmount` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `ProjectFormData` |

### Import Order

```typescript
// 1. Next.js / React
import { useState } from "react"
import Link from "next/link"

// 2. Third-party libraries
import { clsx } from "clsx"
import { format } from "date-fns"

// 3. shadcn/ui components
import { Button } from "@/components/ui/button"

// 4. Internal components
import { PageHeader } from "@/components/shared/page-header"

// 5. Lib utilities
import { formatCurrency } from "@/lib/format"

// 6. Actions / hooks
import { createProject } from "@/actions/project"
```

### Formatting (Prettier)

- **No semicolons** at line ends
- **Double quotes** for strings
- **2 spaces** for indentation
- **Trailing commas** in ES5 contexts
- **80 character** print width
- Tailwind CSS class sorting via `prettier-plugin-tailwindcss`

### Component Patterns

**Server vs Client Components:**
- Default to **Server Components** — no `"use client"` directive
- Add `"use client"` only when using hooks, browser APIs, or event handlers
- Keep client boundaries minimal

### Server Actions Pattern

All mutations use Server Actions following this pattern:

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

### Error Handling

- Use `try/catch` blocks around all Prisma operations
- Throw `Error` objects with clear messages — never silent failures
- User-facing errors should be descriptive and in French
- Never expose raw database errors to the client
- Use Zod for form validation — return `zodError.errors` for field-level feedback

---

## Business Rules (Critical)

| Rule | Description |
|---|---|
| **BR-01** | All queries scoped by `companyId` — no exceptions |
| **BR-05** | Plan limits checked server-side before INSERT |
| **BR-10** | Sum of `Phase.montantHT` cannot exceed `Project.montantHT` (hard block) |
| **BR-11** | `Phase.startDate` must be >= `Project.ods` (hard block) |
| **BR-12** | SubPhase dates must be within parent Phase range (hard block) |
| **SEC-02** | Role checks enforced at Server Action level, not just UI |

---

## Prisma Enums (Do Not Rename)

```prisma
enum Role { OWNER, ADMIN, USER }
enum Status { New, InProgress, Pause, Complete }
enum InvitationStatus { PENDING, ACCEPTED, REJECTED, EXPIRED }
enum NotificationType { INVITATION, PROJECT, TASK, CLIENT, PHASE, TEAM, LANE, TAG, PRODUCTION, GENERAL }
enum SubPhaseStatus { TODO, COMPLETED }
enum SubscriptionStatus { TRIAL, ACTIVE, GRACE, READONLY, SUSPENDED }
```

---

## Environment Variables

Required in `.env`:

```env
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

## Key Files

| File | Purpose |
|---|---|
| `docs/PRD.md` | Product Requirements Document — authoritative feature specification |
| `docs/tasks.md` | Project milestones and task tracking |
| `prisma/schema.prisma` | Database schema — single source of truth for data models |
| `lib/constants.ts` | Plan limits, Algerian wilayas, status colors, notification types |
| `lib/nav.ts` | Navigation source of truth — all role-based nav items defined here |
| `proxy.ts` | Clerk middleware — protects `/dashboard`, `/company`, `/unite`, `/user`, `/onboarding` |

---

## Adding Components

### shadcn/ui Components

The project is already initialized with shadcn/ui. To add components:

```bash
npx shadcn@latest add <component-name>
```

**Do NOT run** `npx shadcn@latest init` — the project is already configured.

### kibo-ui Components

```bash
npx kibo-ui add gantt    # Gantt chart component
npx kibo-ui add kanban   # Kanban board component
```

---

## Formatting Utilities

Use functions from `lib/format.ts` for all display values:

```typescript
formatCurrency(1234567.89)    // → "1 234 567,89 DA"
formatDelai(3, 15)            // → "3 mois 15 jours"
formatDate(new Date())        // → locale-aware French date string
```

---

## Before You Submit

1. Run `pnpm typecheck` — must pass with no errors
2. Run `pnpm lint` — must pass with no errors
3. Run `pnpm format` — all files formatted
4. Verify tenant isolation in all Prisma queries (every query must include `companyId`)
5. Verify business rule enforcement in server actions
6. Check `docs/PRD.md` and `docs/tasks.md` to ensure the feature is fully implemented
7. **For Clerk tasks** — Confirm filename: Next.js 16 uses `proxy.ts`, NOT `middleware.ts`
8. **For shadcn tasks** — Always run `npx shadcn@latest info` first to check installed components

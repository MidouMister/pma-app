# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PMA (Project Management App) is a multi-tenant, enterprise-grade project management web application for construction, engineering, and public works companies in Algeria. Built with Next.js 16 (App Router), it uses Supabase PostgreSQL, Clerk auth, and shadcn/ui.

## Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript compiler (no emit)
pnpm format           # Format all files with Prettier

# Database
pnpm prisma validate          # Validate Prisma schema
pnpm prisma db push           # Push schema to database
pnpm prisma db seed           # Run database seed
pnpm prisma migrate dev -n <name>  # Create migration
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Components | shadcn/ui v4 |
| Database | Prisma 7 + Supabase PostgreSQL |
| Auth | Clerk |
| File Uploads | Uploadthing |
| State | Jotai |
| Gantt/Kanban | kibo-ui |

## Architecture

### Multi-Tenant Structure
```
Company (1 OWNER · 1 Subscription)
  └── Unit (1 ADMIN · N Members)
        ├── Projects → Phases → SubPhases
        ├── Clients
        └── Lanes → Tasks
```

**Critical:** Every Prisma query must be scoped by `companyId` (BR-01).

### Route Groups
```
app/
├── (auth)/           # Public auth routes (Clerk)
├── (dashboard)/      # Protected routes with sidebar
│   ├── company/      # OWNER views
│   ├── unite/        # Unit views (ADMIN/USER)
│   └── user/         # USER personal views
├── api/             # API routes (webhooks, uploadthing)
└── onboarding/      # Onboarding flow
```

### Key Directories
- `actions/` - Server Actions for all mutations
- `components/ui/` - shadcn/ui primitives
- `components/shared/` - Reusable components (PageHeader, DataTable, EmptyState)
- `lib/` - Utilities (prisma, auth, format, validators, constants, nav)
- `prisma/` - Database schema and seed

## Business Rules (Critical)

| Rule | Description |
|------|-------------|
| BR-01 | All queries scoped by `companyId` — no exceptions |
| BR-05 | Plan limits checked server-side before INSERT |
| BR-10 | Sum of `Phase.montantHT` cannot exceed `Project.montantHT` |
| BR-11 | `Phase.startDate` >= `Project.ods` |
| BR-12 | SubPhase dates within parent Phase range |
| SEC-02 | Role checks enforced at Server Action level |

## Server Actions Pattern

```typescript
"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@lib/prisma"
import { revalidatePath } from "next/cache"

export async function createEntity(data: InputType) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // 2. Get user + validate company/unit scope
  const user = await prisma.user.findUnique({ where: { clerkId: userId } }

  // 3. Check subscription status (block READONLY)
  // 4. Check RBAC permissions
  // 5. Check plan limits
  // 6. Validate business rules
  // 7. Execute mutation
  // 8. Revalidate path
}
```

## Component Patterns

- Default to **Server Components** — add `"use client"` only when using hooks or browser APIs
- Use `cn()` from `lib/utils.ts` for conditional Tailwind classes
- Use `formatCurrency()`, `formatDate()`, `formatDelai()` from `lib/format.ts` for display

## Adding Components

```bash
# shadcn/ui (already initialized — do NOT run init)
npx shadcn@latest add <component-name>

# kibo-ui
npx kibo-ui add gantt
npx kibo-ui add kanban
```

## Before Submitting

1. Run `pnpm typecheck` — must pass
2. Run `pnpm lint` — must pass
3. Run `pnpm format`
4. Verify tenant isolation (`companyId` in all Prisma queries)
5. Verify business rule enforcement in server actions
6. **Clerk in Next.js 16:** Use `proxy.ts`, NOT `middleware.ts`

## Key Files

- `docs/PRD.md` - Product Requirements Document
- `docs/tasks.md` - Project milestones
- `prisma/schema.prisma` - Database schema
- `lib/nav.ts` - Navigation source of truth
- `lib/constants.ts` - Plan limits, wilayas, status colors
- `proxy.ts` - Clerk middleware
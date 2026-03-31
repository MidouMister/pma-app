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

### 1.1 Two Environments, Two Branches

| Environment | Branch    | Vercel URL               | Purpose                       |
| ----------- | --------- | ------------------------ | ----------------------------- |
| Production  | `main`    | `pma.yourdomain.com`     | Live app — real users         |
| Staging     | `staging` | `staging-pma.vercel.app` | Where all development happens |

Every push to `staging` triggers an automatic Vercel build on the staging URL.  
Every merge into `main` triggers a production deploy.  
They are fully isolated — separate Clerk apps, separate Supabase projects, separate Uploadthing apps.

### 1.2 Branch Structure

```
main          ← production only. Never commit here directly.
└── staging   ← all development lands here via PRs.
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
  - [ ] Vercel preview build passes (auto-built for every PR)
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

Only after staging is confirmed working on the Vercel staging URL:

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
├── sidebar/          # Sidebar components (to be built)
├── shared/           # Reusable across features (to be built)
├── onboarding/       # Onboarding wizard steps (to be built)
├── project/          # Project-specific components (to be built)
├── kanban/           # Kanban board components (to be built)
├── gantt/            # Gantt chart components (to be built)
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

| Rule   | Description                                                         |
| ------ | ------------------------------------------------------------------- |
| BR-01  | All queries scoped by `companyId`                                   |
| BR-05  | Plan limits checked server-side before INSERT                       |
| BR-10  | Sum of Phase.montantHT cannot exceed Project.montantHT (hard block) |
| BR-11  | Phase.startDate must be >= Project.ods (hard block)                 |
| BR-12  | SubPhase dates must be within parent Phase range (hard block)       |
| SEC-02 | Role checks enforced at Server Action level, not just UI            |

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

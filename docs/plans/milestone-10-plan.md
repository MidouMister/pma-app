# Milestone 10 — Activity Logs, User Dashboard & Polish

> **Milestone:** 10
> **Status:** `[ ] NOT STARTED`
> **Depends on:** Milestones 1–9 (all features exist)
> **PRD Sections:** §10.13, §10.14, §10.3, §11, §12, §13, §15.7, §16.2
> **Estimated Sub-tasks:** 52

---

## Overview

Milestone 10 is the final milestone — it delivers:

1. **Activity Logs** — Audit trail for all key actions, role-scoped visibility, filterable
2. **User Personal Dashboard** — USER workspace with assigned tasks, projects, time entries, analytics, profile
3. **Subscription Lifecycle** — Trial warnings, grace period banner, read-only mode, upgrade request
4. **Landing Page** — Public marketing page with features, plans, and CTA
5. **UI Polish & Quality** — Loading states, error boundaries, empty states, responsive review, accessibility, performance
6. **Security Audit** — Final tenant isolation and RBAC verification

---

## Pre-Requisites Check

### Schema Models (✅ Already Exist)

| Model         | Status | Notes                                              |
| ------------- | ------ | -------------------------------------------------- |
| `ActivityLog` | ✅     | `companyId`, `unitId`, `userId`, `action`, `entityType`, `entityId`, `metadata (Json?)` |
| `User`        | ✅     | Has `avatarUrl String?` and `jobTitle String?`     |

### Server Actions (🆕 To Create)

| File                       | Status |
| -------------------------- | ------ |
| `actions/activity-log.ts`  | 🆕     |
| `actions/user-profile.ts`  | 🆕     |

---

## Phase 1 — Activity Logs

### Task 1.1 — Create `actions/activity-log.ts` Server Actions

**File:** `actions/activity-log.ts` (NEW)

```
createActivityLog(data)
  - Internal helper used by all other server actions on create/edit/delete (ACT-01)
  - Params: companyId, unitId, userId, action (string), entityType (string), entityId (string), metadata? (JSON)
  - Action values: "CREATE", "UPDATE", "DELETE", "ARCHIVE", "COMPLETE", "ASSIGN", "INVITE", "REMOVE"
  - EntityType values: "PROJECT", "PHASE", "SUBPHASE", "TASK", "CLIENT", "MEMBER", "LANE", "TAG", "PRODUCTION", "TIME_ENTRY"
  - Never cached — unstable_noStore() (CACHE-04)

getActivityLogs(filters)
  - Scoped by role (ACT-03 to ACT-05):
    → OWNER: all logs company-wide (ACT-03)
    → ADMIN: logs for their unit only (ACT-04)
    → USER: logs for assigned projects only (ACT-05)
  - Filters: date range, entityType, userId (ACT-06)
  - Pagination (take/skip)
  - Never cached — unstable_noStore() (CACHE-04)
  - Ordered by createdAt DESC
```

**Business Rules:**
- Every query scoped by `companyId` (BR-01)
- Role-scoped visibility enforced server-side (SEC-02)
- Activity logs must never be cached (CACHE-04)

---

### Task 1.2 — Integrate Activity Log Creation into Existing Server Actions

Add `createActivityLog()` calls at the end of every mutation in these server action files:

| File                    | Actions to Log                                           | EntityType  |
| ----------------------- | -------------------------------------------------------- | ----------- |
| `actions/project.ts`    | createProject, updateProject, archiveProject             | `PROJECT`   |
| `actions/phase.ts`      | createPhase, updatePhase, deletePhase                    | `PHASE`     |
| `actions/subphase.ts`   | createSubPhase, updateSubPhase, deleteSubPhase           | `SUBPHASE`  |
| `actions/task.ts`       | createTask, updateTask, deleteTask, completeTask, moveTask | `TASK`     |
| `actions/client.ts`     | createClient, updateClient, deleteClient                 | `CLIENT`    |
| `actions/team.ts`       | addTeamMember, removeTeamMember                          | `MEMBER`    |
| `actions/lane.ts`       | createLane, updateLane, deleteLane                       | `LANE`      |
| `actions/tag.ts`        | createTag, deleteTag                                     | `TAG`       |
| `actions/production.ts` | createProduct, createProduction, updateProduction         | `PRODUCTION`|
| `actions/time-entry.ts` | createTimeEntry, updateTimeEntry, deleteTimeEntry        | `TIME_ENTRY`|
| `actions/invitation.ts` | sendInvitation, revokeInvitation                         | `MEMBER`    |

**Metadata format (JSON):**
```json
{
  "entityName": "Phase Alpha",
  "changes": { "status": { "from": "New", "to": "InProgress" } },
  "triggeredBy": "admin@company.com"
}
```

---

### Task 1.3 — Build Activity Log Display Components

#### 1.3.1 — Activity Log List Component

**File:** `components/shared/activity-log-list.tsx` (NEW)

Reusable component for displaying activity logs:
- Timeline-style list (vertical line + dots)
- Each entry: icon (by entityType), action description, user avatar + name, relative timestamp
- Color-coded action types (create=green, update=blue, delete=red)
- Action description in French: `"[User] a créé le projet [Name]"`, `"[User] a supprimé la tâche [Title]"`

#### 1.3.2 — Activity Log Filter Bar

**File:** `components/shared/activity-log-filters.tsx` (NEW)

Filter bar for activity logs (ACT-06):
- Date range picker (from/to)
- Entity type dropdown (Projet, Phase, Tâche, Client, Membre, etc.)
- User dropdown (team members)
- "Effacer les filtres" button

---

### Task 1.4 — Add Activity Feed to Company Dashboard

**File to modify:** `app/(dashboard)/company/[companyId]/page.tsx`

- Add "Activité récente" section
- Show latest 10 activity logs (company-wide for OWNER)
- "Voir tout" link (future: dedicated activity page)

---

### Task 1.5 — Add Activity Feed to Unit Dashboard

**File to modify:** `app/(dashboard)/unite/[unitId]/page.tsx`

- Add "Activité récente" section
- Show latest 10 activity logs (unit-scoped for ADMIN)

---

## Phase 2 — User Personal Dashboard

### Task 2.1 — Create User Dashboard Landing Page

**File:** `app/(dashboard)/user/[userId]/page.tsx` (MODIFY — currently redirect)

User personal dashboard (PRD §10.14):

**Layout — 4 sections:**

1. **Greeting + Summary Cards**
   - Welcome message with user name
   - Cards: Tasks assigned (count), Tasks completed today, Active projects, Hours logged this week

2. **Today's Tasks**
   - Simplified list of tasks assigned to this user due today or overdue
   - Each item: title, project name, due date, status indicator
   - Quick complete toggle
   - Empty state: "Aucune tâche pour aujourd'hui"

3. **Active Projects**
   - List of projects where user is TeamMember
   - Each: project name, status badge, progress bar, role label
   - Link to project detail

4. **Recent Notifications**
   - Latest 5 unread notifications (reuses `notification-list.tsx`)
   - "Voir tout" link

---

### Task 2.2 — Create User Tasks Page

**File:** `app/(dashboard)/user/[userId]/tasks/page.tsx` (NEW)

All tasks assigned to this user, filterable:
- Filter: project, status (complete/incomplete), due date range
- List/table view with: title, project, phase, due date, lane, status
- Click → TaskDetailModal
- Empty state: "Aucune tâche assignée"

**Data fetching:** `getUserTasks(userId)` from queries.ts with `cacheLife("seconds")`, `userTasksTag(userId)`

---

### Task 2.3 — Create User Projects Page

**File:** `app/(dashboard)/user/[userId]/projects/page.tsx` (NEW)

Projects where user is TeamMember:
- Table/cards: project name, status, progress, client, role in team
- Link each to project detail
- Empty state: "Aucun projet assigné"

**Data fetching:** `getUserProjects(userId)` from queries.ts with `cacheLife("hours")`, `userProjectsTag(userId)`

---

### Task 2.4 — Create User Analytics Page

**File:** `app/(dashboard)/user/[userId]/analytics/page.tsx` (NEW)

Performance metrics:
- **Hours/week chart** (Recharts bar chart — last 4 weeks)
- **Tasks completed vs pending** (pie or donut chart)
- **Summary cards:** Total hours logged, Tasks completed (all time), Average hours/week
- **Recent time entries** list

**Access:** USER (own) + OWNER + ADMIN

**Data fetching:** `getUserAnalytics(userId)` from queries.ts with `cacheLife("minutes")`, `userAnalyticsTag(userId)`

---

### Task 2.5 — Create User Profile Page

**File:** `app/(dashboard)/user/[userId]/profile/page.tsx` (NEW)

Edit personal info:
- Name (editable)
- Job title (editable)
- Avatar (Uploadthing upload)
- Email (read-only — managed by Clerk)
- Role (read-only)
- Notification preferences (future — placeholder toggles)

**Server action:** `actions/user-profile.ts` → `updateUserProfile(data)`
- Only USER can edit their own profile
- Revalidate: `userTag(userId)`

---

### Task 2.6 — Create Loading Skeletons for User Pages

**Files (NEW):**
- `app/(dashboard)/user/[userId]/loading.tsx`
- `app/(dashboard)/user/[userId]/tasks/loading.tsx`
- `app/(dashboard)/user/[userId]/projects/loading.tsx`
- `app/(dashboard)/user/[userId]/analytics/loading.tsx`

---

### Task 2.7 — Add User Data Queries to `lib/queries.ts`

Add the following functions:

```typescript
getUserTasks(userId: string)
  // 'use cache' + cacheTag(userTasksTag(userId)) + cacheLife('seconds')
  // All tasks where assignedUserId = userId, include project, phase, lane

getUserProjects(userId: string)
  // 'use cache' + cacheTag(userProjectsTag(userId)) + cacheLife('hours')
  // All projects via TeamMember join, include client, phases, status

getUserAnalytics(userId: string)
  // 'use cache' + cacheTag(userAnalyticsTag(userId)) + cacheLife('minutes')
  // Aggregate: hours/week, tasks completed count, tasks pending count
```

---

## Phase 3 — Subscription Lifecycle

### Task 3.1 — Trial Countdown Notifications

**Implementation approach:** Check on dashboard page load (server-side).

**Logic in dashboard layout or utility:**
```
const subscription = await getSubscription(companyId)
const daysRemaining = differenceInDays(subscription.endAt, new Date())

if (subscription.status === 'TRIAL') {
  if (daysRemaining === 30) → create GENERAL notification if not already sent
  if (daysRemaining === 7)  → create GENERAL notification if not already sent
  if (daysRemaining === 3)  → create GENERAL notification if not already sent
}
```

**Dedup:** Check if a notification with matching message already exists for this OWNER to avoid duplicates on repeat page loads.

---

### Task 3.2 — Grace Period Upgrade Banner

**File:** `components/global/subscription-banner.tsx` (NEW)

Persistent banner shown after trial ends (day 60–67):
- Yellow/amber banner at top of layout
- Message: `"Votre période d'essai est terminée. Vous disposez de 7 jours pour mettre à niveau."`
- "Mettre à niveau" CTA button → billing page
- Countdown: `"X jours restants"`
- Only shown to OWNER
- Dismissible per session (but reappears on next login)

**Integration:** Add to `app/(dashboard)/layout.tsx`, conditionally rendered.

---

### Task 3.3 — Read-Only Mode (Day 67+)

**File:** `components/global/read-only-guard.tsx` (NEW)

**CRITICAL (SUB-03, BR-08):**

After grace period (day 67+), subscription status = `READONLY`:
- All create/update/delete Server Actions must check subscription status
- Block mutations with user-facing error in French
- Redirect to billing page

**Implementation:**

1. Create `lib/subscription.ts` utility: `checkSubscriptionStatus(companyId)` → returns current status
2. Add check at the top of every mutation Server Action:
   ```typescript
   const subStatus = await checkSubscriptionStatus(user.companyId)
   if (subStatus === 'READONLY' || subStatus === 'SUSPENDED') {
     throw new Error('Votre abonnement est expiré. Veuillez mettre à niveau.')
   }
   ```
3. Client-side: `read-only-guard.tsx` wraps form submit buttons with disabled state + tooltip

**Files to modify:** ALL server actions in `actions/` directory (add subscription check after auth)

---

### Task 3.4 — Upgrade Request Form

**File to modify:** `app/(dashboard)/company/[companyId]/settings/billing/page.tsx`

Enhance existing billing page with:
- Upgrade request form (SUB-04):
  - Plan selection: Pro / Premium (radio buttons with feature comparison)
  - Payment method: Virement Bancaire / Chèque / Contrat de Prestation
  - Contact name, phone, email
  - Optional notes
- Submit creates a support request (stored in DB or sent via email — v1: just store in a simple table or ActivityLog)
- Success confirmation message

---

### Task 3.5 — Prevent Starter Downgrade

**CRITICAL (BR-09):** Once upgraded to Pro or Premium, downgrade to Starter is not permitted.

- In any subscription update logic, validate: if current plan is Pro/Premium, new plan cannot be Starter
- Show error: `"Impossible de revenir au plan Starter après une mise à niveau."`

---

## Phase 4 — Landing Page

### Task 4.1 — Build Public Landing Page

**File:** `app/site/page.tsx` (MODIFY — currently placeholder)

Marketing landing page at `/` (rewritten from `/site`):

**Sections:**

1. **Hero**
   - Headline: "Gérez vos projets de construction avec précision"
   - Subheading: key value props
   - CTA: "Commencer gratuitement" → `/company/sign-up`
   - Hero image/illustration (generate with generate_image tool)

2. **Features Grid** (6 cards)
   - Gantt planning
   - Kanban tasks
   - Production monitoring
   - Time tracking
   - Client CRM
   - Team management

3. **Plan Comparison Table**

   | Feature              | Starter (Gratuit) | Pro              | Premium            |
   | -------------------- | ----------------- | ---------------- | ------------------ |
   | Durée                | 2 mois gratuit    | Annuel           | Annuel             |
   | Unités max           | 1                 | 5                | Illimité           |
   | Projets max          | 3                 | 30               | Illimité           |
   | Tâches/projet max    | 20                | 200              | Illimité           |
   | Membres max          | 10                | 50               | Illimité           |
   | Support              | —                 | Email            | Dédié              |

4. **CTA Section**
   - "Prêt à commencer?" + sign-up button

**Design:**
- Dark mode by default (NFR-18)
- Modern, premium feel — gradients, glassmorphism cards
- Responsive down to 768px (NFR-17)
- Proper SEO: title, meta description, OG tags, heading hierarchy

---

## Phase 5 — UI Polish & Quality

### Task 5.1 — Loading States (Skeleton Components)

Add `loading.tsx` files to ALL pages that don't have them yet:

| Route                                    | File                                         |
| ---------------------------------------- | -------------------------------------------- |
| `/company/[companyId]/units`             | `loading.tsx`                                |
| `/company/[companyId]/users`             | `loading.tsx`                                |
| `/company/[companyId]/settings`          | `loading.tsx`                                |
| `/company/[companyId]/settings/billing`  | `loading.tsx`                                |
| `/unite/[unitId]/clients`               | `loading.tsx`                                |
| `/unite/[unitId]/clients/[clientId]`    | `loading.tsx`                                |
| `/unite/[unitId]/projects`              | `loading.tsx`                                |
| `/unite/[unitId]/projects/[projectId]`  | `loading.tsx`                                |
| `/unite/[unitId]/members`              | `loading.tsx`                                |
| `/unite/[unitId]/settings`             | `loading.tsx`                                |
| `/unite/[unitId]/productions`          | `loading.tsx`                                |
| `/dashboard/notifications`             | `loading.tsx`                                |

Use `<Skeleton />` from shadcn/ui, matching the layout of each page.

---

### Task 5.2 — Error Boundaries

**File:** `app/(dashboard)/error.tsx` (NEW)

Global error boundary for dashboard routes:
- User-friendly error message in French
- "Réessayer" button
- Link to return to dashboard
- Log error details to console (not to user)

**File:** `app/(dashboard)/not-found.tsx` (NEW)

Custom 404 page:
- "Page introuvable" message
- Link to dashboard

---

### Task 5.3 — Empty States

Review ALL list/table pages and ensure they use `<EmptyState>` component:

| Page                | Empty State Message                                | CTA                  |
| ------------------- | -------------------------------------------------- | -------------------- |
| Projects list       | "Aucun projet pour le moment"                      | "Créer un projet"    |
| Clients list        | "Aucun client enregistré"                          | "Ajouter un client"  |
| Tasks/Kanban        | "Aucune tâche dans cette vue"                      | "Créer une tâche"    |
| Members list        | "Aucun membre dans cette unité"                    | "Inviter un membre"  |
| Time entries        | "Aucune entrée de temps enregistrée"               | "Démarrer le timer"  |
| Production          | "Aucune donnée de production"                      | "Créer un objectif"  |
| Activity logs       | "Aucune activité récente"                          | —                    |
| Notifications       | "Aucune notification"                              | —                    |
| User tasks          | "Aucune tâche assignée"                            | —                    |
| User projects       | "Aucun projet assigné"                             | —                    |

---

### Task 5.4 — Responsive Design Review

Test ALL pages at these widths and fix layout issues:

| Width     | Target   |
| --------- | -------- |
| 1440px    | Desktop  |
| 1024px    | Tablet   |
| 768px     | Min (NFR-17) |

**Focus areas:**
- Sidebar collapse behavior
- Data tables: horizontal scroll on narrow viewports
- Form modals: proper sizing
- Kanban: horizontal scroll with lane wrapping
- Gantt: ensure zoom controls work at all widths
- Cards: stack properly on narrow viewports

---

### Task 5.5 — Accessibility Audit

- [ ] All interactive elements have keyboard navigation support
- [ ] All form inputs have associated labels
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] All modals trap focus correctly
- [ ] Screen reader: ARIA labels on icon-only buttons
- [ ] Skip navigation link (optional for v1)

---

### Task 5.6 — Performance Checks

| Metric                           | Target      | How to Verify              |
| -------------------------------- | ----------- | -------------------------- |
| LCP                              | < 2.5s      | Lighthouse (NFR-01)        |
| Server Actions response          | < 500ms     | Network tab (NFR-02)       |
| Gantt with 50 phases             | No lag      | Seed test data (NFR-03)    |
| Kanban with 200 tasks, 10 lanes  | No lag      | Seed test data (NFR-04)    |

---

## Phase 6 — Security Audit

### Task 6.1 — Tenant Isolation Verification

**Action:** Grep ALL Prisma queries across all server actions and pages:

```bash
grep -r "prisma\." --include="*.ts" --include="*.tsx" actions/ app/ lib/
```

**Check:** Every `findMany`, `findFirst`, `findUnique`, `create`, `update`, `delete` includes `where: { companyId: ... }` (SEC-01, BR-01).

---

### Task 6.2 — RBAC Server-Side Verification

**Check:** Every Server Action in `actions/` has:
1. `await auth()` check at the top
2. Role verification via `requireRole()` or manual check
3. No mutation relies solely on UI-level role hiding (SEC-02)

---

### Task 6.3 — File Upload Validation

**Check:** Uploadthing configuration in `app/api/uploadthing/core.ts`:
- [ ] File type restrictions (PDF, images only for documents)
- [ ] File size limits set appropriately (SEC-03)
- [ ] Auth check in middleware

---

### Task 6.4 — Financial Data Access

**Check:** USERs cannot access financial data for non-assigned projects (SEC-04):
- [ ] Project montantHT/TTC hidden from USER in non-assigned projects
- [ ] Phase montantHT hidden from USER in non-assigned projects
- [ ] Production data hidden from USER in non-assigned projects

---

## Verification Plan

### Automated Checks

```bash
pnpm typecheck    # Zero errors
pnpm lint         # Zero errors
pnpm build        # All pages compile
pnpm format       # All files formatted
```

### Browser Testing

- [ ] Activity logs appear on Company/Unit dashboards
- [ ] Activity logs filter by date range, entityType, user
- [ ] OWNER sees all logs; ADMIN sees unit; USER sees assigned projects only
- [ ] User dashboard shows correct assigned tasks, projects, analytics
- [ ] User profile edit works (name, job title, avatar)
- [ ] Trial countdown notifications fire at correct intervals
- [ ] Grace period banner appears after trial ends
- [ ] Read-only mode blocks all mutations after day 67
- [ ] Upgrade request form submits correctly
- [ ] Landing page renders with all sections, responsive
- [ ] All pages have loading skeletons
- [ ] All empty states display correctly
- [ ] Error boundary catches and displays errors gracefully

---

## File Inventory

### New Files (25+)

| File                                                           | Type             |
| -------------------------------------------------------------- | ---------------- |
| `actions/activity-log.ts`                                      | Server Actions   |
| `actions/user-profile.ts`                                      | Server Actions   |
| `components/shared/activity-log-list.tsx`                      | Component        |
| `components/shared/activity-log-filters.tsx`                   | Client Component |
| `components/global/subscription-banner.tsx`                    | Client Component |
| `components/global/read-only-guard.tsx`                        | Client Component |
| `app/(dashboard)/user/[userId]/page.tsx`                       | Page (modify)    |
| `app/(dashboard)/user/[userId]/tasks/page.tsx`                 | Page (new)       |
| `app/(dashboard)/user/[userId]/projects/page.tsx`              | Page (new)       |
| `app/(dashboard)/user/[userId]/analytics/page.tsx`             | Page (new)       |
| `app/(dashboard)/user/[userId]/profile/page.tsx`               | Page (new)       |
| `app/(dashboard)/user/[userId]/loading.tsx`                    | Loading (new)    |
| `app/(dashboard)/user/[userId]/tasks/loading.tsx`              | Loading (new)    |
| `app/(dashboard)/user/[userId]/projects/loading.tsx`           | Loading (new)    |
| `app/(dashboard)/user/[userId]/analytics/loading.tsx`          | Loading (new)    |
| `app/(dashboard)/error.tsx`                                    | Error Boundary   |
| `app/(dashboard)/not-found.tsx`                                | 404 Page         |
| 12+ `loading.tsx` files for existing pages                     | Loading          |

### Modified Files (15+)

| File                                                                    | Changes                                       |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| `app/(dashboard)/company/[companyId]/page.tsx`                          | Add activity feed section                     |
| `app/(dashboard)/unite/[unitId]/page.tsx`                               | Add activity feed section                     |
| `app/(dashboard)/company/[companyId]/settings/billing/page.tsx`         | Add upgrade form, prevent downgrade           |
| `app/(dashboard)/layout.tsx`                                            | Add subscription banner, trial check          |
| `app/site/page.tsx`                                                     | Build landing page                            |
| `lib/queries.ts`                                                        | Add user queries, activity log queries        |
| `lib/types.ts`                                                          | Add activity log interfaces                   |
| `lib/subscription.ts`                                                   | Add subscription status check helper          |
| ALL `actions/*.ts` files                                                | Add createActivityLog() + subscription check  |

---

## Execution Order

```
Phase 1 — Activity Logs
  1. actions/activity-log.ts (helper + queries)
  2. Integrate createActivityLog into all existing server actions
  3. components/shared/activity-log-list.tsx + filters
  4. Add activity feed to Company Dashboard
  5. Add activity feed to Unit Dashboard

Phase 2 — User Dashboard
  6. lib/queries.ts — getUserTasks, getUserProjects, getUserAnalytics
  7. app/user/[userId]/page.tsx — landing dashboard
  8. app/user/[userId]/tasks/page.tsx
  9. app/user/[userId]/projects/page.tsx
  10. app/user/[userId]/analytics/page.tsx
  11. app/user/[userId]/profile/page.tsx + actions/user-profile.ts
  12. Loading skeletons for all user pages

Phase 3 — Subscription Lifecycle
  13. Trial countdown notification logic
  14. components/global/subscription-banner.tsx (grace period)
  15. components/global/read-only-guard.tsx (read-only mode)
  16. Add subscription status check to ALL server actions
  17. Upgrade request form on billing page
  18. Prevent Starter downgrade (BR-09)

Phase 4 — Landing Page
  19. app/site/page.tsx — full marketing page design + build

Phase 5 — UI Polish
  20. Loading skeletons for ALL remaining pages
  21. Error boundaries (error.tsx, not-found.tsx)
  22. Empty states review across all pages
  23. Responsive design review at 768px, 1024px, 1440px
  24. Accessibility audit

Phase 6 — Security & Performance
  25. Tenant isolation grep audit
  26. RBAC server-side verification
  27. File upload validation check
  28. Financial data access check
  29. Performance checks (LCP, Gantt 50, Kanban 200)

Phase 7 — Final Verification
  30. pnpm typecheck + lint + build + format
  31. Full browser test of all features
```

---

_End of Milestone 10 Plan_

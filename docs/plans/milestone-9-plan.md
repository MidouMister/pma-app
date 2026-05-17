# Milestone 9 — Production, Time Tracking & Notifications

> **Milestone:** 9
> **Status:** `[ ] NOT STARTED`
> **Depends on:** Milestone 6 (phases exist), Milestone 8 (tasks exist for time tracking)
> **PRD Sections:** §10.9, §10.11, §10.12, §13 (BR-14, BR-15, BR-23)
> **Estimated Sub-tasks:** 48

---

## Overview

Milestone 9 delivers three major subsystems:

1. **Production Module** — Planned vs. actual production monitoring per phase, with charts and alert notifications
2. **Time Tracking** — Manual and timer-based time entry logging per task/project, with project-level reporting
3. **Notification System** — Full in-app notification infrastructure: creation helper, bell UI with polling, full notifications page, and integration into all existing server actions

---

## Pre-Requisites Check

### Schema Models (✅ Already Exist)

| Model          | Status | Notes                                                        |
| -------------- | ------ | ------------------------------------------------------------ |
| `Product`      | ✅     | `phaseId @unique`, `taux`, `montantProd`, `date`             |
| `Production`   | ✅     | `productId`, `phaseId`, `taux`, `mntProd`, `date`            |
| `TimeEntry`    | ✅     | `userId`, `projectId`, `taskId?`, `startTime`, `endTime`, `duration` |
| `Notification` | ✅     | `userId`, `companyId`, `unitId?`, `type`, `message`, `read`, `targetRole`, `targetUserId` |
| `ActivityLog`  | ✅     | Used in M10 but model already exists                         |

### Server Actions (🆕 To Create)

| File                    | Status |
| ----------------------- | ------ |
| `actions/production.ts` | 🆕     |
| `actions/time-entry.ts` | 🆕     |
| `actions/notification.ts` | 🆕   |

### Dependencies to Install

| Package    | Purpose                          | Command                |
| ---------- | -------------------------------- | ---------------------- |
| `recharts` | Line/bar charts for production   | `pnpm add recharts`   |

---

## Phase 1 — Notification Infrastructure (Foundation)

> **Why first?** Both Production and Time Tracking need to create notifications. Build the notification layer first so M9.1 and M9.2 can use it immediately.

### Task 1.1 — Create `actions/notification.ts` Server Actions

**File:** `actions/notification.ts` (NEW)

Create the core notification helper and CRUD actions:

```
createNotification(data)
  - Internal helper used by all other server actions
  - Params: companyId, unitId, userId, type (NotificationType), message, targetRole?, targetUserId?
  - Fan-out logic (BR-23):
    → targetRole: OWNER → find single OWNER of company, create one Notification
    → targetRole: ADMIN → find all ADMINs in the relevant unit, create one Notification per ADMIN
    → targetUserId set → create one Notification for that specific user
  - Never cached (unstable_noStore)

getUnreadCount(userId)
  - Returns count of unread notifications for user
  - Must use unstable_noStore() — always fresh (NOTIF-08, NOTIF-10, CACHE-04)

getNotifications(userId, filters?)
  - List with optional filters: type (NotificationType), read (boolean)
  - Ordered by createdAt DESC
  - Must use unstable_noStore() — always fresh (CACHE-04)
  - Pagination support (take/skip)

getLatestUnread(userId, limit = 5)
  - Returns latest N unread notifications for bell dropdown (NOTIF-03)
  - Must use unstable_noStore()

markAsRead(notificationId, userId)
  - Set read = true for single notification (NOTIF-04)
  - Verify ownership: notification.userId === current user

markAllAsRead(userId)
  - Set read = true for all unread notifications of user (NOTIF-05)
```

**Business Rules:**
- `NOTIF-06`: `targetRole: OWNER` → delivers to single OWNER only
- `NOTIF-07`: USER receives PROJECT notifications only for assigned projects
- `NOTIF-12`: ADMIN notifications fan out to all ADMIN users within the relevant unit
- `BR-23`: Fan-out rules for role-targeted notifications

**RBAC:**
- All users can read/mark their own notifications
- `createNotification` is internal — called only by other server actions

---

### Task 1.2 — Create `hooks/use-notifications.ts` Polling Hook

**File:** `hooks/use-notifications.ts` (NEW)

```typescript
// Client Component hook
// Polls getUnreadCount() every 30 seconds via setInterval + Server Action call
// Returns: { unreadCount: number, isLoading: boolean }
// NOTIF-08, NOTIF-09, NOTIF-10
```

**Key Rules:**
- Poll only the COUNT — not the full list (NOTIF-10)
- Use `setInterval` + Server Action — NOT `useEffect` with fetch to API (NOTIF-09)
- Clean up interval on unmount

---

### Task 1.3 — Create `components/notifications/notification-bell.tsx`

**File:** `components/notifications/notification-bell.tsx` (NEW)

Client Component that:
- Shows bell icon with unread count badge (NOTIF-02, NOTIF-08)
- Uses `useNotifications()` hook for polling
- Bell click opens dropdown with latest 5 unread (NOTIF-03)
- Each item shows: type icon, message, relative timestamp
- "Voir tout" link → `/notifications` page
- "Tout marquer comme lu" quick action

**Integration point:** Add to `app-sidebar.tsx` or header bar.

---

### Task 1.4 — Create `/notifications` Full Page

**File:** `app/(dashboard)/dashboard/notifications/page.tsx` (NEW)

Full notification list page (NOTIF-04):
- Filter tabs: Tous / Non lus / Par type (INVITATION, PROJECT, TASK, etc.)
- "Tout marquer comme lu" button (NOTIF-05)
- Paginated list with type icon, message, timestamp, read/unread indicator
- Mark individual as read on click
- Empty state when no notifications

---

### Task 1.5 — Integrate Notification Bell into Layout

**Files to modify:**
- `components/sidebar/app-sidebar.tsx` or header — add `<NotificationBell />` component
- `lib/nav.ts` — ensure "Notifications" nav item links to `/notifications`

---

## Phase 2 — Production Module

### Task 2.1 — Install Recharts

```bash
pnpm add recharts
```

---

### Task 2.2 — Create `actions/production.ts` Server Actions

**File:** `actions/production.ts` (NEW)

```
createProduct(data)
  - Fields: phaseId, taux (planned), montantProd (auto: Phase.montantHT × taux / 100), date
  - CRITICAL: One Product per Phase max (PROD-01, PROD-02) — check Phase.Product === null
  - RBAC: ADMIN/OWNER only
  - Scoped by companyId (BR-01)
  - Revalidate: phaseProductionTag(phaseId), unitProductionsTag(unitId)

updateProduct(productId, data)
  - Same validation as create
  - Recalculate montantProd on taux change
  - RBAC: ADMIN/OWNER only

deleteProduct(productId)
  - Cascade deletes all Production entries
  - RBAC: ADMIN/OWNER only

createProduction(data)
  - Fields: productId, phaseId, taux (actual), date
  - Auto-calculate: mntProd = Phase.montantHT × (taux / 100) (PROD-03, PROD-04, BR-13)
  - CRITICAL: If actual taux < (Product.taux × Company.productionAlertThreshold / 100)
    → Create PRODUCTION notification to OWNER (PROD-07, BR-14)
  - RBAC: ADMIN/OWNER only
  - Revalidate: phaseProductionTag(phaseId), unitProductionsTag(unitId)

updateProduction(productionId, data)
  - Same alert check as create
  - RBAC: ADMIN/OWNER only

deleteProduction(productionId)
  - RBAC: ADMIN/OWNER only

getPhaseProduction(phaseId)
  - Returns Product + all Production entries for a phase
  - Cache: cacheLife("minutes"), phaseProductionTag(phaseId)

getUnitProductions(unitId)
  - Returns all productions across all phases in unit
  - Cache: cacheLife("minutes"), unitProductionsTag(unitId)
```

**Business Rules:**
- `BR-13`: `Production.mntProd = Phase.montantHT × (taux / 100)` — system-calculated only
- `BR-14`: Alert threshold check on every production save
- `BR-15`: `productionAlertThreshold` default 80, range 1–100
- `PROD-01`: Each Phase has at most one Product
- `PROD-04`: `mntProd` auto-calculated, never editable

---

### Task 2.3 — Create Production Tab Components

#### 2.3.1 — Product Form Component

**File:** `components/project/production/product-form.tsx` (NEW)

FormModal-based dialog for creating/editing the planned Product:
- Fields: planned taux (0–100), date
- montantProd auto-calculated and displayed (read-only)
- Show Phase.montantHT as reference
- Uses `<FormModal>` per convention (§6.6)

#### 2.3.2 — Production Entry Form Component

**File:** `components/project/production/production-entry-form.tsx` (NEW)

FormModal for recording actual Production:
- Fields: actual taux (0–100), date
- mntProd auto-calculated preview (read-only)
- Show warning if taux < threshold

#### 2.3.3 — Production Charts Component

**File:** `components/project/production/production-charts.tsx` (NEW)

Two Recharts visualizations (PROD-05):

1. **Line Chart — Planned vs Actual Rate**
   - X-axis: date
   - Y-axis: taux (%)
   - Two lines: planned (dashed) vs actual (solid)
   - Color: planned = blue, actual = emerald (or red when below threshold)

2. **Grouped Bar Chart — Planned vs Actual Amount**
   - X-axis: date
   - Y-axis: montantProd (DA)
   - Grouped bars: planned vs actual per date entry
   - Format amounts with `formatCurrency()`

#### 2.3.4 — Production Data Table Component

**File:** `components/project/production/production-table.tsx` (NEW)

Data table (PROD-06):
- Columns: Date, Taux planifié (%), Taux réel (%), Écart (%), Écart montant (DA)
- Red row styling when actual < planned
- Sortable by date
- Uses `<DataTable>` from shared components or direct shadcn Table

#### 2.3.5 — Production Tab Wrapper

**File:** `components/project/production/production-tab.tsx` (NEW)

Combines all production components into the Project Detail "Production" tab:
- If no Product exists → show "Create planned baseline" CTA
- If Product exists → show charts + data table + "Add entry" button
- Production entry list with edit/delete actions

---

### Task 2.4 — Wire Production Tab to Project Detail Page

**File to modify:** `app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx`

- Import `ProductionTab` component
- Pass `projectId` and `phases` data
- Add data fetching for production data

---

### Task 2.5 — Build Unit-Wide Production Page

**File:** `app/(dashboard)/unite/[unitId]/productions/page.tsx` (MODIFY — currently placeholder)

- Overview of all phases across all projects in unit with production data
- Summary cards: total planned vs actual, underperforming phases count
- Table: Phase name → Project name → planned taux → actual taux → variance
- Red highlighting for underperforming phases
- Filter by project, status

---

## Phase 3 — Time Tracking

### Task 3.1 — Create `actions/time-entry.ts` Server Actions

**File:** `actions/time-entry.ts` (NEW)

```
createTimeEntry(data)
  - Fields: projectId, taskId? (nullable), description, startTime, endTime
  - Auto-calculate: duration = (endTime - startTime) in minutes (TIME-03)
  - CRITICAL: USERs can only log time on projects where they are TeamMember (TIME-07)
  - RBAC: All authenticated users (on their assigned projects)
  - Scoped by companyId (BR-01)
  - Revalidate: projectTimeTag(projectId), userAnalyticsTag(userId)

startTimer(data)
  - Fields: projectId, taskId?, description
  - Creates TimeEntry with startTime = now(), endTime = null (TIME-04)
  - CRITICAL: Only one active timer per user at a time
  - Revalidate: projectTimeTag(projectId)

stopTimer(timeEntryId)
  - Set endTime = now(), calculate duration in minutes (TIME-04)
  - CRITICAL: Only entry owner can stop their timer
  - Revalidate: projectTimeTag(projectId), userAnalyticsTag(userId)

updateTimeEntry(timeEntryId, data)
  - Users edit own entries; ADMIN/OWNER edit any within scope (TIME-06)
  - Recalculate duration on time change
  - Revalidate: projectTimeTag(projectId), userAnalyticsTag(userId)

deleteTimeEntry(timeEntryId)
  - Same permission model as update (TIME-06)
  - Revalidate: projectTimeTag(projectId), userAnalyticsTag(userId)

getProjectTimeEntries(projectId)
  - Grouped by user, total per user per week, grand total (TIME-08)
  - Cache: cacheLife("minutes"), projectTimeTag(projectId)

getTaskTimeEntries(taskId)
  - All time entries for a specific task (TIME-09)
  - Cache: cacheLife("minutes"), projectTimeTag(projectId)

getUserTimeEntries(userId)
  - All time entries by user, grouped by week
  - Cache: cacheLife("minutes"), userAnalyticsTag(userId)
```

**Business Rules:**
- `TIME-07`: USERs can only log on assigned projects (check TeamMember)
- `TIME-06`: Users edit/delete own; OWNER/ADMIN edit/delete any in scope

---

### Task 3.2 — Create `hooks/use-timer.ts` Timer Hook

**File:** `hooks/use-timer.ts` (NEW)

Client-side hook for live timer display:

```typescript
interface UseTimerReturn {
  isRunning: boolean
  elapsed: number         // seconds
  formattedTime: string   // "01:23:45"
  start: () => void
  stop: () => void
}
```

- Uses `setInterval` (1 second) to update elapsed time
- `start()` calls `startTimer()` server action
- `stop()` calls `stopTimer()` server action
- Persists active timer ID in state
- Cleans up on unmount

---

### Task 3.3 — Create Time Tracking UI Components

#### 3.3.1 — Timer Widget

**File:** `components/project/time-tracking/timer-widget.tsx` (NEW)

Live timer component (TIME-04):
- Start/stop button with play/pause icon
- Elapsed time display (HH:MM:SS)
- Project selector (dropdown)
- Task selector (optional, filtered by project)
- Description input
- "Start" creates TimeEntry with endTime=null
- "Stop" sets endTime=now and calculates duration

#### 3.3.2 — Manual Time Entry Form

**File:** `components/project/time-tracking/time-entry-form.tsx` (NEW)

FormModal for manual entry (TIME-05):
- Fields: project (select), task (optional select), description, startTime (datetime), endTime (datetime)
- Duration auto-calculated and displayed
- Validation: endTime > startTime

#### 3.3.3 — Time Tracking Tab

**File:** `components/project/time-tracking/time-tracking-tab.tsx` (NEW)

Project detail "Time Tracking" tab content (TIME-08):
- Timer widget at top
- "Ajouter manuellement" button
- Entries grouped by user
  - Each user section: avatar, name, entries list
  - Total duration per user per week
- Grand total at bottom
- Each entry: description, startTime–endTime, duration, edit/delete actions
- Empty state when no entries

#### 3.3.4 — Task Time Entries Component (Already Exists — Enhance)

**File:** `components/kanban/task-time-entries.tsx` (MODIFY)

- Currently displays time entries in task detail modal
- Wire to actual data from `getTaskTimeEntries(taskId)`
- Add "Log time" button that opens time entry form
- Add timer start for this specific task
- Show total logged time for task

---

### Task 3.4 — Wire Time Tracking Tab to Project Detail

**File to modify:** `app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx`

- Import `TimeTrackingTab` component
- Fetch time entries via `getProjectTimeEntries(projectId)`
- Pass project team members for filtering

---

## Phase 4 — Notification Integration (All Triggers)

### Task 4.1 — Integrate into Existing Server Actions

Add `createNotification()` calls into all existing server actions:

| Server Action File    | Trigger                          | Notification Type | Target             | Message Template                                         |
| --------------------- | -------------------------------- | ----------------- | ------------------ | -------------------------------------------------------- |
| `actions/invitation.ts` | Invitation accepted/rejected   | `INVITATION`      | OWNER + ADMIN      | `"[Name] a accepté/refusé l'invitation"`                 |
| `actions/project.ts`  | Project status change            | `PROJECT`         | OWNER + ADMIN + assigned USERs | `"Le projet [name] est passé à [status]"` |
| `actions/task.ts`     | Task assigned                    | `TASK`            | Assigned user      | `"Vous avez été assigné à la tâche [title]"`             |
| `actions/comment.ts`  | @mention in comment              | `TASK`            | Mentioned user     | `"[Author] vous a mentionné dans [task title]"`          |
| `actions/team.ts`     | Team member added/removed        | `TEAM`            | Affected user      | `"Vous avez été ajouté/retiré du projet [name]"`         |
| `actions/phase.ts`    | Phase status change              | `PHASE`           | OWNER + ADMIN      | `"La phase [name] est passée à [status]"`                |
| `actions/client.ts`   | Client added/updated             | `CLIENT`          | OWNER + ADMIN      | `"Le client [name] a été ajouté/modifié"`                |
| `actions/production.ts` | Production underperformance    | `PRODUCTION`      | OWNER              | `"Production en dessous du seuil pour [phase]"`          |
| `actions/lane.ts`     | Lane created/deleted             | `LANE`            | OWNER + ADMIN      | `"La colonne [name] a été créée/supprimée"`              |
| `actions/tag.ts`      | Tag created/deleted              | `TAG`             | OWNER + ADMIN      | `"Le tag [name] a été créé/supprimé"`                    |

### Task 4.2 — Trial Warning Notifications

**File to modify:** Logic can be added to dashboard layout or a scheduled check:
- Day 30 before trial ends: `GENERAL` → OWNER: `"Votre période d'essai expire dans 30 jours"`
- Day 7 before trial ends: `GENERAL` → OWNER: `"Votre période d'essai expire dans 7 jours"`
- Day 3 before trial ends: `GENERAL` → OWNER: `"Votre période d'essai se termine dans 3 jours"`

**Implementation:** Check `Subscription.endAt` on dashboard page load. If within threshold and no notification already sent for this period → create notification.

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

- [ ] Production: Create Product → add Production entries → charts render correctly
- [ ] Production: Alert fires when taux < threshold
- [ ] Time Tracking: Start/stop timer → entry created with correct duration
- [ ] Time Tracking: Manual entry → validates startTime < endTime
- [ ] Time Tracking: USER blocked from logging on non-assigned project
- [ ] Notifications: Bell shows unread count, updates every 30s
- [ ] Notifications: Bell dropdown shows latest 5 unread
- [ ] Notifications: Full page with filter tabs works
- [ ] Notifications: "Mark all as read" clears badges
- [ ] All notification triggers fire correctly from existing actions

### Security Checks

- [ ] All Prisma queries scoped by `companyId` (BR-01)
- [ ] Role checks in all server actions (SEC-02)
- [ ] USER can only log time on assigned projects (TIME-07)
- [ ] Production underperformance alert targets OWNER only (BR-14)

---

## File Inventory

### New Files (20)

| File                                                        | Type             |
| ----------------------------------------------------------- | ---------------- |
| `actions/production.ts`                                     | Server Actions   |
| `actions/time-entry.ts`                                     | Server Actions   |
| `actions/notification.ts`                                   | Server Actions   |
| `hooks/use-notifications.ts`                                | Client Hook      |
| `hooks/use-timer.ts`                                        | Client Hook      |
| `components/notifications/notification-bell.tsx`            | Client Component |
| `components/notifications/notification-dropdown.tsx`        | Client Component |
| `components/notifications/notification-list.tsx`            | Component        |
| `components/project/production/product-form.tsx`            | Client Component |
| `components/project/production/production-entry-form.tsx`   | Client Component |
| `components/project/production/production-charts.tsx`       | Client Component |
| `components/project/production/production-table.tsx`        | Component        |
| `components/project/production/production-tab.tsx`          | Component        |
| `components/project/time-tracking/timer-widget.tsx`         | Client Component |
| `components/project/time-tracking/time-entry-form.tsx`      | Client Component |
| `components/project/time-tracking/time-tracking-tab.tsx`    | Component        |
| `app/(dashboard)/dashboard/notifications/page.tsx`          | Page             |
| `app/(dashboard)/dashboard/notifications/loading.tsx`       | Loading          |

### Modified Files (12+)

| File                                                                    | Changes                              |
| ----------------------------------------------------------------------- | ------------------------------------ |
| `app/(dashboard)/unite/[unitId]/projects/[projectId]/page.tsx`          | Wire Production + Time Tracking tabs |
| `app/(dashboard)/unite/[unitId]/productions/page.tsx`                   | Build from placeholder               |
| `components/sidebar/app-sidebar.tsx`                                    | Add NotificationBell                 |
| `components/kanban/task-time-entries.tsx`                                | Wire real data + timer               |
| `lib/queries.ts`                                                        | Add production/time/notification queries |
| `lib/validators.ts`                                                     | Add Zod schemas for production/time  |
| `lib/types.ts`                                                          | Add TypeScript interfaces            |
| `actions/invitation.ts`, `project.ts`, `task.ts`, `comment.ts`, etc.    | Add createNotification() calls       |

---

## Execution Order

```
1. actions/notification.ts (foundation — everything depends on this)
2. hooks/use-notifications.ts
3. components/notifications/* (bell, dropdown, page)
4. Wire notification bell to layout
5. pnpm add recharts
6. actions/production.ts
7. components/project/production/* (forms, charts, table, tab)
8. Wire production tab to project detail
9. Build unit-wide productions page
10. actions/time-entry.ts
11. hooks/use-timer.ts
12. components/project/time-tracking/* (timer, forms, tab)
13. Wire time tracking tab to project detail
14. Integrate notifications into all existing server actions
15. Trial warning notification logic
16. Full verification
```

---

_End of Milestone 9 Plan_

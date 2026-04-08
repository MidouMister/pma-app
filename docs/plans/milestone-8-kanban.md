# Milestone 8: Kanban Board & Tasks Implementation Plan

This document outlines the approach for building the Kanban Board and Task management system for Milestone 8.

## Proposed Changes

---

### [Installation & Foundations]

- **Install Component**: Run `npx kibo-ui add kanban` (or `npx shadcn add @kibo-ui/kanban` depending on their registry) to bring in the Kanban board primitives.
- **Cache Definitions**: Ensure `unitLanesTag`, `unitTasksTag`, `userTasksTag`, and `unitTagsTag` are used correctly with `cacheLife("seconds")` due to the high interactivity of the board.

---

### [Lane & Tag Management]

#### [NEW] `actions/lane.ts`
Create Server Actions for Lane CRUD:
- `createLane(data)`: Validated for `unitId` scope.
- `updateLane(data)`: Updates lane name, color, and order.
- `deleteLane(id)`: Prevents deletion if tasks exist, or unassigns them, prompting a warning on the UI.
- `reorderLanes(lines)`: Bulk update for drag-and-drop of columns.

#### [NEW] `actions/tag.ts`
Create Server Actions for Tag CRUD:
- `createTag(data)`: Creates unit-scoped tags (Name, Color).
- `deleteTag(id)`: Removes tag and detaches from any tasks.

---

### [Task Management & Server Actions]

#### [NEW] `actions/task.ts`
Implement robust task operations ensuring tight business rules constraint:
- `createTask()`:
  - Validates `Plan.maxTasksPerProject` before saving.
  - Ensures assignee is an eligible TeamMember of the Project.
  - Ensures SubPhase is a child of Phase.
  - Triggers a `TASK` notification to the assigned user.
- `updateTask()`: Date, description, Assignment changes (with notifications).
- `moveTask()`: Handles drag-and-drop between lanes and ordering. Validates dragging privileges (USER only drags own tasks; ADMIN/OWNER drags all).
- `completeTask()`: Simple toggle for status, honoring permissions.

---

### [Kanban Board & UI Components]

#### [NEW] `app/(dashboard)/unite/[unitId]/kanban/page.tsx`
The primary working board for the unit:
- **Cascading Filter Bar**: At the top, three dropdowns (`Project` → `Phase` → `SubPhase`) that narrow options down the tree. Selecting a project filters tasks and available phases, etc.
- **Kanban Board**: Maps `Lanes` as columns and `Tasks` as cards.
  - Task Cards feature: Title, Assignee Avatar, Due Date, Tags, and an Overdue badge (Red if past date & not done).
  - Handles generic drag events and propagates them to `actions/task.ts` (for moving cards) and `actions/lane.ts` (for reordering columns).

#### [NEW] `components/kanban/task-detail-sheet.tsx`
A slide-over (Sheet) triggered when clicking a Task Card:
- Displays editable fields: Title, Description, Status, Lane, Assignee, Due Date, and Tags.
- Context Block: Read-only display of Project → Phase → SubPhase linkage.
- Time Entries view to see work logged against the task.
- **Comments & Mentions Tab**: Interactive component for discussion.

---

### [Comments & Mentions System]

#### [NEW] `actions/comment.ts` & Comments UI
- Building the `<CommentsList />` component fetching fresh comments (`noStore()`).
- Mentions Parser: Typing `@` opens an autocomplete dropdown querying eligible TeamMembers plus the ADMIN and OWNER.
- Resolving mentions creates unique `TaskMention` records linking the comment to the user, blocking duplicates via Prisma's unique constraints.
- Emits a specific `TASK` notification `"[Author] vous a mentionné dans [Task title]"`.


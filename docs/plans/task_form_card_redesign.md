# Task Form + Kanban Card — Full Redesign Plan

## 1. Schema vs Form: Missing Fields

| Schema Field     | In Form?         | In Card?                | Verdict                                                                     |
| ---------------- | ---------------- | ----------------------- | --------------------------------------------------------------------------- |
| `title`          | ✅               | ✅                      | OK                                                                          |
| `description`    | ✅               | ❌                      | **Card should preview it**                                                  |
| `startDate`      | ❌ **MISSING**   | ❌                      | **Add to form** — critical for tracking when work begins                    |
| `dueDate`        | ✅               | ✅                      | OK                                                                          |
| `endDate`        | ❌ **MISSING**   | ❌                      | **Add to form (edit only)** — marks actual completion date                  |
| `Tags[]`         | ❌ **MISSING**   | ✅ (renders if present) | **Add to form** — tags exist in schema but can never be added from the form |
| `projectId`      | ✅               | ✅ (project name)       | OK but card display is bad                                                  |
| `phaseId`        | ✅               | ❌                      | Detail only (shown in detail sheet on click)                                |
| `subPhaseId`     | ✅               | ❌                      | Detail only (shown in detail sheet on click)                                |
| `assignedUserId` | ✅               | ✅                      | OK                                                                          |
| `laneId`         | ✅               | N/A (implicit)          | OK                                                                          |
| `complete`       | ❌ (toggle only) | ✅                      | OK — toggle is sufficient                                                   |

### Missing Fields to Add

1. **`startDate`** — Date picker, left uninitialized (null) for new tasks. Auto-set when user picks a date. Important for Gantt integration and knowing when work started
2. **`Tags[]`** — Multi-select from existing unit tags. The Tag model exists, the card renders them, but there's NO way to add tags during task creation. Uses `getUnitTags()` query (already exists in `lib/queries.ts`)
3. **`endDate`** — Date picker, only shown in **edit mode**. Marks when the task was actually finished (different from `dueDate`)

---

## 2. Current Card Problems (from screenshot)

| #   | Problem                            | Detail                                                                                                                                |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Project name dominates**         | "ETUDE D'EXPERTISE POUR LES TRAVAUX DE TRAITEMENT D'UN GLISSEMENT..." takes up half the card in 10px uppercase — unreadable and noisy |
| 2   | **No description preview**         | Long descriptions are invisible until the detail sheet is opened                                                                      |
| 3   | **"Terminer" button is ugly**      | Plain text button at the bottom with a circle icon — looks like an afterthought, not a deliberate UI element                          |
| 4   | **No date range**                  | Only `dueDate` shown. If `startDate` exists, it should show a compact range like "3 mai → 1 juil."                                    |
| 5   | **Card is too tall**               | Project name + title + assignee row + complete button = 4 vertical sections. Too much for a card that should be scannable             |
| 6   | **No hover context menu**          | Only way to interact is click (opens detail sheet). No quick actions like edit, delete, reassign                                      |
| 7   | **Tags render but can't be added** | Tag badges show on the card but the creation form has no tag selector                                                                 |

---

## 3. Proposed Redesign

### 3A. Task Form Redesign

**Dialog**: `sm:max-w-2xl` (672px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Nouvelle tâche                                              ✕  │
│  Créez une nouvelle tâche pour ce projet                        │
│                                                                  │
│  Titre de la tâche *                                 37/120      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Développer le formulaire de connexion                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Description (optionnel)                                         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Les cartes permettent de visualiser...                   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ── LOCALISATION ────────────────────────────────────────────    │
│                                                                  │
│  📁 Projet *                                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 📁 ETUDE D'EXPERTISE POUR LES TRAVAUX DE TRAITEMENT     │    │
│  │   D'UN GLISSEMENT D'UNE ROUTE (RIVE GAUCHE)...        ✕ │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐   ┌───────────────────────────────┐   │
│  │ 📑 Phase *           │   │ 🌳 Sous-phase (optionnel)     │   │
│  │ Phase 01         ▾   │   │ Sélectionner...           ▾   │   │
│  └──────────────────────┘   └───────────────────────────────┘   │
│                                                                  │
│  ── PLANIFICATION ───────────────────────────────────────────    │
│                                                                  │
│  ┌──────────────────────┐   ┌───────────────────────────────┐   │
│  │ 📅 Début (optionnel) │   │ 📅 Échéance (optionnel)       │   │
│  │ 6 mai 2026           │   │ 1 juillet 2026                │   │
│  └──────────────────────┘   └───────────────────────────────┘   │
│                                                                  │
│  ── ATTRIBUTION ─────────────────────────────────────────────    │
│                                                                  │
│  ┌──────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │
│  │ 🏷 Colonne   │ │ 👤 Assigné à    │ │ 🏷 Tags (optionnel) │   │
│  │ plane    ▾   │ │ 🟡 Ahmed    ▾   │ │ + Ajouter un tag    │   │
│  └──────────────┘ └─────────────────┘ └─────────────────────┘   │
│                                                                  │
│                                          [Annuler]  [✓ Créer]    │
└─────────────────────────────────────────────────────────────────┘
```

**Key changes from current form:**

1. **New section: "PLANIFICATION"** with `startDate` + `dueDate` side-by-side
2. **Tags multi-select** in Attribution section — Popover with existing unit tags as checkboxes + colored badges
3. **`endDate` only in edit mode** — shows only when editing an existing task
4. **Project as Combobox chip** (already implemented in previous session)
5. **Smart defaults**: auto-select lone phase, hide column if `initialLaneId` provided
6. **Ctrl+Enter** to submit

---

### 3B. Kanban Card Redesign

**Current card (too tall, noisy):**

```
┌─────────────────────────────────────┐
│ ETUDE D'EXPERTISE POUR LES TRAVAUX │  ← project name = noise
│ DE TRAITEMENT D'UN GLISSEMENT...   │
│                                     │
│ Développer le formulaire de conne.  │  ← title
│                                     │
│ 🟡 ? Non assigné    📅 1 juil.      │  ← assignee + due
│                                     │
│ ○ Terminer                          │  ← ugly button
└─────────────────────────────────────┘
```

**Proposed card (compact, scannable, modern):**

```
┌─────────────────────────────────────┐
│ ○  Développer le formulaire de      │  ← checkbox + title (primary)
│    connexion                        │
│                                     │
│ Les cartes permettent de visuali... │  ← 1-line description preview
│                                     │
│ 🔴 Urgent  🟢 Frontend              │  ← tag badges (if any)
│                                     │
│ 🟡 Ahmed K.        📅 1 juil.       │  ← avatar + due date (footer)
│                          ▲ En retard│
└─────────────────────────────────────┘
```

> **User feedback applied:** Show description preview instead of phase/sub-phase breadcrumb.
> Phase, sub-phase, and other details are visible when the user clicks the card to open the detail sheet.

#### Design Decisions

| Element             | Current                     | Proposed                                                                                                 | Rationale                                                          |
| ------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Project name**    | 10px uppercase, full name   | **Remove from card** — user already knows which project (filter bar shows it). Show only in detail sheet | Reduces noise by ~40%. The filter bar provides project context     |
| **Title**           | Text only                   | **Checkbox + title** — the checkbox IS the complete toggle                                               | Eliminates "Terminer" button, saves a full row                     |
| **Description**     | Hidden                      | **1-line preview** in `text-xs text-muted-foreground line-clamp-1`                                       | Gives a preview without taking space                               |
| **Phase/SubPhase**  | Hidden                      | **Stay hidden on card** — shown in detail sheet on click                                                 | Per user feedback: card stays clean, detail sheet has full context |
| **Tags**            | Renders if present          | Same, but now they can be **added via the form**                                                         | Enables the feature that was half-built                            |
| **Complete toggle** | "Terminer" button at bottom | **Inline checkbox** next to title (like Linear/Todoist)                                                  | More intuitive, saves vertical space                               |
| **Date range**      | Only dueDate                | Show `startDate → dueDate` if both exist, or just `dueDate`                                              | Gives scheduling context at a glance                               |
| **Hover actions**   | None                        | **Quick action bar on hover**: edit, delete                                                              | Faster workflows without opening the detail sheet                  |

---

## 4. Files Modified

### Task Form

| File                                | Change                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/kanban/task-dialog.tsx` | Add `startDate`/`endDate` pickers, Tags multi-select, "Planification" section. New prop: `availableTags?: Array<{ id: string; name: string; color: string }>` |

### Kanban Card

| File                                            | Change                                                                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/kanban/task-card.tsx`               | **NEW FILE** — Extract card from `unit-kanban.tsx`. Redesign: remove project name, add inline checkbox, add description preview, add hover quick actions |
| `components/kanban/unit-kanban.tsx`             | Import and use `TaskCard` instead of inline card rendering. Add `startDate` to KanbanTask mapping passthrough                                            |
| `app/(dashboard)/unite/[unitId]/tasks/page.tsx` | Pass `startDate` to kanbanTasks mapping, pass `availableTags` to TaskDialog                                                                              |

### No Schema Changes Needed

The schema already supports `startDate`, `endDate`, and `Tags[]`. The Zod validators (`taskSchema`, `taskUpdateSchema`) also already support them. The `createTask` action already writes `startDate` and `endDate`. The `getUnitTags()` query already exists in `lib/queries.ts`. **Only the form UI was missing these fields and the card was missing the redesign.**

---

## 5. Implementation Notes (Critical)

### 5.1 Card Extraction

- Extract the card rendering from `unit-kanban.tsx` (lines 644-752) into a new `components/kanban/task-card.tsx` file BEFORE redesigning
- Card component receives: `task`, `laneColor`, `canEdit`, `onComplete`, `onEdit`, `onDelete`, `onClick`
- This is a separate atomic commit from the redesign

### 5.2 Inline Checkbox (Complete Toggle)

- The checkbox replaces the "Terminer" button
- **MUST** include `onClick={(e) => e.stopPropagation()}` on the checkbox to prevent opening the detail sheet
- `onComplete(taskId)` calls the existing `completeTask` server action

### 5.3 Hover Quick Actions — Mobile Strategy

- Desktop: action bar visible on card hover (edit, delete)
- Mobile (`md:hidden`): always-visible `⋮` kebab menu via `<DropdownMenu>`
- This ensures touch devices have equivalent access to quick actions

### 5.4 Tags Multi-Select in Form

- Uses `<Popover>` + `<Command>` with checkboxes
- Selected tags shown as colored `<Badge>` chips
- Pass `availableTags` from page → `UnitKanban` → `TaskDialog`
- Prop type: `availableTags?: Array<{ id: string; name: string; color: string }>`

### 5.5 `startDate` Default Behavior

- Leave `startDate` **uninitialized** (null) for new tasks
- Auto-set when user explicitly picks a date
- Rationale: a task in "Planned" lane hasn't started yet — defaulting to today is misleading

### 5.6 `endDate` — Edit Mode Only

- Only show when `task` prop is present (edit mode)
- Placed in "Planification" section next to `dueDate`

---

## 6. Verification Plan

### Automated

1. `pnpm typecheck` — zero errors
2. `pnpm lint` — zero errors
3. `pnpm build` — all 24 pages compile

### Visual (Browser)

1. Open task form → Verify 4 sections: Core, Localisation, Planification, Attribution
2. Create task with startDate + dueDate + 2 tags → Verify card shows tags + date range
3. Edit task → Verify endDate field appears
4. Hover over card → Verify quick action bar shows (desktop)
5. Click checkbox on card → Verify task toggles complete WITHOUT opening detail sheet
6. Responsive: Resize to 768px → Verify form sections collapse to single column
7. Card truncation: 120-char title + 200-char description → verify no overflow
8. Tag overflow: 5+ tags → verify they wrap gracefully
9. Completed state: checkbox checked → verify visual distinction (strikethrough title + muted opacity)
10. Mobile: verify kebab menu (`⋮`) is always visible on touch devices

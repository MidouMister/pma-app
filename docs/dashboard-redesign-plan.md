# PMA Dashboard Redesign Plan
## Routes: `/company/[companyId]` & `/unite/[unitId]`

> **Skill applied:** `ui-ux-pro-max` — Design intelligence for enterprise SaaS project management dashboards.
> **Stack:** Next.js 16 App Router · shadcn/ui v4 · Tailwind CSS 4 · Framer Motion · Lucide + HugeIcons

---

## 1. Current State Assessment

### What exists today

| Route | Current UI | Issues |
|---|---|---|
| `/company/[companyId]` | 5 plain KPI cards + simple unit grid | No visual hierarchy, no trends, no actions, generic card design |
| `/unite/[unitId]` | 4 KPI cards + flat data table + empty activity placeholder | Table is dense, no progress indicators, placeholder section wastes space |

### What's already good (preserve)
- ✅ Server Components with auth guards
- ✅ Correct data queries (`getCompanyDashboard`, `getUnitDashboard`)
- ✅ Tenant isolation via `companyId`
- ✅ Framer Motion already installed (used in auth layout)
- ✅ `@hugeicons/react` already installed
- ✅ shadcn/ui initialized with the full component set
- ✅ Theme tokens in `globals.css` (OKLCH primary blue/indigo)

---

## 2. Design System

### Color Palette (layered onto existing theme variables)

| Token | Purpose | Value |
|---|---|---|
| `--primary` | Brand accent, active state | Existing OKLCH indigo-blue |
| `--emerald-*` | Success, completed, active | `emerald-500/600` |
| `--amber-*` | Warning, on-hold, in-pause | `amber-500/600` |
| `--violet-*` | KPI highlight, financial | `violet-500/600` |
| `--rose-*` | Destructive, overdue | `rose-500/600` |
| `--muted` | Background fills, subtle dividers | Existing |

### Typography Upgrade
- Import **Inter** via Google Fonts in `app/layout.tsx` for heading weight variation
- Use `tracking-tight` on large display numbers
- `font-mono` on financial values and project codes

### Animation Tokens (Framer Motion)
```
entrance: { opacity: 0→1, y: 20→0, duration: 0.4, ease: "easeOut" }
stagger children: each 0.08s delay
hover card: { y: -2, shadow: increase, duration: 0.2 }
counter: count-up animation on KPI numbers
```

### Icon Set
- **Lucide**: structural icons (ArrowRight, TrendingUp, ChevronRight, MoreHorizontal)
- **HugeIcons**: premium decorative icons in stat card backgrounds

---

## 3. New Components to Build

### 3.1 `components/shared/stat-card.tsx` [NEW]
An upgraded replacement for the inline `KpiCard` components, extracted to a reusable shared component.

**Features:**
- Gradient icon container (not flat button color)
- Trend indicator: `+X%` with TrendingUp/TrendingDown icon (green/red)
- Animated number count-up on mount (`"use client"`)
- Sparkline area (optional mini bar row for visual rhythm)
- Subtle top-border accent stripe matching the accent color
- Sub-label line for context (e.g., "vs last month")

**Props:**
```typescript
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: "primary" | "success" | "warning" | "violet" | "rose"
  trend?: { value: number; label: string } // e.g. { value: 12, label: "ce mois" }
  href?: string // makes card a link
  description?: string
}
```

### 3.2 `components/shared/dashboard-header.tsx` [NEW]
A premium hero header replacing the plain `PageHeader` for dashboard pages only.

**Features:**
- Gradient background strip (subtle, 2px tall top border with gradient, or full-bleed gradient card)
- Company/unit avatar with initials fallback
- Breadcrumb: Company → Unit
- Right side: Quick action buttons (CTA) + Date/time display
- SidebarTrigger integrated
- Subscription badge (TRIAL / ACTIVE / GRACE in color)
- Animated entrance

### 3.3 `components/company/unit-card.tsx` [NEW]
A rich card replacing the basic `UnitCard` in the company dashboard.

**Features:**
- Colored left accent border (hue based on unit index)
- Mini progress ring (CSS-only): `projectCount / totalProjects` completion rate
- Health indicator dot: green/amber/red based on active project ratio
- Member count with mini avatar stack
- Project count with progress bar
- Hover: slide-in arrow + shadow lift + border highlight
- Admin name with avatar initials

### 3.4 `components/unit/project-row.tsx` [NEW]
Upgraded table row component for the unit dashboard's recent projects.

**Features:**
- Status dot (colored circle before status badge)
- Rich status badge with custom colors (not just `variant="default"`)
- Client name truncated with tooltip
- Inline mini progress bar for phase completion %
- Montant TTC in `font-mono` with `formatCurrency`
- Row hover: full-row background highlight

---

## 4. Page-by-Page Redesign

### 4.1 Company Dashboard — `/company/[companyId]/page.tsx`

**Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│  DashboardHeader (hero, company name, quick actions) │
├──────┬──────┬──────┬──────┬──────────────────────────┤
│ KPI  │ KPI  │ KPI  │ KPI  │ KPI (5 stat cards)       │
├─────────────────────────────────────────────────────┤
│  Unit Overview Grid (2-3 columns)                   │
│  [UnitCard] [UnitCard] [UnitCard]                   │
├──────────────────────┬──────────────────────────────┤
│  Quick Actions       │  Top Projects (mini list)    │
│  (4 link buttons)    │  (3 most recent projects)    │
└──────────────────────┴──────────────────────────────┘
```

**Specific improvements:**
1. **DashboardHeader**: Company name as H1 with company logo avatar, `Tableau de bord` subtitle, plus "Gérer les unités" button linking to `/company/[id]/units`
2. **5 StatCards** with trend indicators:
   - Unités → accent: primary, show `+1` if recently added
   - Projets → accent: violet
   - Membres → accent: default
   - Valeur contrats → accent: success, show formatted currency with trend
   - Projets actifs → accent: success/warning, show "X en cours"
3. **Unit grid**: 3-column, each `UnitCard` with health dot, mini bars, initials
4. **Bottom two-col split**:
   - Left: "Actions rapides" with 4 icon+label buttons (Créer une unité, Gérer les membres, Paramètres, Inviter un utilisateur)
   - Right: "Derniers projets" flat list (top 3 most recent projects across all units)

**Animations:**
- Header fades in (y: 20→0, 0.4s)
- KPI cards stagger in (each 80ms delay)
- Unit cards stagger in (each 60ms delay)

---

### 4.2 Unit Dashboard — `/unite/[unitId]/page.tsx`

**Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│  DashboardHeader (breadcrumb: Company > Unit name)  │
├──────┬──────┬──────┬──────────────────────────────┤
│ KPI  │ KPI  │ KPI  │ KPI  (4 stat cards)          │
├─────────────────────────┬───────────────────────────┤
│  Status Distribution    │  Quick Actions            │
│  (4 colored pills)      │  (project/member/client)  │
├─────────────────────────────────────────────────────┤
│  Projets récents (enhanced table, 5 rows)           │
│  + "Voir tous les projets" link button              │
├─────────────────────────────────────────────────────┤
│  Activité récente (timeline stub — coming soon)     │
└─────────────────────────────────────────────────────┘
```

**Specific improvements:**
1. **DashboardHeader**: Breadcrumb showing `Company.name / Unit.name`, with "Créer un projet" primary button and "Voir les membres" secondary button
2. **4 StatCards** with richer data:
   - Projets total → primary, show sub-label "X en attente"
   - Projets actifs → success/warning
   - Membres → no trend, link to members page
   - Valeur contrats → violet/success, formatted currency
3. **Status Distribution row**: A color-coded pill strip showing counts per status (New, InProgress, Pause, Complete) with percentage bars
4. **Enhanced projects table**:
   - Status dot + colored badge
   - Inline mini progress bar
   - Client with icon
   - Clickable row → navigation to project
   - "Voir tous les projets →" footer link
5. **Activity section**: Replace empty placeholder with a styled "coming soon" card — glass effect, animated pulse dot, proper description

---

## 5. Files to Create / Modify

### New Files

| File | Type | Purpose |
|---|---|---|
| `components/shared/stat-card.tsx` | `"use client"` | Reusable animated KPI card |
| `components/shared/dashboard-header.tsx` | Server | Premium header with gradient |
| `components/company/unit-card.tsx` | Server | Rich unit card with health indicators |
| `components/unit/status-distribution.tsx` | Server | Status color pills + mini bars |

### Modified Files

| File | Change |
|---|---|
| `app/(dashboard)/company/[companyId]/page.tsx` | Full redesign using new components |
| `app/(dashboard)/company/[companyId]/loading.tsx` | Update skeleton to match new layout |
| `app/(dashboard)/unite/[unitId]/page.tsx` | Full redesign using new components |
| `app/(dashboard)/unite/[unitId]/loading.tsx` | Update skeleton to match new layout |

---

## 6. shadcn Components to Add

Run before implementation:
```bash
npx shadcn@latest add progress
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add tooltip
```

> Check with `npx shadcn@latest info` first — `tooltip` may already be installed.

---

## 7. Design Tokens & Class Patterns

### Gradient Icon Containers (StatCard)
```tsx
// primary
"bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
// success
"bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:text-emerald-400"
// warning
"bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400"
// violet
"bg-gradient-to-br from-violet-500/20 to-violet-500/10 text-violet-600 dark:text-violet-400"
```

### Card Border Accent (top stripe)
```tsx
"border-t-2 border-t-primary" // primary
"border-t-2 border-t-emerald-500" // success
```

### Unit Card Accent Left Borders (cycled by index)
```tsx
const UNIT_ACCENTS = [
  "border-l-4 border-l-primary",
  "border-l-4 border-l-emerald-500",
  "border-l-4 border-l-violet-500",
  "border-l-4 border-l-amber-500",
]
```

### Status Badge Colors (beyond shadcn defaults)
```tsx
const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  InProgress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Pause: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
}
```

---

## 8. Animation Patterns (Framer Motion)

```tsx
// Page entrance wrapper (add to page root div)
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>

// Staggered children
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.08, duration: 0.3 }}
  >
```

> ⚠️ All motion wrappers require `"use client"`. Extract animated wrappers to client components (`AnimatedSection`, `AnimatedGrid`) to keep pages as Server Components.

---

## 9. Pre-Delivery Checklist

- [ ] No layout shift on hover (use `transition-colors`, avoid scale transforms)
- [ ] All clickable cards have `cursor-pointer`
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Border visibility in both dark and light mode
- [ ] `pnpm typecheck` passes — no implicit `any`
- [ ] `pnpm lint` passes
- [ ] `pnpm format` run before commit
- [ ] Responsive: 375px / 768px / 1024px / 1440px verified
- [ ] No content hidden behind fixed header
- [ ] `prefers-reduced-motion` respected (Framer Motion does this automatically when using `useReducedMotion`)

---

## 10. Implementation Order

1. `npx shadcn@latest add progress avatar separator` — add missing components
2. Build `components/shared/stat-card.tsx` — foundation for both pages
3. Build `components/shared/dashboard-header.tsx` — shared premium header
4. Build `components/company/unit-card.tsx`
5. Build `components/unit/status-distribution.tsx`
6. Rewrite `app/(dashboard)/company/[companyId]/page.tsx`
7. Update `app/(dashboard)/company/[companyId]/loading.tsx`
8. Rewrite `app/(dashboard)/unite/[unitId]/page.tsx`
9. Update `app/(dashboard)/unite/[unitId]/loading.tsx`
10. Git: commit on feature branch `feature/dashboard-redesign`

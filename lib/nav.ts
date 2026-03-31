import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  FolderKanban,
  Kanban,
  Briefcase,
  Bell,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export function getNavigation(
  role: string | null,
  companyId: string | null,
  unitId: string | null,
  userId: string | null
): NavSection[] {
  if (!role || !companyId || !userId) return []

  // OWNER viewing Company (no specific unit selected)
  if (role === "OWNER" && !unitId) {
    return [
      {
        items: [
          {
            title: "Tableau de bord",
            url: `/company/${companyId}`,
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: "Gestion",
        items: [
          {
            title: "Unités",
            url: `/company/${companyId}/units`,
            icon: Building2,
          },
          {
            title: "Équipe globale",
            url: `/company/${companyId}/users`,
            icon: Users,
          },
        ],
      },
      {
        label: "Configuration",
        items: [
          {
            title: "Facturation",
            url: `/company/${companyId}/settings/billing`,
            icon: CreditCard,
          },
          {
            title: "Paramètres",
            url: `/company/${companyId}/settings`,
            icon: Settings,
          },
        ],
      },
    ]
  }

  // ADMIN or OWNER viewing a specific unit
  if ((role === "OWNER" || role === "ADMIN") && unitId) {
    return [
      {
        items: [
          {
            title: "Tableau de bord",
            url: `/unite/${unitId}`,
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: "Opérations",
        items: [
          {
            title: "Projets",
            url: `/unite/${unitId}/projects`,
            icon: FolderKanban,
          },
          {
            title: "Kanban",
            url: `/unite/${unitId}/kanban`,
            icon: Kanban,
          },
          {
            title: "Clients",
            url: `/unite/${unitId}/clients`,
            icon: Briefcase,
          },
        ],
      },
      {
        label: "Configuration",
        items: [
          {
            title: "Membres",
            url: `/unite/${unitId}/members`,
            icon: Users,
          },
          {
            title: "Paramètres",
            url: `/unite/${unitId}/settings`,
            icon: Settings,
          },
        ],
      },
    ]
  }

  // USER view
  if (role === "USER") {
    return [
      {
        items: [
          {
            title: "Mon espace",
            url: `/user/${userId}`,
            icon: LayoutDashboard,
          },
          {
            title: "Notifications",
            url: "/dashboard/notifications",
            icon: Bell,
          },
        ],
      },
    ]
  }

  return []
}

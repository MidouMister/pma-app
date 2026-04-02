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
  Factory,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export function getNavigation(
  role: string | null,
  companyId: string | null,
  unitId: string | null,
  userId: string | null
): NavItem[] {
  if (!role || !companyId || !userId) return []

  // OWNER viewing Company (no specific unit selected)
  if (role === "OWNER" && !unitId) {
    return [
      {
        title: "Tableau de bord",
        url: `/company/${companyId}`,
        icon: LayoutDashboard,
      },
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
      {
        title: "Paiement",
        url: `/company/${companyId}/settings/billing`,
        icon: CreditCard,
      },
      {
        title: "Paramètres",
        url: `/company/${companyId}/settings`,
        icon: Settings,
      },
    ]
  }

  // ADMIN or OWNER viewing a specific unit
  if ((role === "OWNER" || role === "ADMIN") && unitId) {
    return [
      {
        title: "Tableau de bord",
        url: `/unite/${unitId}`,
        icon: LayoutDashboard,
      },
      {
        title: "Projets",
        url: `/unite/${unitId}/projects`,
        icon: FolderKanban,
      },
      {
        title: "Tâches",
        url: `/unite/${unitId}/tasks`,
        icon: Kanban,
      },
      {
        title: "Production",
        url: `/unite/${unitId}/productions`,
        icon: Factory,
      },
      {
        title: "Clients",
        url: `/unite/${unitId}/clients`,
        icon: Briefcase,
      },
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
    ]
  }

  // USER view
  if (role === "USER") {
    return [
      {
        title: "Mon espace",
        url: `/user/${userId}`,
        icon: LayoutDashboard,
      },
      {
        title: "Notifications",
        url: `/dashboard/notifications`,
        icon: Bell,
      },
    ]
  }

  return []
}

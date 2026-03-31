"use client"

import * as React from "react"
import Image from "next/image"
import { Building2 } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  CompanyUnitSwitcher,
  WorkspaceItem,
} from "@/components/sidebar/company-unit-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import type { NavSection } from "@/lib/nav"

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  companyId: string | null
}

export function AppSidebar({
  userData,
  navigationItems,
  currentWorkspace,
  availableWorkspaces,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userData: UserData
  navigationItems: NavSection[]
  currentWorkspace: WorkspaceItem
  availableWorkspaces: WorkspaceItem[]
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {userData.role === "OWNER" && availableWorkspaces.length > 0 ? (
          <CompanyUnitSwitcher
            currentWorkspace={currentWorkspace}
            workspaces={availableWorkspaces}
          />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="pointer-events-none">
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {currentWorkspace.logo ? (
                    <Image
                      src={currentWorkspace.logo}
                      alt="Logo"
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {currentWorkspace.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {currentWorkspace.type === "company"
                      ? "Entreprise"
                      : "Unité"}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavMain sections={navigationItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Building2, Pickaxe, ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface WorkspaceItem {
  id: string
  name: string
  type: "company" | "unit"
  logo?: string | null
}

const IconRender = ({ type, logo }: { type: string; logo?: string | null }) => {
  if (logo) {
    return (
      <Image
        src={logo}
        alt="Logo"
        width={32}
        height={32}
        className="h-full w-full object-cover"
      />
    )
  }
  return type === "company" ? (
    <Building2 className="h-4 w-4" />
  ) : (
    <Pickaxe className="h-4 w-4" />
  )
}

export function CompanyUnitSwitcher({
  currentWorkspace,
  workspaces,
}: {
  currentWorkspace: WorkspaceItem
  workspaces: WorkspaceItem[]
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleSelect = (workspace: WorkspaceItem) => {
    if (workspace.type === "company") {
      router.push(`/company/${workspace.id}`)
    } else {
      router.push(`/unite/${workspace.id}`)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <IconRender
                  type={currentWorkspace.type}
                  logo={currentWorkspace.logo}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentWorkspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentWorkspace.type === "company" ? "Entreprise" : "Unité"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Vues disponibles
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={`${ws.type}-${ws.id}`}
                onClick={() => handleSelect(ws)}
                className="cursor-pointer gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center overflow-hidden rounded-md border text-muted-foreground">
                  <IconRender type={ws.type} logo={ws.logo} />
                </div>
                {ws.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

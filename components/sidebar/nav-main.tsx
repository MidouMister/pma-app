"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavSection } from "@/lib/nav"

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <SidebarGroup key={sectionIndex}>
          {section.label && (
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          )}
          <SidebarMenu>
            {section.items.map((item) => {
              const isActive =
                pathname === item.url ||
                (pathname.startsWith(`${item.url}/`) &&
                  item.url !== "/dashboard")
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

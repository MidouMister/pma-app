"use client"

import { motion } from "framer-motion"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  subscriptionBadge?: {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
  className?: string
}

export function DashboardHeader({
  title,
  subtitle,
  icon,
  actions,
  subscriptionBadge,
  className,
}: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("relative", className)}
    >
      {/* Gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1 shrink-0" />

          {icon && (
            <Avatar className="size-10 shrink-0 border">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {icon}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              {subscriptionBadge && (
                <Badge
                  variant={subscriptionBadge.variant}
                  className="text-[10px] font-medium tracking-wider uppercase"
                >
                  {subscriptionBadge.label}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 sm:shrink-0">{actions}</div>
        )}
      </div>
    </motion.div>
  )
}

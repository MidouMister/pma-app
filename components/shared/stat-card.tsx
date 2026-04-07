"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCENT_STYLES: Record<string, string> = {
  primary:
    "border-t-primary bg-gradient-to-br from-primary/10 to-primary/5 text-primary",
  success:
    "border-t-emerald-500 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  warning:
    "border-t-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400",
  violet:
    "border-t-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-600 dark:text-violet-400",
  rose: "border-t-rose-500 bg-gradient-to-br from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400",
  default:
    "border-t-border bg-gradient-to-br from-muted/50 to-muted/25 text-muted-foreground",
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: "primary" | "success" | "warning" | "violet" | "rose" | "default"
  trend?: { value: number; label: string }
  href?: string
  description?: string
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <>{display.toLocaleString("fr-FR")}</>
}

export function StatCard({
  label,
  value,
  icon,
  accent = "default",
  trend,
  href,
  description,
}: StatCardProps) {
  const Card = href ? Link : "div"
  const isNumeric = typeof value === "number"

  const content = (
    <div
      className={cn(
        "group/stat relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        ACCENT_STYLES[accent]
      )}
    >
      {/* Top accent stripe */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />

      {/* Icon + label row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-colors duration-200",
            ACCENT_STYLES[accent]
          )}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">
          {isNumeric ? <AnimatedNumber value={value} /> : value}
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.value >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend.value > 0 ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>

      {/* Optional description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card href={href} className="block cursor-pointer">
          {content}
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  )
}

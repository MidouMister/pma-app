import { format } from "date-fns"
import { fr } from "date-fns/locale"

const currencyFormatter = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount).replace("DZD", "DA").trim()
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDelai(months: number, days: number): string {
  const parts: string[] = []
  if (months > 0) {
    parts.push(`${months} mois`)
  }
  if (days > 0) {
    parts.push(`${days} jours`)
  }
  return parts.join(" ") || "0 jour"
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins}m`)
  }
  return parts.join(" ")
}

export function formatRelativeDueDate(date: Date): {
  text: string
  variant: "today" | "overdue" | "normal"
  daysUntil: number
} {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return { text: "Aujourd'hui", variant: "today", daysUntil: 0 }
  }
  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays)
    return {
      text: `En retard · ${daysOverdue}j`,
      variant: "overdue",
      daysUntil: diffDays,
    }
  }
  return {
    text: format(date, "d MMM", { locale: fr }),
    variant: "normal",
    daysUntil: diffDays,
  }
}

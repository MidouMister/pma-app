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

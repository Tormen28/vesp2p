const VES_FORMAT = new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "VES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const NUMBER_FORMAT = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PERCENT_FORMAT = new Intl.NumberFormat("es-VE", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatVES(amount: number): string {
  return VES_FORMAT.format(amount)
}

export function formatNumber(num: number): string {
  return NUMBER_FORMAT.format(num)
}

export function formatPercent(num: number): string {
  return PERCENT_FORMAT.format(num / 100)
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === "string" ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "ahora"
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffMins < 1440) return `hace ${Math.floor(diffMins / 60)}h`
  return `hace ${Math.floor(diffMins / 1440)}d`
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

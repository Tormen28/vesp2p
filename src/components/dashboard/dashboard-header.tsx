"use client"

import { useState, useEffect } from "react"
import { Bell, RefreshCw, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"

interface DashboardHeaderProps {
  lastUpdated: string | null
  isLoading: boolean
  onRefresh: () => void
  onAlertsClick: () => void
  alertCount?: number
  viewMode?: "standard" | "glance"
  onViewModeChange?: (mode: "standard" | "glance") => void
}

type FreshnessCategory = "fresh" | "aging" | "stale"

function getDataFreshness(lastUpdated: string | null): { category: FreshnessCategory; seconds: number } {
  if (!lastUpdated) return { category: "stale", seconds: Infinity }
  const diff = Date.now() - new Date(lastUpdated).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 120) return { category: "fresh", seconds }
  if (seconds < 300) return { category: "aging", seconds }
  return { category: "stale", seconds }
}

function getRelativeTime(seconds: number): string {
  if (seconds < 60) return `Hace ${seconds} segundos`
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return "Hace 1 minuto"
  return `Hace ${minutes} minutos`
}

export function DashboardHeader({
  lastUpdated,
  isLoading,
  onRefresh,
  onAlertsClick,
  alertCount = 0,
  viewMode,
  onViewModeChange,
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [relativeTime, setRelativeTime] = useState<string>("")
  const [freshness, setFreshness] = useState<FreshnessCategory>("stale")

  useEffect(() => {
    if (!lastUpdated) return

    const updateFreshness = () => {
      const { category, seconds } = getDataFreshness(lastUpdated)
      setFreshness(category)
      setRelativeTime(getRelativeTime(seconds))
    }

    updateFreshness()
    const interval = setInterval(updateFreshness, 10000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          Analizador P2P{" "}
          <span className="text-primary">USDT/VES</span>
        </h1>
        <Badge variant="outline" className="hidden sm:inline-flex">
          Binance
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {lastUpdated && (
          <div className="flex items-center gap-2 mr-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                freshness === "fresh"
                  ? "bg-green-500 animate-pulse"
                  : freshness === "aging"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {relativeTime}
            </span>
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onAlertsClick}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Button>

        {onViewModeChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewModeChange(viewMode === "standard" ? "glance" : "standard")}
            className="hidden md:inline-flex"
          >
            {viewMode === "standard" ? "Glance" : "Standard"}
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button onClick={onRefresh} disabled={isLoading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>
    </div>
  )
}

"use client"

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
}

export function DashboardHeader({
  lastUpdated,
  isLoading,
  onRefresh,
  onAlertsClick,
  alertCount = 0,
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()

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
          <span className="text-sm text-muted-foreground mr-2">
            {lastUpdated}
          </span>
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

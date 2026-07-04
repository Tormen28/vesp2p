"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import type { P2PData } from "@/types"
import { formatVES } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"
import { SpotReferenceBadge } from "@/components/ui/spot-reference-badge"

interface GlanceViewProps {
  sellData: P2PData | null
  buyData: P2PData | null
  priceChange?: number | null
  priceChangePercent?: number | null
}

export function GlanceView({ sellData, buyData, priceChange = null, priceChangePercent = null }: GlanceViewProps) {
  const sellPrice = sellData
    ? parseFloat(sellData.priceStats.max.replace(/,/g, ""))
    : null
  const buyPrice = buyData
    ? parseFloat(buyData.priceStats.min.replace(/,/g, ""))
    : null

  if (sellPrice === null) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center py-8 px-4">
        <div className="text-center space-y-4" role="status" aria-label="Cargando precios...">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-16 w-48 mx-auto" />
          <Skeleton className="h-8 w-32 mx-auto" />
        </div>
      </div>
    )
  }

  const isPositive = priceChange !== null ? priceChange >= 0 : true

  return (
    <div className="md:hidden flex flex-col items-center justify-center py-8 px-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <SpotReferenceBadge p2pPrice={sellPrice} />
        </div>
        <div className="text-sm text-muted-foreground uppercase tracking-wider">
          USDT/VES
        </div>
        <div className="text-7xl font-bold tracking-tight">
          {formatVES(sellPrice)}
          <span className="text-2xl ml-1 text-muted-foreground">VES</span>
        </div>
        {priceChangePercent !== null && (
          <div
            className={`inline-flex items-center gap-1 text-2xl font-medium px-4 py-1 rounded-full ${
              isPositive
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUp className="h-6 w-6" />
            ) : (
              <ArrowDown className="h-6 w-6" />
            )}
            <span>{isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%</span>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Venta • Binance P2P
        </div>
      </div>
    </div>
  )
}

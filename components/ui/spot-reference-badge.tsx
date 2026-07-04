"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SpotPriceData {
  spotPrice: number | null
  source: string
  error?: string
}

interface SpotReferenceBadgeProps {
  p2pPrice: number | null
}

export function SpotReferenceBadge({ p2pPrice }: SpotReferenceBadgeProps) {
  const [data, setData] = useState<SpotPriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let attempt = 0
    const maxAttempts = 3

    async function fetchSpotPrice() {
      attempt++
      try {
        const response = await fetch("/api/spot-price")
        if (!response.ok) throw new Error("HTTP error")
        const result = await response.json()
        setData(result)
        setHasError(false)
      } catch {
        if (attempt < maxAttempts) {
          setTimeout(fetchSpotPrice, attempt * 1000)
        } else {
          setData({ spotPrice: null, source: "binance", error: "Fetch failed" })
          setHasError(true)
          setIsLoading(false)
        }
      } finally {
        if (attempt < maxAttempts) return
        setIsLoading(false)
      }
    }

    fetchSpotPrice()
    const interval = setInterval(fetchSpotPrice, 60000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !data || (data.spotPrice === null && !hasError) || p2pPrice === null) {
    return null
  }

  if (hasError) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>Spot: --</span>
      </div>
    )
  }

  const premium = ((p2pPrice - data.spotPrice) / data.spotPrice) * 100
  const isPositive = premium > 0
  const isNeutral = Math.abs(premium) < 0.01

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isNeutral
          ? "bg-muted text-muted-foreground"
          : isPositive
            ? "bg-green-500/10 text-green-600"
            : "bg-red-500/10 text-red-600"
      }`}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        Spot: {data.spotPrice.toFixed(2)} |{" "}
        {isNeutral ? "~" : isPositive ? "+" : ""}
        {premium.toFixed(2)}%
      </span>
    </div>
  )
}

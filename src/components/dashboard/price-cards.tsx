"use client"

import { useRef, useEffect } from "react"
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { P2PData } from "@/types"
import { formatVES, formatPercent } from "@/lib/formatters"

interface PriceCardsProps {
  sellData: P2PData | null
  buyData: P2PData | null
  isLoading: boolean
}

interface DeltaInfo {
  value: number
  percent: number
  isPositive: boolean
}

export function PriceCards({ sellData, buyData, isLoading }: PriceCardsProps) {
  const prevPricesRef = useRef<{ sell: number | null; buy: number | null }>({ sell: null, buy: null })

  const sellPrice = sellData
    ? parseFloat(sellData.priceStats.max.replace(/,/g, ""))
    : null
  const buyPrice = buyData
    ? parseFloat(buyData.priceStats.min.replace(/,/g, ""))
    : null
  const spread = sellPrice && buyPrice ? sellPrice - buyPrice : null

  const calculateDelta = (current: number | null, previous: number | null): DeltaInfo | null => {
    if (current === null || previous === null || previous === 0) return null
    const delta = current - previous
    const percent = (delta / previous) * 100
    return {
      value: delta,
      percent,
      isPositive: delta >= 0,
    }
  }

  const sellDelta = calculateDelta(sellPrice, prevPricesRef.current.sell)
  const buyDelta = calculateDelta(buyPrice, prevPricesRef.current.buy)

  useEffect(() => {
    if (sellPrice !== null) prevPricesRef.current.sell = sellPrice
    if (buyPrice !== null) prevPricesRef.current.buy = buyPrice
  }, [sellPrice, buyPrice])

  const cards = [
    {
      label: "Venta",
      sublabel: "Vender USDT",
      value: sellPrice,
      icon: ArrowDown,
      color: "green",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      textColor: "text-green-600",
      delta: sellDelta,
    },
    {
      label: "Compra",
      sublabel: "Comprar USDT",
      value: buyPrice,
      icon: ArrowUp,
      color: "blue",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-600",
      delta: buyDelta,
    },
    {
      label: "Spread",
      sublabel: "Diferencia",
      value: spread,
      icon: TrendingUp,
      color: "amber",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      textColor: "text-amber-600",
      delta: null,
    },
  ]

  if (isLoading && !sellData && !buyData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-28" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.label}
            className={`${card.borderColor} border-2 transition-all hover:shadow-md`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {card.sublabel}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.textColor}`} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">
                  {card.value !== null ? (
                    <>
                      {formatVES(card.value)}
                      {card.label === "Spread" && (
                        <span className="text-lg ml-1 text-muted-foreground">
                          VES
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </span>
                {card.delta && card.label !== "Spread" && (
                  <span
                    className={`text-sm font-medium px-2 py-0.5 rounded transition-colors duration-200 ${
                      card.delta.isPositive
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    {card.delta.isPositive ? "↑ +" : "↓ "}
                    {card.delta.percent.toFixed(1)}%
                  </span>
                )}
              </div>
<div className="flex items-center gap-1 mt-2">
                  {card.value !== null && sellData && buyData && (
                    <>
                      {card.label === "Venta" &&
                        (sellData.filterInfo?.usingAllAds ||
                          (sellData.filterInfo?.trimmedCount ?? 0) > 0) && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                            {sellData.filterInfo?.trimmedCount
                              ? `${sellData.filterInfo.trimmedCount} bots descartados`
                              : "Filtrando"}
                          </span>
                        )}
                      {card.label === "Compra" &&
                        (buyData.filterInfo?.trimmedCount ?? 0) > 0 && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                            {`${buyData.filterInfo!.trimmedCount} bots descartados`}
                          </span>
                        )}
                      {card.label === "Spread" && (
                        <span className="text-xs text-muted-foreground">
                          {((spread! / buyPrice!) * 100).toFixed(1)}% del precio
                        </span>
                      )}
                    </>
                  )}
                </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

"use client"

import { ArrowDown, ArrowUp, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { P2PData } from "@/types"
import { formatVES, formatPercent } from "@/lib/formatters"

interface PriceCardsProps {
  sellData: P2PData | null
  buyData: P2PData | null
  isLoading: boolean
}

export function PriceCards({ sellData, buyData, isLoading }: PriceCardsProps) {
  const sellPrice = sellData
    ? parseFloat(sellData.priceStats.max.replace(/,/g, ""))
    : null
  const buyPrice = buyData
    ? parseFloat(buyData.priceStats.min.replace(/,/g, ""))
    : null
  const spread = sellPrice && buyPrice ? sellPrice - buyPrice : null

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
              </div>
              <div className="flex items-center gap-1 mt-2">
                {card.value !== null && sellData && buyData && (
                  <>
                    {card.label === "Venta" && sellData.filterInfo?.usingAllAds && (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                        Filtrando
                      </span>
                    )}
                    {card.label === "Spread" && (
                      <span className="text-xs text-muted-foreground">
                        {buyPrice && buyPrice > 0 ? ((spread! / buyPrice!) * 100).toFixed(1) : '0'}% del precio
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

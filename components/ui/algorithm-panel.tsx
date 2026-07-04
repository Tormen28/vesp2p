"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Zap,
  Activity,
  BarChart3,
  Clock,
} from "lucide-react"
import type { AlgorithmMetrics } from "@/hooks/use-rates"

interface AlgorithmPanelProps {
  metrics: AlgorithmMetrics
  isLoading: boolean
}

function formatExchangeName(name: string): string {
  const names: Record<string, string> = {
    binancep2p: "Binance",
    okexp2p: "OKX",
    bybitp2p: "Bybit",
    bitgetp2p: "Bitget",
    bingxp2p: "BingX",
    mexcp2p: "MEXC",
    coinexp2p: "CoinEx",
    saldo: "Saldo",
  }
  return names[name] || name
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function AlgorithmPanel({ metrics, isLoading }: AlgorithmPanelProps) {
  if (isLoading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Análisis Algorítmico
          </CardTitle>
          <CardDescription>Datos calculados en tiempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = metrics.trend === "up" ? TrendingUp : metrics.trend === "down" ? TrendingDown : Minus
  const trendColor = metrics.trend === "up" ? "text-green-500" : metrics.trend === "down" ? "text-red-500" : "text-yellow-500"
  const trendLabel = metrics.trend === "up" ? "Subiendo" : metrics.trend === "down" ? "Bajando" : "Estable"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Análisis Algorítmico
        </CardTitle>
        <CardDescription>
          Basado en {metrics.movingAverage > 0 ? "20" : "0"} lecturas • Actualizado cada 60s
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span>Tendencia</span>
            </div>
            <div className={`flex items-center gap-2 text-2xl font-bold ${trendColor}`}>
              <TrendIcon className="h-5 w-5" />
              <span>{trendLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.trendStrength.toFixed(0)}% señales positivas
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span>Volatilidad</span>
            </div>
            <div className={`text-2xl font-bold ${
              metrics.volatility > 3 ? "text-red-500" :
              metrics.volatility > 1 ? "text-yellow-500" : "text-green-500"
            }`}>
              {metrics.volatility.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.volatility > 3 ? "Alta" : metrics.volatility > 1 ? "Media" : "Baja"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>Promedio (MA5)</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.movingAverage > 0 ? formatPrice(metrics.movingAverage) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">VES/USDT</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Activity className="h-4 w-4" />
              <span>Cambio</span>
            </div>
            <div className={`text-2xl font-bold ${
              metrics.priceChange > 0 ? "text-green-500" :
              metrics.priceChange < 0 ? "text-red-500" : ""
            }`}>
              {metrics.priceChange !== 0 ? (
                <>
                  {metrics.priceChange > 0 ? "+" : ""}
                  {metrics.priceChangePercent.toFixed(2)}%
                </>
              ) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs lectura anterior
            </p>
          </div>
        </div>

        {metrics.arbitrage && metrics.arbitrage.profitPercent > 0 && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Oportunidad de Arbitraje</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-700">
                Comprar en <strong>{formatExchangeName(metrics.arbitrage.buyExchange)}</strong>
              </span>
              <ArrowRight className="h-4 w-4 text-green-500" />
              <span className="text-green-700">
                Vender en <strong>{formatExchangeName(metrics.arbitrage.sellExchange)}</strong>
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-green-600">
                {formatPrice(metrics.arbitrage.buyPrice)} → {formatPrice(metrics.arbitrage.sellPrice)} VES
              </span>
              <span className="text-lg font-bold text-green-600">
                +{metrics.arbitrage.profitPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {(!metrics.arbitrage || metrics.arbitrage.profitPercent <= 0) && (
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              No hay oportunidad de arbitraje significativa en este momento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

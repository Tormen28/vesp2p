"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartCandlestick } from "lucide-react"
import { cn } from "@/lib/utils"

const GREEN = "#22c55e"
const RED = "#ef4444"
const GRID = "#374151"
const TEXT = "#9ca3af"

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface CandleChartProps {
  className?: string
}

const TIMEFRAMES = [
  { label: "5m", value: "5m" },
  { label: "10m", value: "10m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "8h", value: "8h" },
  { label: "24h", value: "24h" },
]

function formatTime(timestamp: number, tf: string): string {
  const d = new Date(timestamp)
  if (["24h", "8h"].includes(tf)) {
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" })
  }
  return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
}

function SimpleCandleChart({ candles, tf }: { candles: Candle[]; tf: string }) {
  if (candles.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Sin datos para esta temporalidad
      </div>
    )
  }

  const W = 800
  const H = 300
  const PAD = { top: 20, right: 60, bottom: 30, left: 10 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const allHighs = candles.map((c) => c.high)
  const allLows = candles.map((c) => c.low)
  const minP = Math.min(...allLows)
  const maxP = Math.max(...allHighs)
  const range = maxP - minP || 1
  const pad = range * 0.05
  const yMin = minP - pad
  const yMax = maxP + pad

  const candleW = Math.max(Math.floor(chartW / candles.length) * 0.6, 3)
  const gap = chartW / candles.length

  const scaleY = (price: number) =>
    PAD.top + chartH - ((price - yMin) / (yMax - yMin)) * chartH

  const gridLines = 5
  const gridPrices = Array.from({ length: gridLines }, (_, i) =>
    yMin + (i / (gridLines - 1)) * (yMax - yMin)
  )

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px]">
        {/* Grid lines */}
        {gridPrices.map((price, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={scaleY(price)}
              x2={W - PAD.right}
              y2={scaleY(price)}
              stroke={GRID}
              strokeDasharray="3 3"
              strokeWidth={0.5}
            />
            <text
              x={W - PAD.right + 5}
              y={scaleY(price) + 4}
              fill={TEXT}
              fontSize={10}
            >
              {price.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Candles */}
        {candles.map((candle, i) => {
          const x = PAD.left + i * gap + gap / 2
          const isGreen = candle.close >= candle.open
          const color = isGreen ? GREEN : RED

          const highY = scaleY(candle.high)
          const lowY = scaleY(candle.low)
          const openY = scaleY(candle.open)
          const closeY = scaleY(candle.close)
          const bodyTop = Math.min(openY, closeY)
          const bodyH = Math.max(Math.abs(closeY - openY), 1)

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={x - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={color}
                stroke={color}
                strokeWidth={0.5}
                rx={1}
              />
            </g>
          )
        })}

        {/* Time labels */}
        {candles.length <= 20 &&
          candles.map((candle, i) => {
            if (i % Math.max(1, Math.floor(candles.length / 8)) !== 0) return null
            const x = PAD.left + i * gap + gap / 2
            return (
              <text
                key={i}
                x={x}
                y={H - 5}
                fill={TEXT}
                fontSize={9}
                textAnchor="middle"
              >
                {formatTime(candle.time, tf)}
              </text>
            )
          })}
      </svg>
    </div>
  )
}

export function CandleChart({ className }: CandleChartProps) {
  const [timeframe, setTimeframe] = useState("1h")
  const [candles, setCandles] = useState<Candle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetch(`/api/candles?timeframe=${timeframe}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando velas")
        return res.json()
      })
      .then((data) => {
        setCandles(data.candles || [])
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [timeframe])

  const latest = candles.length > 0 ? candles[candles.length - 1] : null
  const first = candles.length > 0 ? candles[0] : null
  const change = latest && first && first.open > 0
    ? ((latest.close - first.open) / first.open) * 100
    : null

  if (isLoading && candles.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartCandlestick className="h-5 w-5" />
            Velas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartCandlestick className="h-5 w-5" />
            Velas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChartCandlestick className="h-5 w-5" />
              Velas
            </CardTitle>
            <CardDescription>
              {candles.length} velas - Intervalo {timeframe}
            </CardDescription>
          </div>
          {latest && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">
                {latest.close.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} VES
              </span>
              {change !== null && (
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded",
                    change >= 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeframe buttons */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                timeframe === tf.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <SimpleCandleChart candles={candles} tf={timeframe} />

        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Alcista (Cierre &gt; Apertura)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Bajista (Cierre &lt; Apertura)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

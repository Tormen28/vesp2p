"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartCandlestick, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const GREEN = "#22c55e"
const RED = "#ef4444"

interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
}

interface TooltipData {
  candle: Candle
  x: number
  y: number
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

function formatTime(timestamp: string, tf: string): string {
  const d = new Date(timestamp)
  if (["24h", "8h"].includes(tf)) {
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" })
  }
  return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
}

export function CandleChart({ className }: { className?: string }) {
  const [timeframe, setTimeframe] = useState("1h")
  const [candles, setCandles] = useState<Candle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [viewStart, setViewStart] = useState(0)
  const [viewEnd, setViewEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastMouseX = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetch(`/api/candles?timeframe=${timeframe}&limit=200`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando velas")
        return res.json()
      })
      .then((data) => {
        const c = data.candles || []
        setCandles(c)
        setViewStart(0)
        setViewEnd(c.length)
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

  const visibleCandles = useMemo(() => {
    return candles.slice(Math.max(0, viewStart), viewEnd)
  }, [candles, viewStart, viewEnd])

  const latest = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null
  const first = visibleCandles.length > 0 ? visibleCandles[0] : null
  const change = latest && first && first.open > 0
    ? ((latest.close - first.open) / first.open) * 100
    : null

  const zoomIn = useCallback(() => {
    const current = viewEnd - viewStart
    const step = Math.max(3, Math.floor(current * 0.2))
    const center = Math.floor((viewStart + viewEnd) / 2)
    const newStart = Math.max(0, center - step)
    const newEnd = Math.min(candles.length, center + step)
    if (newEnd - newStart >= 3) {
      setViewStart(newStart)
      setViewEnd(newEnd)
    }
  }, [viewStart, viewEnd, candles.length])

  const zoomOut = useCallback(() => {
    const current = viewEnd - viewStart
    const step = Math.max(3, Math.floor(current * 0.3))
    const center = Math.floor((viewStart + viewEnd) / 2)
    setViewStart(Math.max(0, center - step))
    setViewEnd(Math.min(candles.length, center + step))
  }, [viewStart, viewEnd, candles.length])

  const resetView = useCallback(() => {
    setViewStart(0)
    setViewEnd(candles.length)
  }, [candles.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) zoomIn()
      else zoomOut()
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [zoomIn, zoomOut])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMouseX.current = e.clientX
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const W = 800
    const PAD = 80
    const chartW = W - PAD
    const current = viewEnd - viewStart

    if (isDragging.current) {
      const dx = e.clientX - lastMouseX.current
      lastMouseX.current = e.clientX
      const candlePixels = chartW / current
      const candleDelta = Math.round(-dx / candlePixels)
      if (candleDelta !== 0) {
        const newStart = Math.max(0, Math.min(candles.length - current, viewStart + candleDelta))
        setViewStart(newStart)
        setViewEnd(newStart + current)
      }
      setTooltip(null)
      return
    }

    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    const gap = chartW / current
    const idx = Math.floor((mouseX - PAD / 2) / gap)
    if (idx >= 0 && idx < visibleCandles.length) {
      const c = visibleCandles[idx]
      const x = (PAD / 2) + idx * gap + gap / 2
      const allHighs = visibleCandles.map((v) => v.high)
      const allLows = visibleCandles.map((v) => v.low)
      const yMin = Math.min(...allLows) * 0.995
      const yMax = Math.max(...allHighs) * 1.005
      const chartH = 300
      const scaleY = (price: number) =>
        20 + (chartH - 40) - ((price - yMin) / (yMax - yMin)) * (chartH - 40)
      const y = scaleY(c.close)
      setTooltip({ candle: c, x: (x / W) * rect.width, y: (y / 320) * rect.height })
    } else {
      setTooltip(null)
    }
  }, [visibleCandles, viewStart, viewEnd, candles.length])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  if (isLoading && visibleCandles.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartCandlestick className="h-5 w-5" />
            Velas Japonesas
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
            Velas Japonesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-red-500">
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
              Velas Japonesas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {visibleCandles.length} de {candles.length} velas - Scroll para zoom, arrastrar para mover
            </p>
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
        {/* Timeframe + Zoom controls */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex gap-1">
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
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={zoomIn} className="p-1.5 rounded bg-muted hover:bg-muted/80" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={zoomOut} className="p-1.5 rounded bg-muted hover:bg-muted/80" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={resetView} className="p-1.5 rounded bg-muted hover:bg-muted/80" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {visibleCandles.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sin datos para esta temporalidad
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative select-none"
            style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove as any}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CandlestickSVG candles={visibleCandles} tf={timeframe} />
            {tooltip && (
              <div
                className="absolute z-50 pointer-events-none bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm"
                style={{
                  left: Math.min(tooltip.x, 600),
                  top: Math.max(tooltip.y - 130, 10),
                }}
              >
                <div className="text-gray-400 text-xs mb-1">
                  {formatTime(tooltip.candle.time, timeframe)}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-gray-400">Apertura:</span>
                  <span className="font-mono text-right">{tooltip.candle.open.toFixed(2)}</span>
                  <span className="text-gray-400">Maxima:</span>
                  <span className="font-mono text-right">{tooltip.candle.high.toFixed(2)}</span>
                  <span className="text-gray-400">Minima:</span>
                  <span className="font-mono text-right">{tooltip.candle.low.toFixed(2)}</span>
                  <span className="text-gray-400">Cierre:</span>
                  <span className={cn("font-mono text-right font-bold", tooltip.candle.close >= tooltip.candle.open ? "text-green-400" : "text-red-400")}>
                    {tooltip.candle.close.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Alcista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Bajista</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CandlestickSVG({
  candles,
  tf,
}: {
  candles: Candle[]
  tf: string
}) {
  const W = 800
  const H = 320
  const PAD = { top: 20, right: 70, bottom: 30, left: 10 }
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

  const candleW = Math.max(Math.floor(chartW / candles.length) * 0.6, 4)
  const gap = chartW / candles.length

  const scaleY = (price: number) =>
    PAD.top + chartH - ((price - yMin) / (yMax - yMin)) * chartH

  const gridLines = 6
  const gridPrices = Array.from({ length: gridLines }, (_, i) =>
    yMin + (i / (gridLines - 1)) * (yMax - yMin)
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px]">
      {/* Grid */}
      {gridPrices.map((price, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={scaleY(price)}
            x2={W - PAD.right}
            y2={scaleY(price)}
            stroke="#374151"
            strokeDasharray="3 3"
            strokeWidth={0.5}
          />
          <text x={W - PAD.right + 5} y={scaleY(price) + 4} fill="#9ca3af" fontSize={10}>
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
        const bodyH = Math.max(Math.abs(closeY - openY), 1.5)

        return (
          <g key={i}>
            <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth={1.5} />
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
      {candles.map((candle, i) => {
        const step = Math.max(1, Math.floor(candles.length / 10))
        if (i % step !== 0) return null
        const x = PAD.left + i * gap + gap / 2
        return (
          <text key={i} x={x} y={H - 5} fill="#9ca3af" fontSize={9} textAnchor="middle">
            {formatTime(candle.time, tf)}
          </text>
        )
      })}
    </svg>
  )
}

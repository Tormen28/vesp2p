"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface SnapshotRow {
  time: number
  buyPrice: number
  sellPrice: number
  spread: number
}

interface ChartDataPoint {
  time: string
  timestamp: number
  avg: number
  bestBid: number
  bestAsk: number
}

export function TrendChart() {
  const [history, setHistory] = useState<SnapshotRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewStart, setViewStart] = useState(0)
  const [viewEnd, setViewEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/history?limit=500", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setHistory(data.data)
          setViewEnd(data.data.length)
        } else {
          setError("No data")
        }
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message)
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [])

  const allData = useMemo((): ChartDataPoint[] => {
    return history.map((item: any) => ({
      time: new Date(item.time * 1000).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: item.time,
      avg: ((item.buyPrice ?? item.buyprice) + (item.sellPrice ?? item.sellprice)) / 2,
      bestBid: item.sellPrice ?? item.sellprice ?? 0,
      bestAsk: item.buyPrice ?? item.buyprice ?? 0,
    }))
  }, [history])

  const chartData = useMemo(() => {
    return allData.slice(Math.max(0, viewStart), viewEnd)
  }, [allData, viewStart, viewEnd])

  const minPrice = useMemo(() => {
    if (chartData.length === 0) return 0
    const allPrices = chartData.flatMap((d) => [d.bestBid, d.bestAsk, d.avg]).filter((p) => p > 0)
    return allPrices.length > 0 ? Math.min(...allPrices) * 0.995 : 0
  }, [chartData])

  const maxPrice = useMemo(() => {
    if (chartData.length === 0) return 0
    const allPrices = chartData.flatMap((d) => [d.bestBid, d.bestAsk, d.avg]).filter((p) => p > 0)
    return allPrices.length > 0 ? Math.max(...allPrices) * 1.005 : 0
  }, [chartData])

  const latestPrice = chartData.length > 0 ? chartData[chartData.length - 1].avg : null
  const firstPrice = chartData.length > 0 ? chartData[0].avg : null
  const priceChange = latestPrice && firstPrice ? latestPrice - firstPrice : null
  const priceChangePercent = latestPrice && firstPrice && firstPrice > 0
    ? ((latestPrice - firstPrice) / firstPrice) * 100
    : null

  const zoomIn = useCallback(() => {
    const current = viewEnd - viewStart
    const step = Math.max(5, Math.floor(current * 0.2))
    const center = Math.floor((viewStart + viewEnd) / 2)
    const newStart = Math.max(0, center - step)
    const newEnd = Math.min(allData.length, center + step)
    if (newEnd - newStart >= 5) {
      setViewStart(newStart)
      setViewEnd(newEnd)
    }
  }, [viewStart, viewEnd, allData.length])

  const zoomOut = useCallback(() => {
    const current = viewEnd - viewStart
    const step = Math.max(5, Math.floor(current * 0.3))
    const center = Math.floor((viewStart + viewEnd) / 2)
    setViewStart(Math.max(0, center - step))
    setViewEnd(Math.min(allData.length, center + step))
  }, [viewStart, viewEnd, allData.length])

  const resetView = useCallback(() => {
    setViewStart(0)
    setViewEnd(allData.length)
  }, [allData.length])

  const panLeft = useCallback(() => {
    const current = viewEnd - viewStart
    const step = Math.max(1, Math.floor(current * 0.15))
    setViewStart(Math.max(0, viewStart - step))
    setViewEnd(Math.max(current, viewEnd - step))
  }, [viewStart, viewEnd])

  const panRight = useCallback(() => {
    const current = viewEnd - viewStart
    const step = Math.max(1, Math.floor(current * 0.15))
    setViewStart(Math.min(allData.length - current, viewStart + step))
    setViewEnd(Math.min(allData.length, viewEnd + step))
  }, [viewStart, viewEnd, allData.length])

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
  }, [zoomIn, zoomOut])

  if (isLoading && chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencia USDT/VES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error && chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencia USDT/VES
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

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencia USDT/VES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Recopilando datos... ({chartData.length} lecturas)</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia USDT/VES
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {chartData.length} de {allData.length} lecturas - Scroll para zoom
            </p>
          </div>
          <div className="flex items-center gap-3">
            {latestPrice && (
              <span className="text-2xl font-bold">
                {latestPrice.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} VES
              </span>
            )}
            {priceChange !== null && priceChangePercent !== null && (
              <span
                className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${
                  priceChange >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChangePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Zoom/Pan controls */}
        <div className="flex items-center gap-1 mb-3">
          <button onClick={zoomIn} className="p-1.5 rounded bg-muted hover:bg-muted/80" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={zoomOut} className="p-1.5 rounded bg-muted hover:bg-muted/80" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={resetView} className="p-1.5 rounded bg-muted hover:bg-muted/80" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground ml-2">
            {viewStart + 1}-{viewEnd} de {allData.length}
          </span>
        </div>

        <div ref={containerRef} className="h-[300px] w-full" onWheel={handleWheel}>
          <LineChart data={chartData} width={800} height={300} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              domain={[minPrice, maxPrice]}
              tickFormatter={(value) => value.toFixed(0)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#e5e7eb",
              }}
              labelStyle={{ color: "#9ca3af" }}
              formatter={(value: number) => [`${value.toFixed(2)} VES`, ""]}
            />
            <Legend />
            <Line type="monotone" dataKey="bestBid" stroke="#22c55e" strokeWidth={2} dot={false} name="Mejor Compra" />
            <Line type="monotone" dataKey="bestAsk" stroke="#ef4444" strokeWidth={2} dot={false} name="Mejor Venta" />
            <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={false} name="Promedio" />
          </LineChart>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Mejor Compra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Mejor Venta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span>Promedio</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

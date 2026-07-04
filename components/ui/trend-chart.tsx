"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp } from "lucide-react"
import type { RatesResponse } from "@/hooks/use-rates"

interface TrendChartProps {
  history: RatesResponse[]
  isLoading: boolean
}

interface ChartDataPoint {
  time: string
  avg: number
  bestBid: number
  bestAsk: number
}

export function TrendChart({ history, isLoading }: TrendChartProps) {
  const chartData = useMemo((): ChartDataPoint[] => {
    return history.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avg: item.avgPrice,
      bestBid: item.bestBid?.price || 0,
      bestAsk: item.bestAsk?.price || 0,
    }))
  }, [history])

  const minPrice = useMemo(() => {
    if (chartData.length === 0) return 0
    const allPrices = chartData.flatMap((d) => [d.bestBid, d.bestAsk, d.avg])
    return Math.min(...allPrices) * 0.995
  }, [chartData])

  const maxPrice = useMemo(() => {
    if (chartData.length === 0) return 0
    const allPrices = chartData.flatMap((d) => [d.bestBid, d.bestAsk, d.avg])
    return Math.max(...allPrices) * 1.005
  }, [chartData])

  const latestPrice = history.length > 0 ? history[history.length - 1].avgPrice : null
  const firstPrice = history.length > 0 ? history[0].avgPrice : null
  const priceChange = latestPrice && firstPrice ? latestPrice - firstPrice : null
  const priceChangePercent = latestPrice && firstPrice && firstPrice > 0
    ? ((latestPrice - firstPrice) / firstPrice) * 100
    : null

  if (isLoading && chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencia
          </CardTitle>
          <CardDescription>Últimas {chartData.length} lecturas</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
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
            Tendencia
          </CardTitle>
          <CardDescription>
            {chartData.length === 0
              ? "Esperando datos..."
              : "Necesitas al menos 2 lecturas para ver la tendencia"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Recopilando datos... ({chartData.length}/{2} lecturas)</p>
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
            <CardDescription>
              Últimas {chartData.length} lecturas • Actualizado cada 60s
            </CardDescription>
          </div>

          {latestPrice && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">
                {latestPrice.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} VES
              </span>
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
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                domain={[minPrice, maxPrice]}
                tickFormatter={(value) => value.toFixed(0)}
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
                labelFormatter={(label) => `Hora: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bestBid"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Mejor Compra"
              />
              <Line
                type="monotone"
                dataKey="bestAsk"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Mejor Venta"
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Promedio"
              />
            </LineChart>
          </ResponsiveContainer>
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

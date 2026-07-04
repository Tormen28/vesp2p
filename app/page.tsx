"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/ui/dashboard-header"
import { ExchangeCard } from "@/components/ui/exchange-card"
import { TrendChart } from "@/components/ui/trend-chart"
import { AlertConfig } from "@/components/ui/alert-config"
import { AlgorithmPanel } from "@/components/ui/algorithm-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRates } from "@/hooks/use-rates"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Section = "overview" | "exchanges" | "trends" | "config"

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>("overview")
  const [alertCount] = useState(0)

  const {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    history,
    metrics,
  } = useRates()

  const renderSection = () => {
    switch (currentSection) {
      case "overview":
        return <OverviewSection data={data} isLoading={isLoading} error={error} history={history} metrics={metrics} />
      case "exchanges":
        return (
          <ExchangeCard
            rates={data?.rates || []}
            bestBid={data?.bestBid || null}
            bestAsk={data?.bestAsk || null}
            globalSpread={data?.globalSpread || 0}
            avgPrice={data?.avgPrice || 0}
            isLoading={isLoading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={refresh}
          />
        )
      case "trends":
        return <TrendChart history={history} isLoading={isLoading} />
      case "config":
        return (
          <AlertConfig
            currentSpread={data?.globalSpread}
            currentPrice={data?.avgPrice}
          />
        )
      default:
        return null
    }
  }

  return (
    <main className="container mx-auto p-4 py-6 space-y-6">
      <DashboardHeader
        onSectionChange={setCurrentSection}
        currentSection={currentSection}
        alertCount={alertCount}
      />

      {error && data?.rates.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <button
              onClick={refresh}
              className="self-start text-sm underline"
            >
              Reintentar
            </button>
          </AlertDescription>
        </Alert>
      )}

      {renderSection()}
    </main>
  )
}

interface OverviewSectionProps {
  data: ReturnType<typeof useRates>["data"]
  isLoading: boolean
  error: string | null
  history: ReturnType<typeof useRates>["history"]
  metrics: ReturnType<typeof useRates>["metrics"]
}

function OverviewSection({ data, isLoading, error, metrics }: OverviewSectionProps) {
  if (isLoading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const bestBid = data?.bestBid
  const bestAsk = data?.bestAsk
  const avgPrice = data?.avgPrice || 0
  const globalSpread = data?.globalSpread || 0

  const latestHistory = data
  const firstHistory = data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mejor Precio Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {bestAsk?.price.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "—"} VES
              </span>
            </div>
            {bestAsk && (
              <p className="text-xs text-muted-foreground mt-1">
                {bestAsk.exchange}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mejor Precio Venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">
                {bestBid?.price.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "—"} VES
              </span>
            </div>
            {bestBid && (
              <p className="text-xs text-muted-foreground mt-1">
                {bestBid.exchange}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spread Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{globalSpread.toFixed(2)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalSpread < 1 ? "Spread bajo" : globalSpread > 3 ? "Spread alto" : "Spread normal"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Exchanges Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data?.rates.length || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fuentes de datos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Precio Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {avgPrice.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} VES
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Actualización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-medium">
              {data?.timestamp
                ? new Date(data.timestamp).toLocaleTimeString("es-VE")
                : "—"}
            </span>
          </CardContent>
        </Card>
      </div>

      <AlgorithmPanel metrics={metrics} isLoading={isLoading} />

      <TrendChart history={data ? [data] : []} isLoading={isLoading} />
    </div>
  )
}

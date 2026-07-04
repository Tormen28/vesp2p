"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PriceStats {
  min: string
  max: string
  spread: string
}

interface P2PData {
  timestamp: string
  tradeType: string
  priceStats: PriceStats
  sampleSize: number
  filterInfo?: {
    minOrders: number
    usingAllAds: boolean
  }
}

interface PriceDisplayProps {
  data: P2PData | null
  isLoading: boolean
  type: "sell" | "buy"
}

export function PriceDisplay({ data, isLoading, type }: PriceDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm">Haz clic en el botón para obtener datos actualizados</p>
      </div>
    )
  }

  // Determinar colores según el tipo (compra/venta)
  const minColor = type === "sell" ? "text-green-600" : "text-blue-600"
  const maxColor = type === "sell" ? "text-green-800" : "text-blue-800"

  // Verificar si se están mostrando todos los anuncios (sin filtro de órdenes)
  const isShowingAllAds = data.filterInfo?.usingAllAds || false

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground mb-1">Precio Mínimo</p>
          <p className={`text-2xl font-bold ${minColor}`}>{data.priceStats.min} VES</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground mb-1">Precio Máximo</p>
          <p className={`text-2xl font-bold ${maxColor}`}>{data.priceStats.max} VES</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-sm text-muted-foreground mb-1">Diferencia (Spread)</p>
        <p className="text-xl font-semibold">{data.priceStats.spread} VES</p>
      </div>

      <div className="text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Actualizado:</span>
          <span>{formatDate(data.timestamp)}</span>
        </div>
        <div className="flex justify-between">
          <span>Anunciantes:</span>
          <span>
            {data.sampleSize} {isShowingAllAds ? "(todos)" : `con +${data.filterInfo?.minOrders || 500} órdenes`}
          </span>
        </div>
        {isShowingAllAds && (
          <div className="mt-2">
            <Badge variant="outline" className="w-full justify-center bg-yellow-50 text-xs">
              <Info className="h-3 w-3 mr-1" />
              No se encontraron anunciantes con +500 órdenes
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search, X, ArrowUpDown, Shield, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Advertiser {
  nickName: string
  userNo: string
  monthOrderCount: number
  monthFinishRate: number
  positiveRate: number
  userType: string
  isVerified: boolean
  proMerchant: boolean
  deviceType: string
}

interface Advertisement {
  advertiser: Advertiser
  price: number
  available: number
  limits: {
    min: number
    max: number
    minInUSDT: number
    maxInUSDT: number
  }
  payMethods: string[]
  orderCount: number
  completionRate: number
  averageTime: number
}

interface P2PData {
  advertisements: Advertisement[]
  filterInfo?: {
    minOrders: number
    totalCount: number
    verifiedCount: number
  }
}

interface AdvertisersTableProps {
  data: P2PData | null
  isLoading: boolean
  type: string
}

export function AdvertisersTable({ data, isLoading, type }: AdvertisersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAds, setFilteredAds] = useState<Advertisement[]>([])

  // Actualizar los anuncios filtrados cuando cambian los datos o el término de búsqueda
  useEffect(() => {
    if (!data || !data.advertisements) {
      setFilteredAds([])
      return
    }

    // Ordenar anuncios por precio:
    // - Para SELL (vender USDT): ordenar de mayor a menor (para obtener el mejor precio de venta)
    // - Para BUY (comprar USDT): ordenar de menor a mayor (para obtener el mejor precio de compra)
    const sortedAds = [...data.advertisements].sort((a, b) => {
      return type === "sell"
        ? b.price - a.price // Orden descendente para venta (mayor a menor)
        : a.price - b.price // Orden ascendente para compra (menor a mayor)
    })

    if (!searchTerm.trim()) {
      setFilteredAds(sortedAds)
      return
    }

    // Filtrar anuncios basados en el término de búsqueda
    const filtered = sortedAds.filter((ad) => {
      const searchTermLower = searchTerm.toLowerCase()

      // Buscar en el nombre del anunciante
      if (ad.advertiser.nickName.toLowerCase().includes(searchTermLower)) return true

      // Buscar en el precio
      if (ad.price.toString().includes(searchTermLower)) return true

      // Buscar en la cantidad disponible
      if (ad.available.toString().includes(searchTermLower)) return true

      // Buscar en los límites
      if (ad.limits.min.toString().includes(searchTermLower)) return true
      if (ad.limits.max.toString().includes(searchTermLower)) return true

      // Buscar en los métodos de pago
      if (ad.payMethods.some((method) => method.toLowerCase().includes(searchTermLower))) return true

      // Buscar en la tasa de finalización
      const completionRateStr = (ad.completionRate * 100).toFixed(1)
      if (completionRateStr.includes(searchTermLower)) return true

      // Buscar en el número de órdenes
      if (ad.orderCount.toString().includes(searchTermLower)) return true

      return false
    })

    setFilteredAds(filtered)
  }, [data, searchTerm, type])

  // Limpiar la búsqueda
  const clearSearch = () => {
    setSearchTerm("")
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!data || !data.advertisements || data.advertisements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles. Actualiza para ver anuncios.
      </div>
    )
  }

  // Determinar el mensaje de ordenamiento según el tipo
  const getSortMessage = () => {
    if (type === "sell") {
      return "Ordenado por mejor precio de venta (mayor a menor)"
    } else {
      return "Ordenado por mejor precio de compra (menor a mayor)"
    }
  }

  // Verificar si hay anuncios después de filtrar
  const noFilteredResults = filteredAds.length === 0

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Buscar por nombre, precio, método de pago..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={clearSearch}>
              <X className="h-4 w-4" />
              <span className="sr-only">Limpiar búsqueda</span>
            </Button>
          </div>
        )}
      </div>

      {/* Contador de resultados y mensaje de ordenamiento */}
      <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-muted-foreground">
        <div>
          {searchTerm ? (
            <span>
              Mostrando {filteredAds.length} de {data.advertisements.length} resultados para "{searchTerm}"
            </span>
          ) : (
            <span>
              Mostrando {filteredAds.length} anunciantes con más de {data.filterInfo?.minOrders || 500} órdenes
            </span>
          )}
        </div>
        <div className="flex items-center mt-1 sm:mt-0">
          <ArrowUpDown className="h-4 w-4 mr-1" />
          <span>{getSortMessage()}</span>
        </div>
      </div>

      {/* Tabla de anuncios */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anunciante</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="text-right">Límites (VES)</TableHead>
              <TableHead>Métodos de Pago</TableHead>
              <TableHead className="text-right">Órdenes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAds.length > 0 ? (
              filteredAds.map((ad, index) => (
                <TableRow key={`${ad.advertiser.userNo}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        {ad.advertiser.isVerified && <Shield className="h-3 w-3 text-green-600" />}
                        <span>{ad.advertiser.nickName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Award className="h-3 w-3 text-amber-600" />
                        <span>{ad.orderCount} órdenes</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(ad.price, "VES")}</TableCell>
                  <TableCell className="text-right">{ad.available.toFixed(2)} USDT</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span>Min: {formatCurrency(ad.limits.min, "VES")}</span>
                      <span>Max: {formatCurrency(ad.limits.max, "VES")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ad.payMethods.map((method, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-gray-800">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span>{ad.orderCount}</span>
                      <span className="text-xs text-muted-foreground">
                        {(ad.completionRate * 100).toFixed(1)}% completado
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  {searchTerm
                    ? `No se encontraron resultados para "${searchTerm}"`
                    : "No se encontraron anunciantes que cumplan con los criterios."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

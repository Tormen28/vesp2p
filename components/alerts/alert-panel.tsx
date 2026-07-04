"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell,
  BellRing,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import type { AlertThresholds } from "@/types"

interface AlertPanelProps {
  thresholds: AlertThresholds
  alerts: { type: string; condition: string; value: number; triggeredAt: Date | null }[]
  notificationsEnabled: boolean
  currentSellPrice: number | null
  currentBuyPrice: number | null
  currentSpread: number | null
  onUpdateThresholds: (thresholds: Partial<AlertThresholds>) => void
  onRequestPermission: () => Promise<boolean>
  onClearAlerts: () => void
  onClose?: () => void
}

export function AlertPanel({
  thresholds,
  alerts,
  notificationsEnabled,
  currentSellPrice,
  currentBuyPrice,
  currentSpread,
  onUpdateThresholds,
  onRequestPermission,
  onClearAlerts,
  onClose,
}: AlertPanelProps) {
  const [showSettings, setShowSettings] = useState(false)

  const priceLabels: Record<string, string> = {
    sell: "Venta",
    buy: "Compra",
    spread: "Spread",
  }

  const conditionLabels: Record<string, string> = {
    above: "supera",
    below: "cae por debajo de",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sistema de Alertas
            </CardTitle>
            <CardDescription>
              Configura notificaciones cuando los precios cambien
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {!notificationsEnabled ? (
              <Button variant="outline" size="sm" onClick={onRequestPermission}>
                <BellRing className="h-4 w-4 mr-2" />
                Activar
              </Button>
            ) : (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Notificaciones Activas
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              {thresholds.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showSettings && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="sellAbove">Venta por encima de</Label>
              <Input
                id="sellAbove"
                type="number"
                placeholder="VES"
                value={thresholds.sellPriceAbove ?? ""}
                onChange={(e) =>
                  onUpdateThresholds({
                    sellPriceAbove: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellBelow">Venta por debajo de</Label>
              <Input
                id="sellBelow"
                type="number"
                placeholder="VES"
                value={thresholds.sellPriceBelow ?? ""}
                onChange={(e) =>
                  onUpdateThresholds({
                    sellPriceBelow: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyAbove">Compra por encima de</Label>
              <Input
                id="buyAbove"
                type="number"
                placeholder="VES"
                value={thresholds.buyPriceAbove ?? ""}
                onChange={(e) =>
                  onUpdateThresholds({
                    buyPriceAbove: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyBelow">Compra por debajo de</Label>
              <Input
                id="buyBelow"
                type="number"
                placeholder="VES"
                value={thresholds.buyPriceBelow ?? ""}
                onChange={(e) =>
                  onUpdateThresholds({
                    buyPriceBelow: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spreadAbove">Spread mayor a</Label>
              <Input
                id="spreadAbove"
                type="number"
                placeholder="VES"
                value={thresholds.spreadAbove ?? ""}
                onChange={(e) =>
                  onUpdateThresholds({
                    spreadAbove: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  id="sound"
                  checked={thresholds.soundEnabled}
                  onCheckedChange={(checked) =>
                    onUpdateThresholds({ soundEnabled: checked })
                  }
                />
                <Label htmlFor="sound">Sonido</Label>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">Venta</p>
            <p className="text-xl font-bold text-green-700">
              {currentSellPrice ? `${currentSellPrice.toFixed(2)}` : "--"}
            </p>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Compra</p>
            <p className="text-xl font-bold text-blue-700">
              {currentBuyPrice ? `${currentBuyPrice.toFixed(2)}` : "--"}
            </p>
          </div>

          <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-600 mb-1">Spread</p>
            <p className="text-xl font-bold text-amber-700">
              {currentSpread ? `${currentSpread.toFixed(2)}` : "--"}
            </p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                Alertas Recientes
              </h4>
              <Button variant="ghost" size="sm" onClick={onClearAlerts}>
                Limpiar
              </Button>
            </div>

            {alerts.slice(0, 5).map((alert, index) => (
              <Alert
                key={index}
                variant={alert.condition === "above" ? "destructive" : "default"}
              >
                {alert.condition === "above" ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <AlertDescription>
                  <span className="font-medium">
                    {priceLabels[alert.type] || alert.type}
                  </span>{" "}
                  {conditionLabels[alert.condition] || alert.condition}{" "}
                  <span className="font-bold">{alert.value.toFixed(2)} VES</span>
                  {alert.triggeredAt && (
                    <span className="text-muted-foreground ml-2">
                      ({new Date(alert.triggeredAt).toLocaleTimeString()})
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {alerts.length === 0 && !showSettings && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Sin alertas</p>
            <p className="text-sm">Configura umbrales para recibir notificaciones</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

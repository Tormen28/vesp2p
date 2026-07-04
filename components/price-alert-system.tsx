"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell,
  BellRing,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
} from "lucide-react"

interface AlertThresholds {
  sellPriceAbove: number | null
  sellPriceBelow: number | null
  buyPriceAbove: number | null
  buyPriceBelow: number | null
  spreadAbove: number | null
  soundEnabled: boolean
}

interface PriceAlert {
  type: "sell" | "buy" | "spread"
  condition: "above" | "below"
  value: number
  triggered: boolean
  triggeredAt: Date | null
}

interface PriceAlertSystemProps {
  currentSellPrice: number | null
  currentBuyPrice: number | null
  currentSpread: number | null
}

export function PriceAlertSystem({
  currentSellPrice,
  currentBuyPrice,
  currentSpread,
}: PriceAlertSystemProps) {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    sellPriceAbove: null,
    sellPriceBelow: null,
    buyPriceAbove: null,
    buyPriceBelow: null,
    spreadAbove: null,
    soundEnabled: true,
  })

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showSettings, setShowSettings] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("price-alert-thresholds")
    if (saved) {
      try {
        setThresholds(JSON.parse(saved))
      } catch {
        // Ignore invalid JSON
      }
    }

    const notifPermission = localStorage.getItem("notifications-enabled")
    if (notifPermission === "true") {
      setNotificationsEnabled(true)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("price-alert-thresholds", JSON.stringify(thresholds))
  }, [thresholds])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true)
      localStorage.setItem("notifications-enabled", "true")
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setNotificationsEnabled(true)
        localStorage.setItem("notifications-enabled", "true")
        return true
      }
    }

    return false
  }

  // Play alert sound
  const playAlertSound = () => {
    if (!thresholds.soundEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch {
      // Audio not supported
    }
  }

  // Check alerts against current prices
  useEffect(() => {
    if (!currentSellPrice || !currentBuyPrice || !currentSpread) return

    const newAlerts: PriceAlert[] = []

    // Check sell price alerts
    if (thresholds.sellPriceAbove && currentSellPrice >= thresholds.sellPriceAbove) {
      newAlerts.push({
        type: "sell",
        condition: "above",
        value: thresholds.sellPriceAbove,
        triggered: true,
        triggeredAt: new Date(),
      })
    }
    if (thresholds.sellPriceBelow && currentSellPrice <= thresholds.sellPriceBelow) {
      newAlerts.push({
        type: "sell",
        condition: "below",
        value: thresholds.sellPriceBelow,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    // Check buy price alerts
    if (thresholds.buyPriceAbove && currentBuyPrice >= thresholds.buyPriceAbove) {
      newAlerts.push({
        type: "buy",
        condition: "above",
        value: thresholds.buyPriceAbove,
        triggered: true,
        triggeredAt: new Date(),
      })
    }
    if (thresholds.buyPriceBelow && currentBuyPrice <= thresholds.buyPriceBelow) {
      newAlerts.push({
        type: "buy",
        condition: "below",
        value: thresholds.buyPriceBelow,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    // Check spread alerts
    if (thresholds.spreadAbove && currentSpread >= thresholds.spreadAbove) {
      newAlerts.push({
        type: "spread",
        condition: "above",
        value: thresholds.spreadAbove,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    // Show notification and play sound for new alerts
    if (newAlerts.length > 0 && notificationsEnabled) {
      const latest = newAlerts[newAlerts.length - 1]
      const priceType = latest.type === "sell" ? "Venta" : latest.type === "buy" ? "Compra" : "Spread"
      const condition = latest.condition === "above" ? "supera" : "cae por debajo de"

      if (Notification.permission === "granted") {
        new Notification("Alerta de Precio VES", {
          body: `${priceType} ${condition} ${latest.value.toFixed(2)} VES`,
          icon: "/favicon.ico",
        })
      }

      playAlertSound()
    }

    setAlerts((prev) => [...newAlerts, ...prev].slice(0, 10))
  }, [currentSellPrice, currentBuyPrice, currentSpread, thresholds, notificationsEnabled])

  const clearAlerts = () => setAlerts([])

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sistema de Alertas
            </CardTitle>
            <CardDescription>
              Configura notificaciones cuando los precios crucen tus umbrales
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {notificationsEnabled ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Notificaciones Activas
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                <BellRing className="h-4 w-4 mr-2" />
                Activar Notificaciones
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              {thresholds.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Alert Settings */}
        {showSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="sellAbove">Precio Venta por encima de (VES)</Label>
              <Input
                id="sellAbove"
                type="number"
                placeholder="Ej: 50.00"
                value={thresholds.sellPriceAbove ?? ""}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    sellPriceAbove: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellBelow">Precio Venta por debajo de (VES)</Label>
              <Input
                id="sellBelow"
                type="number"
                placeholder="Ej: 45.00"
                value={thresholds.sellPriceBelow ?? ""}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    sellPriceBelow: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyAbove">Precio Compra por encima de (VES)</Label>
              <Input
                id="buyAbove"
                type="number"
                placeholder="Ej: 48.00"
                value={thresholds.buyPriceAbove ?? ""}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    buyPriceAbove: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyBelow">Precio Compra por debajo de (VES)</Label>
              <Input
                id="buyBelow"
                type="number"
                placeholder="Ej: 40.00"
                value={thresholds.buyPriceBelow ?? ""}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    buyPriceBelow: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spreadAbove">Spread mayor a (VES)</Label>
              <Input
                id="spreadAbove"
                type="number"
                placeholder="Ej: 5.00"
                value={thresholds.spreadAbove ?? ""}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    spreadAbove: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="flex items-end space-x-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sound"
                  checked={thresholds.soundEnabled}
                  onCheckedChange={(checked) =>
                    setThresholds({ ...thresholds, soundEnabled: checked })
                  }
                />
                <Label htmlFor="sound">Sonido</Label>
              </div>
            </div>
          </div>
        )}

        {/* Current Prices */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">Precio Venta</p>
            <p className="text-2xl font-bold text-green-700">
              {currentSellPrice ? `${currentSellPrice.toFixed(2)} VES` : "-"}
            </p>
            {thresholds.sellPriceAbove && currentSellPrice && currentSellPrice >= thresholds.sellPriceAbove && (
              <Badge className="mt-2 bg-green-500">Alerta activa</Badge>
            )}
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Precio Compra</p>
            <p className="text-2xl font-bold text-blue-700">
              {currentBuyPrice ? `${currentBuyPrice.toFixed(2)} VES` : "-"}
            </p>
            {thresholds.buyPriceBelow && currentBuyPrice && currentBuyPrice <= thresholds.buyPriceBelow && (
              <Badge className="mt-2 bg-blue-500">Alerta activa</Badge>
            )}
          </div>

          <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-600 mb-1">Spread</p>
            <p className="text-2xl font-bold text-amber-700">
              {currentSpread ? `${currentSpread.toFixed(2)} VES` : "-"}
            </p>
            {thresholds.spreadAbove && currentSpread && currentSpread >= thresholds.spreadAbove && (
              <Badge className="mt-2 bg-amber-500">Spread alto</Badge>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                Alertas Recientes
              </h4>
              <Button variant="ghost" size="sm" onClick={clearAlerts}>
                Limpiar
              </Button>
            </div>

            {alerts.map((alert, index) => {
              const icon = alert.condition === "above" ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-green-500" />
              const typeLabel = alert.type === "sell" ? "Venta" : alert.type === "buy" ? "Compra" : "Spread"

              return (
                <Alert key={index} variant={alert.condition === "above" ? "destructive" : "default"}>
                  {icon}
                  <AlertDescription>
                    <span className="font-medium">{typeLabel}</span>{" "}
                    {alert.condition === "above" ? "supera" : "cae por debajo de"}{" "}
                    <span className="font-bold">{alert.value.toFixed(2)} VES</span>
                    {alert.triggeredAt && (
                      <span className="text-muted-foreground ml-2">
                        ({alert.triggeredAt.toLocaleTimeString()})
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )
            })}
          </div>
        )}

        {alerts.length === 0 && !showSettings && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Sin alertas configuradas</p>
            <p className="text-sm">Configura tus umbrales para recibir notificaciones cuando los precios cambien</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

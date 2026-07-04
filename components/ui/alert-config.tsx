"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff, Save, RotateCcw } from "lucide-react"

interface AlertThresholds {
  minSpread: number
  maxSpread: number
  priceChangePercent: number
}

interface AlertConfigProps {
  currentSpread?: number
  currentPrice?: number
}

const STORAGE_KEY = "vesp2p-alert-config"

const DEFAULT_THRESHOLDS: AlertThresholds = {
  minSpread: 0.5,
  maxSpread: 5,
  priceChangePercent: 3,
}

export function AlertConfig({ currentSpread, currentPrice }: AlertConfigProps) {
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setThresholds(parsed.thresholds || DEFAULT_THRESHOLDS)
        setNotificationsEnabled(parsed.enabled || false)
      } catch {
        console.error("Failed to parse stored config")
      }
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        thresholds,
        enabled: notificationsEnabled,
      })
    )
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          setNotificationsEnabled(true)
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ thresholds, enabled: true })
          )
        }
      }
    } else {
      setNotificationsEnabled(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationsEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          Configuración de Alertas
        </CardTitle>
        <CardDescription>
          Configura los umbrales para recibir notificaciones cuando el mercado cambie
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Notificaciones del navegador</Label>
            <p className="text-sm text-muted-foreground">
              Recibir alertas cuando se cumplan las condiciones
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationToggle}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minSpread">Spread mínimo (%)</Label>
            <Input
              id="minSpread"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={thresholds.minSpread}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  minSpread: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Alertar cuando el spread global baje de este valor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxSpread">Spread máximo (%)</Label>
            <Input
              id="maxSpread"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={thresholds.maxSpread}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  maxSpread: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Alertar cuando el spread global suba de este valor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceChange">Cambio de precio (%)</Label>
            <Input
              id="priceChange"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={thresholds.priceChangePercent}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  priceChangePercent: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Alertar cuando el precio cambie más de este porcentaje en el período
            </p>
          </div>
        </div>

        {currentSpread !== undefined && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Valores actuales:</div>
            <div className="flex gap-4 mt-2">
              <div>
                <span className="text-2xl font-bold">{currentSpread.toFixed(2)}%</span>
                <span className="text-sm text-muted-foreground ml-1">Spread actual</span>
              </div>
              {currentPrice && (
                <div>
                  <span className="text-2xl font-bold">
                    {currentPrice.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">VES/USDT</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            {saved ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

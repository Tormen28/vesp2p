"use client"

import { useState, useEffect, useCallback } from "react"
import type { AlertThresholds, PriceAlert } from "@/types"
import { AlertService } from "@/services/alert.service"

interface UseAlertsResult {
  thresholds: AlertThresholds
  alerts: PriceAlert[]
  notificationsEnabled: boolean
  updateThresholds: (thresholds: Partial<AlertThresholds>) => void
  requestPermission: () => Promise<boolean>
  clearAlerts: () => void
  checkCurrentPrices: (
    sellPrice: number | null,
    buyPrice: number | null,
    spread: number | null
  ) => void
}

export function useAlerts(): UseAlertsResult {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    sellPriceAbove: null,
    sellPriceBelow: null,
    buyPriceAbove: null,
    buyPriceBelow: null,
    spreadAbove: null,
    soundEnabled: true,
  })

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    const loaded = AlertService.loadThresholds()
    setThresholds(loaded)

    const notifEnabled =
      localStorage.getItem("notifications-enabled") === "true"
    setNotificationsEnabled(notifEnabled)
  }, [])

  const updateThresholds = useCallback((newThresholds: Partial<AlertThresholds>) => {
    setThresholds((prev) => {
      const updated = { ...prev, ...newThresholds }
      AlertService.saveThresholds(updated)
      return updated
    })
  }, [])

  const requestPermission = useCallback(async () => {
    const granted = await AlertService.requestNotificationPermission()
    setNotificationsEnabled(granted)
    return granted
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const checkCurrentPrices = useCallback(
    (
      sellPrice: number | null,
      buyPrice: number | null,
      spread: number | null
    ) => {
      const newAlerts = AlertService.checkAlerts(
        thresholds,
        sellPrice,
        buyPrice,
        spread
      )

      if (newAlerts.length > 0 && notificationsEnabled) {
        const latest = newAlerts[newAlerts.length - 1]
        const typeLabel =
          latest.type === "sell"
            ? "Venta"
            : latest.type === "buy"
              ? "Compra"
              : "Spread"
        const condition = latest.condition === "above" ? "supera" : "cae por debajo de"

        AlertService.sendNotification(
          "Alerta de Precio VES",
          `${typeLabel} ${condition} ${latest.value.toFixed(2)} VES`
        )

        if (thresholds.soundEnabled) {
          AlertService.playAlertSound()
        }
      }

      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 10))
    },
    [thresholds, notificationsEnabled]
  )

  return {
    thresholds,
    alerts,
    notificationsEnabled,
    updateThresholds,
    requestPermission,
    clearAlerts,
    checkCurrentPrices,
  }
}

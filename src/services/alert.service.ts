import type { AlertThresholds, PriceAlert } from "@/types"
import { STORAGE_KEYS } from "@/lib/constants"

export class AlertService {
  static loadThresholds(): AlertThresholds {
    if (typeof window === "undefined") {
      return {
        sellPriceAbove: null,
        sellPriceBelow: null,
        buyPriceAbove: null,
        buyPriceBelow: null,
        spreadAbove: null,
        soundEnabled: true,
      }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.ALERT_THRESHOLDS)
    if (!saved) {
      return {
        sellPriceAbove: null,
        sellPriceBelow: null,
        buyPriceAbove: null,
        buyPriceBelow: null,
        spreadAbove: null,
        soundEnabled: true,
      }
    }

    try {
      return JSON.parse(saved)
    } catch {
      return {
        sellPriceAbove: null,
        sellPriceBelow: null,
        buyPriceAbove: null,
        buyPriceBelow: null,
        spreadAbove: null,
        soundEnabled: true,
      }
    }
  }

  static saveThresholds(thresholds: AlertThresholds): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.ALERT_THRESHOLDS, JSON.stringify(thresholds))
  }

  static checkAlerts(
    thresholds: AlertThresholds,
    currentSellPrice: number | null,
    currentBuyPrice: number | null,
    currentSpread: number | null
  ): PriceAlert[] {
    const alerts: PriceAlert[] = []

    if (currentSellPrice === null || currentBuyPrice === null || currentSpread === null) {
      return alerts
    }

    if (thresholds.sellPriceAbove && currentSellPrice >= thresholds.sellPriceAbove) {
      alerts.push({
        type: "sell",
        condition: "above",
        value: thresholds.sellPriceAbove,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    if (thresholds.sellPriceBelow && currentSellPrice <= thresholds.sellPriceBelow) {
      alerts.push({
        type: "sell",
        condition: "below",
        value: thresholds.sellPriceBelow,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    if (thresholds.buyPriceAbove && currentBuyPrice >= thresholds.buyPriceAbove) {
      alerts.push({
        type: "buy",
        condition: "above",
        value: thresholds.buyPriceAbove,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    if (thresholds.buyPriceBelow && currentBuyPrice <= thresholds.buyPriceBelow) {
      alerts.push({
        type: "buy",
        condition: "below",
        value: thresholds.buyPriceBelow,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    if (thresholds.spreadAbove && currentSpread >= thresholds.spreadAbove) {
      alerts.push({
        type: "spread",
        condition: "above",
        value: thresholds.spreadAbove,
        triggered: true,
        triggeredAt: new Date(),
      })
    }

    return alerts
  }

  static playAlertSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
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

  static async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false

    if (Notification.permission === "granted") {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, "true")
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, "true")
        return true
      }
    }

    return false
  }

  static sendNotification(title: string, body: string): void {
    if (Notification.permission === "granted") {
      new Notification(title, { body })
    }
  }
}

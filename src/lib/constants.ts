export const BINANCE_P2P_URL = "https://www.binance.com/bapi/c2c/v1/public/c2c/agent/ad-list"

export const FIAT = "VES"
export const ASSET = "USDT"

export const DEFAULT_MIN_ORDERS = 500
export const DEFAULT_MIN_USDT_LIQUIDITY = 50
export const DEFAULT_MAX_PAGES = 1

export const INTERVAL_MS: Record<string, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
}

export const STORAGE_KEYS = {
  ALERT_THRESHOLDS: "price-alert-thresholds",
  NOTIFICATIONS_ENABLED: "notifications-enabled",
  THEME: "theme",
} as const

export const API_ENDPOINTS = {
  BINANCE_P2P: "/api/binance-p2p",
  HISTORY: "/api/history",
  CRON: "/api/cron",
} as const

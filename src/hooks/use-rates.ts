"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"

export interface ExchangeRate {
  name: string
  ask: number
  bid: number
  spread: number
  spreadAbs: number
}

export interface RatesResponse {
  timestamp: number
  rates: ExchangeRate[]
  bestBid: { exchange: string; price: number } | null
  bestAsk: { exchange: string; price: number } | null
  globalSpread: number
  avgPrice: number
  source: string
  error?: string
}

export interface AlgorithmMetrics {
  arbitrage: {
    buyExchange: string
    sellExchange: string
    buyPrice: number
    sellPrice: number
    profitPercent: number
  } | null
  trend: "up" | "down" | "stable"
  trendStrength: number
  movingAverage: number
  volatility: number
  priceChange: number
  priceChangePercent: number
}

interface UseRatesResult {
  data: RatesResponse | null
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
  history: RatesResponse[]
  metrics: AlgorithmMetrics
}

const POLL_INTERVAL = 60000
const MAX_HISTORY = 20

function calculateMetrics(history: RatesResponse[], currentData: RatesResponse | null): AlgorithmMetrics {
  const prices = history.map(h => h.avgPrice)

  const arbitrage = currentData ? findArbitrage(currentData.rates) : null

  const trend = calculateTrend(prices)
  const trendStrength = calculateTrendStrength(prices)
  const movingAverage = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const volatility = calculateVolatility(prices)

  let priceChange = 0
  let priceChangePercent = 0
  if (prices.length >= 2) {
    const previous = prices[prices.length - 2]
    const current = prices[prices.length - 1]
    priceChange = current - previous
    priceChangePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  return {
    arbitrage,
    trend,
    trendStrength,
    movingAverage,
    volatility,
    priceChange,
    priceChangePercent,
  }
}

function findArbitrage(rates: ExchangeRate[]): AlgorithmMetrics["arbitrage"] | null {
  if (rates.length < 2) return null

  let bestBuy: ExchangeRate | null = null
  let bestSell: ExchangeRate | null = null
  let maxProfit = 0

  for (const rate of rates) {
    if (rate.bid > 0) {
      for (const other of rates) {
        if (other.name !== rate.name && other.ask > 0) {
          const profit = ((rate.bid - other.ask) / other.ask) * 100
          if (profit > maxProfit) {
            maxProfit = profit
            bestBuy = other
            bestSell = rate
          }
        }
      }
    }
  }

  if (bestBuy && bestSell && maxProfit > 0) {
    return {
      buyExchange: bestBuy.name,
      sellExchange: bestSell.name,
      buyPrice: bestBuy.ask,
      sellPrice: bestSell.bid,
      profitPercent: Math.round(maxProfit * 100) / 100,
    }
  }

  return null
}

function calculateTrend(prices: number[]): "up" | "down" | "stable" {
  if (prices.length < 3) return "stable"

  const recent = prices.slice(-5)
  const first = recent[0]
  const last = recent[recent.length - 1]
  const change = ((last - first) / first) * 100

  if (change > 0.5) return "up"
  if (change < -0.5) return "down"
  return "stable"
}

function calculateTrendStrength(prices: number[]): number {
  if (prices.length < 3) return 0

  const recent = prices.slice(-5)
  const rises = recent.filter((p, i) => i > 0 && p > recent[i - 1]).length
  return (rises / (recent.length - 1)) * 100
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 3) return 0

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length
  const squaredDiffs = prices.map(p => Math.pow(p - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length
  const stdDev = Math.sqrt(variance)

  return Math.round((stdDev / mean) * 10000) / 100
}

export function useRates(): UseRatesResult {
  const [data, setData] = useState<RatesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [history, setHistory] = useState<RatesResponse[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch("/api/rates")
      const result: RatesResponse = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setData(result)
        setError(null)
        setLastUpdated(new Date())
        setHistory((prev) => {
          const newHistory = [...prev, result]
          if (newHistory.length > MAX_HISTORY) {
            return newHistory.slice(-MAX_HISTORY)
          }
          return newHistory
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    setIsLoading(true)
    fetchRates()
  }, [fetchRates])

  useEffect(() => {
    fetchRates()

    intervalRef.current = setInterval(fetchRates, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchRates])

  const metrics = useMemo(() => calculateMetrics(history, data), [history, data])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    history,
    metrics,
  }
}

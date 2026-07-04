"use client"

import { useState, useEffect, useCallback } from "react"
import type { P2PData, ChartSnapshot } from "@/types"

interface UseMarketDataResult {
  sellData: P2PData | null
  buyData: P2PData | null
  isLoadingSell: boolean
  isLoadingBuy: boolean
  error: string | null
  lastUpdated: string | null
  refresh: () => void
}

export function useMarketData(): UseMarketDataResult {
  const [sellData, setSellData] = useState<P2PData | null>(null)
  const [buyData, setBuyData] = useState<P2PData | null>(null)
  const [isLoadingSell, setIsLoadingSell] = useState(false)
  const [isLoadingBuy, setIsLoadingBuy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchSellData = useCallback(async () => {
    setIsLoadingSell(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/binance-p2p?tradeType=SELL&t=${timestamp}&retry=${retryCount}`
      )
      const data = await response.json()

      if (response.ok) {
        setSellData(data)
        setError(null) // Clear error only on successful fetch
      } else {
        setError(data.error || "Error al obtener datos de venta")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setIsLoadingSell(false)
    }
  }, [retryCount])

  const fetchBuyData = useCallback(async () => {
    setIsLoadingBuy(true)
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/binance-p2p?tradeType=BUY&t=${timestamp}&retry=${retryCount}`
      )
      const data = await response.json()

      if (response.ok) {
        setBuyData(data)
        setError(null) // Clear error only on successful fetch
      } else {
        setError(data.error || "Error al obtener datos de compra")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setIsLoadingBuy(false)
    }
  }, [retryCount])

  const refresh = useCallback(() => {
    setIsLoadingSell(true)
    setIsLoadingBuy(true)
    setRetryCount((prev) => prev + 1)
    setLastUpdated(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    fetchSellData()
    fetchBuyData()
  }, [fetchSellData, fetchBuyData])

  return {
    sellData,
    buyData,
    isLoadingSell,
    isLoadingBuy,
    error,
    lastUpdated,
    refresh,
  }
}

interface UseHistoryDataResult {
  data: ChartSnapshot[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useHistoryData(limit: number = 1000): UseHistoryDataResult {
  const [data, setData] = useState<ChartSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/history?limit=${limit}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, isLoading, error, refresh }
}

import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"

interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface SpotKlinesResponse {
  data: KlineData[]
  source: string
  symbol: string
  error?: string
}

export async function GET(): Promise<NextResponse<SpotKlinesResponse>> {
  try {
    const symbol = "BTCUSDT"
    const interval = "1h"
    const limit = 100

    const url = `${BINANCE_KLINES_URL}?symbol=${symbol}&interval=${interval}&limit=${limit}`

    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          data: [],
          source: "binance",
          symbol: "BTCUSDT",
          error: "Symbol not available",
        })
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const rawData = await response.json()

    if (!Array.isArray(rawData)) {
      return NextResponse.json({
        data: [],
        source: "binance",
        symbol: "BTCUSDT",
        error: "Invalid data format",
      })
    }

    const klines: KlineData[] = rawData.map((item: (string | number)[]) => ({
      time: Math.floor(Number(item[0]) / 1000),
      open: Number.parseFloat(String(item[1])),
      high: Number.parseFloat(String(item[2])),
      low: Number.parseFloat(String(item[3])),
      close: Number.parseFloat(String(item[4])),
    }))

    return NextResponse.json({
      data: klines,
      source: "binance",
      symbol: "BTCUSDT",
    })
  } catch (error) {
    console.error("Error fetching klines:", error)
    return NextResponse.json({
      data: [],
      source: "binance",
      symbol: "BTCUSDT",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

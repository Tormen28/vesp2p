import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price"

interface SpotPriceResponse {
  spotPrice: number | null
  source: string
  error?: string
}

export async function GET(): Promise<NextResponse<SpotPriceResponse>> {
  try {
    const response = await fetch(
      `${BINANCE_TICKER_URL}?symbol=USDTVES`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          spotPrice: null,
          source: "binance",
          error: "Pair not available",
        })
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const price = Number.parseFloat(data.price)

    if (Number.isNaN(price)) {
      return NextResponse.json({
        spotPrice: null,
        source: "binance",
        error: "Invalid price data",
      })
    }

    return NextResponse.json({
      spotPrice: price,
      source: "binance",
    })
  } catch (error) {
    console.error("Error fetching spot price:", error)
    return NextResponse.json({
      spotPrice: null,
      source: "binance",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

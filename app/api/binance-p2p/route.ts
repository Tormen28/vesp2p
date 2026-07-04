import { NextResponse } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

interface MarketSnapshotRow {
  id: number
  timestamp: string
  buyPrice: number
  sellPrice: number
  spread: number
  medianBuy: number
  medianSell: number
  q1Buy: number
  q3Buy: number
  q1Sell: number
  q3Sell: number
  trimmedAds: number
  volume: number | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradeType = searchParams.get("tradeType") || "SELL"

    const { env } = getCloudflareContext()
    const SUPABASE_URL = env.SUPABASE_URL as string
    const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY as string

    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing env vars" },
        { status: 500 }
      )
    }

    // Leer último snapshot de Supabase
    const url = new URL(`${SUPABASE_URL}/rest/v1/MarketSnapshot`)
    url.searchParams.set("select", "*")
    url.searchParams.set("order", "timestamp.desc")
    url.searchParams.set("limit", "1")

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Supabase REST error ${response.status}: ${errorText}`)
    }

    const rows = await response.json() as MarketSnapshotRow[]
    const snapshot = rows?.[0]

    if (!snapshot) {
      return NextResponse.json(
        { error: "No hay datos recientes. El cron se ejecuta cada 5 min." },
        { status: 503 }
      )
    }

    const isBuy = tradeType === "BUY"
    const median = isBuy ? snapshot.medianBuy : snapshot.medianSell
    const q1 = isBuy ? snapshot.q1Buy : snapshot.q1Sell
    const q3 = isBuy ? snapshot.q3Buy : snapshot.q3Sell

    return NextResponse.json({
      timestamp: snapshot.timestamp,
      tradeType,
      priceStats: {
        min: q1.toFixed(2),
        max: q3.toFixed(2),
        median: median.toFixed(2),
        spread: snapshot.spread.toFixed(2),
      },
      sampleSize: 0,
      filterInfo: {
        minOrders: 0,
        totalCount: 0,
        verifiedCount: 0,
        usingAllAds: false,
        totalAdsFound: 0,
        trimmedCount: snapshot.trimmedAds,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Error en /api/binance-p2p:", msg)
    return NextResponse.json(
      { error: "Error interno", detail: msg },
      { status: 500 }
    )
  }
}

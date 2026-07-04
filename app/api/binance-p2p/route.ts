import { NextResponse } from "next/server"
import { supabaseRest } from "@/lib/supabase"

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

    // Leer último snapshot de Supabase (poblado por GH Actions cada 5 min)
    const rows = await supabaseRest<MarketSnapshotRow[]>("MarketSnapshot", {
      method: "GET",
      query: {
        select: "*",
        order: "timestamp.desc",
        limit: "1",
      },
    })

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
    const price = isBuy ? snapshot.buyPrice : snapshot.sellPrice

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
    console.error("Error en /api/binance-p2p:", err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    )
  }
}
import { NextResponse } from "next/server"
import { BinanceService } from "@/services/binance.client"
import type { TradeType } from "@/types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tradeTypeParam = searchParams.get("tradeType") || "SELL"
    
    if (tradeTypeParam !== "BUY" && tradeTypeParam !== "SELL") {
      return NextResponse.json({ error: "tradeType must be BUY or SELL" }, { status: 400 })
    }
    
    const tradeType = tradeTypeParam as TradeType

    const data = await BinanceService.fetchP2PData({ tradeType })

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Error en /api/binance-p2p:", error instanceof Error ? error.message : String(error))
    const message = error instanceof Error ? error.message : "Error al procesar la solicitud"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

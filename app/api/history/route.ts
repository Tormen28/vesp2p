import { NextResponse } from "next/server"
import { ScraperService } from "@/services/scraper.service"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "1000") || 1000, 1), 10000)

    const snapshots = await ScraperService.getHistory(limit)

    const chartData = snapshots.map((snap) => ({
      time: Math.floor(snap.timestamp.getTime() / 1000),
      buyPrice: snap.buyPrice,
      sellPrice: snap.sellPrice,
      spread: snap.spread,
      volume: snap.volume,
    }))

    return NextResponse.json({ success: true, data: chartData })
  } catch (error: unknown) {
    console.error("Error en /api/history:", error)
    const message = error instanceof Error ? error.message : "Error obteniendo el historial"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

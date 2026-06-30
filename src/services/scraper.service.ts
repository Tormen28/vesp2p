import { supabaseRest } from "@/lib/supabase"
import { BinanceService } from "./binance.client"
import { cleanPrices } from "@/lib/price-stats"

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000

export interface MarketSnapshotRow {
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

export class ScraperService {
  static roundTimestampToBucket(date: Date = new Date()): string {
    const bucket = Math.floor(date.getTime() / SNAPSHOT_INTERVAL_MS) * SNAPSHOT_INTERVAL_MS
    return new Date(bucket).toISOString()
  }

  static async saveSnapshot() {
    const [snapshot, sellData, buyData] = await Promise.all([
      BinanceService.fetchSimpleSnapshot(),
      BinanceService.fetchP2PData({ tradeType: "SELL", maxPages: 2 }),
      BinanceService.fetchP2PData({ tradeType: "BUY", maxPages: 2 }),
    ])

    const sellPrices = sellData.advertisements.map((ad) => ad.price)
    const buyPrices = buyData.advertisements.map((ad) => ad.price)
    const sellStats = cleanPrices(sellPrices)
    const buyStats = cleanPrices(buyPrices)

    const timestamp = this.roundTimestampToBucket()

    const payload = {
      timestamp,
      buyPrice: snapshot.buyPrice,
      sellPrice: snapshot.sellPrice,
      spread: snapshot.spread,
      medianBuy: buyStats.median,
      medianSell: sellStats.median,
      q1Buy: buyStats.q1,
      q3Buy: buyStats.q3,
      q1Sell: sellStats.q1,
      q3Sell: sellStats.q3,
      trimmedAds: sellStats.trimmedCount + buyStats.trimmedCount,
      volume: 0,
    }

    await supabaseRest<MarketSnapshotRow[]>("MarketSnapshot", {
      method: "POST",
      body: payload,
      query: { on_conflict: "timestamp" },
      prefer: "resolution=merge-duplicates",
    })

    const trimmed = sellStats.trimmedCount + buyStats.trimmedCount
    console.log(
      `[Scraper] Snapshot upserted: Buy=${snapshot.buyPrice}, Sell=${snapshot.sellPrice}, Spread=${snapshot.spread}, trimmedAds=${trimmed}`
    )

    return { success: true, ...snapshot, timestamp }
  }

  static async getHistory(limit: number = 1000): Promise<MarketSnapshotRow[]> {
    const rows = await supabaseRest<MarketSnapshotRow[]>("MarketSnapshot", {
      method: "GET",
      query: {
        select: "*",
        order: "timestamp.asc",
        limit: String(limit),
      },
    })
    return rows ?? []
  }
}
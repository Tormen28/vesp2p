import { prisma } from "@/lib/db"
import { BinanceService } from "./binance.client"
import { cleanPrices } from "@/lib/price-stats"

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000

export class ScraperService {
  static roundTimestampToBucket(date: Date = new Date()): Date {
    const bucket = Math.floor(date.getTime() / SNAPSHOT_INTERVAL_MS) * SNAPSHOT_INTERVAL_MS
    return new Date(bucket)
  }

  static async saveSnapshot() {
    const snapshot = await BinanceService.fetchSimpleSnapshot()

    const [sellData, buyData] = await Promise.all([
      BinanceService.fetchP2PData({ tradeType: "SELL", maxPages: 2 }),
      BinanceService.fetchP2PData({ tradeType: "BUY", maxPages: 2 }),
    ])

    const sellPrices = sellData.advertisements.map((ad) => ad.price)
    const buyPrices = buyData.advertisements.map((ad) => ad.price)
    const sellStats = cleanPrices(sellPrices)
    const buyStats = cleanPrices(buyPrices)

    const timestamp = this.roundTimestampToBucket()

    const result = await prisma.marketSnapshot.upsert({
      where: { timestamp },
      create: {
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
      },
      update: {
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
      },
    })

    console.log(
      `[Scraper] Snapshot saved: Buy=${snapshot.buyPrice}, Sell=${snapshot.sellPrice}, Spread=${snapshot.spread}, trimmedAds=${sellStats.trimmedCount + buyStats.trimmedCount}`
    )

    return { success: true, id: result.id, ...snapshot }
  }

  static async getHistory(limit: number = 1000) {
    return prisma.marketSnapshot.findMany({
      take: limit,
      orderBy: { timestamp: "asc" },
    })
  }
}
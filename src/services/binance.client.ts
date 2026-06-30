import type {
  BinanceAd,
  BinanceResponse,
  FilterInfo,
  P2PData,
  ProcessedAdvertisement,
  SnapshotResult,
  TradeType,
} from "@/types"
import {
  ASSET,
  BINANCE_P2P_URL,
  DEFAULT_MAX_PAGES,
  DEFAULT_MIN_ORDERS,
  DEFAULT_MIN_USDT_LIQUIDITY,
  FIAT,
} from "@/lib/constants"
import { cleanPrices } from "@/lib/price-stats"

interface FetchOptions {
  tradeType: TradeType
  minOrders?: number
  minUSDT?: number
  maxPages?: number
}

export class BinanceService {
  private static readonly HEADERS = {
    Accept: "*/*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    Lang: "es",
    Origin: "https://p2p.binance.com",
    Pragma: "no-cache",
    Referer: "https://p2p.binance.com/es/trade/all-payments/USDT?fiat=VES",
    "Sec-Ch-Ua": '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
    "Client-Type": "web",
  }

  static async fetchP2PData(options: FetchOptions): Promise<P2PData> {
    const {
      tradeType,
      minOrders = DEFAULT_MIN_ORDERS,
      minUSDT = DEFAULT_MIN_USDT_LIQUIDITY,
      maxPages = DEFAULT_MAX_PAGES,
    } = options

    const allAds: BinanceAd[] = []

    for (let page = 1; page <= maxPages; page++) {
      const payload = {
        asset: ASSET,
        countries: [],
        fiat: FIAT,
        page,
        payTypes: [],
        proMerchantAds: false,
        publisherType: null,
        rows: 20,
        tradeType,
        transAmount: "",
      }

      let success = false
      let retries = 0
      const maxRetries = 3

      while (!success && retries < maxRetries) {
        try {
          const response = await fetch(BINANCE_P2P_URL, {
            method: "POST",
            headers: this.HEADERS,
            body: JSON.stringify(payload),
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
          })

          if (!response.ok) {
            retries++
            if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 500 * retries))
              continue
            }
            break
          }

          const data: BinanceResponse = await response.json()

          if (data.data?.length > 0) {
            allAds.push(...data.data)
            success = true
            if (data.data.length < 20) break
          } else {
            success = true
            break
          }
        } catch (error) {
          console.error(`Error fetching page ${page} (attempt ${retries + 1}):`, error)
          retries++
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * retries))
          } else {
            throw error
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    const processedAds = this.processAds(allAds)
    const uniqueAds = this.removeDuplicates(processedAds)
    const filteredAds = this.filterAds(uniqueAds, minOrders, minUSDT)

    const finalAds =
      filteredAds.length >= 5
        ? filteredAds
        : this.fallbackToAll(uniqueAds)

    const prices = finalAds.map((ad) => ad.price)
    const cleaned = cleanPrices(prices)
    const minPrice = cleaned.min
    const maxPrice = cleaned.max

    const filterInfo: FilterInfo = {
      minOrders,
      totalCount: finalAds.length,
      verifiedCount: finalAds.filter((ad) => ad.advertiser.isVerified).length,
      usingAllAds: filteredAds.length < 5,
      totalAdsFound: uniqueAds.length,
      trimmedCount: cleaned.trimmedCount,
    }

    return {
      timestamp: new Date().toISOString(),
      tradeType,
      priceStats: {
        min: minPrice.toFixed(2),
        max: maxPrice.toFixed(2),
        spread: (maxPrice - minPrice).toFixed(2),
      },
      sampleSize: finalAds.length,
      advertisements: finalAds,
      filterInfo,
    }
  }

  private static processAds(ads: BinanceAd[]): ProcessedAdvertisement[] {
    return ads
      .map((ad) => {
        try {
          const price = Number.parseFloat(ad.adv.price)
          const available = Number.parseFloat(ad.adv.surplusAmount)
          const minLimit = Number.parseFloat(ad.adv.minSingleTransAmount)
          const maxLimit = Number.parseFloat(ad.adv.maxSingleTransAmount)
          const orderCount = ad.advertiser.monthOrderCount || 0
          const completionRate = ad.advertiser.monthFinishRate || 0

          return {
            advertiser: {
              nickName: ad.advertiser.nickName,
              userNo: ad.advertiser.userNo,
              monthOrderCount: orderCount,
              monthFinishRate: completionRate,
              positiveRate: ad.advertiser.positiveRate,
              userType: ad.advertiser.userType,
              isVerified:
                Boolean(ad.advertiser.proMerchant) ||
                ad.advertiser.userType === "merchant",
              proMerchant: Boolean(ad.advertiser.proMerchant),
            },
            price,
            available,
            limits: {
              min: minLimit,
              max: maxLimit,
              minInUSDT: minLimit / price,
              maxInUSDT: maxLimit / price,
            },
            payMethods: ad.adv.tradeMethods.map((m) => m.payType),
            orderCount,
            completionRate,
            averageTime: ad.advertiser.avgReleaseTimeOfLatest30day || 0,
          }
        } catch {
          return null
        }
      })
      .filter((ad): ad is ProcessedAdvertisement => ad !== null)
  }

  private static removeDuplicates(
    ads: ProcessedAdvertisement[]
  ): ProcessedAdvertisement[] {
    return ads.filter(
      (ad, index, self) =>
        index ===
        self.findIndex(
          (a) =>
            a.advertiser.userNo === ad.advertiser.userNo &&
            Math.abs(a.price - ad.price) < 0.01
        )
    )
  }

  private static filterAds(
    ads: ProcessedAdvertisement[],
    minOrders: number,
    minUSDT: number
  ): ProcessedAdvertisement[] {
    return ads.filter(
      (ad) => ad.orderCount >= minOrders && ad.limits.maxInUSDT >= minUSDT
    )
  }

  private static fallbackToAll(
    ads: ProcessedAdvertisement[]
  ): ProcessedAdvertisement[] {
    return ads.sort((a, b) => b.orderCount - a.orderCount)
  }

  static async fetchSimpleSnapshot(): Promise<SnapshotResult> {
    const [sellData, buyData] = await Promise.all([
      this.fetchP2PData({ tradeType: "SELL", maxPages: 2 }),
      this.fetchP2PData({ tradeType: "BUY", maxPages: 2 }),
    ])

    const sellPrices = sellData.advertisements.map((ad) => ad.price)
    const buyPrices = buyData.advertisements.map((ad) => ad.price)

    const sellStats = cleanPrices(sellPrices)
    const buyStats = cleanPrices(buyPrices)

    const medianSell = sellStats.median
    const medianBuy = buyStats.median
    const spread = medianSell - medianBuy

    return {
      id: 0,
      timestamp: new Date(),
      buyPrice: Math.round(medianBuy * 100) / 100,
      sellPrice: Math.round(medianSell * 100) / 100,
      spread: Math.round(spread * 100) / 100,
      sellCount: sellPrices.length,
      buyCount: buyPrices.length,
    }
  }
}

export type TradeType = "SELL" | "BUY"

export interface BinanceAdvertiser {
  nickName: string
  monthOrderCount: number
  monthFinishRate: number
  positiveRate: number
  userType: string
  merchantGroupMember: boolean
}

export interface BinanceAd {
  adNo: string
  price: number
  fiat: string
  asset: string
  minTransAmount: number
  maxTransAmount: number
  tradableAmount: number
  payTimeLimit: number
  tradeMethods: string[]
  advertiser: BinanceAdvertiser
}

export interface BinanceResponse {
  code: string
  message: null
  messageDetail: null
  data: { items: BinanceAd[] }
  success: boolean
}

export interface ProcessedAdvertisement {
  advertiser: {
    nickName: string
    monthOrderCount: number
    monthFinishRate: number
    positiveRate: number
    userType: string
    isVerified: boolean
  }
  price: number
  available: number
  limits: {
    min: number
    max: number
    minInUSDT: number
    maxInUSDT: number
  }
  payMethods: string[]
  orderCount: number
  completionRate: number
  averageTime: number
}

export interface FilterInfo {
  minOrders: number
  totalCount: number
  verifiedCount: number
  usingAllAds: boolean
  totalAdsFound: number
  trimmedCount: number
}

export interface P2PData {
  timestamp: string
  tradeType: TradeType
  priceStats: {
    min: string
    max: string
    spread: string
  }
  sampleSize: number
  advertisements: ProcessedAdvertisement[]
  filterInfo: FilterInfo
}

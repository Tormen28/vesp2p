export type TradeType = "SELL" | "BUY"

export interface BinanceAdvertiser {
  nickName: string
  userNo: string
  monthOrderCount: number
  monthFinishRate: number
  positiveRate: number
  userType: string
  isVerified: boolean
  proMerchant: boolean
  avgReleaseTimeOfLatest30day: number
}

export interface BinanceAdv {
  advNo: string
  price: string
  surplusAmount: string
  minSingleTransAmount: string
  maxSingleTransAmount: string
  tradeMethods: { payType: string }[]
}

export interface BinanceAd {
  advertiser: BinanceAdvertiser
  adv: BinanceAdv
}

export interface BinanceResponse {
  code: string
  message: null
  messageDetail: null
  data: BinanceAd[]
}

export interface ProcessedAdvertisement {
  advertiser: {
    nickName: string
    userNo: string
    monthOrderCount: number
    monthFinishRate: number
    positiveRate: number
    userType: string
    isVerified: boolean
    proMerchant: boolean
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



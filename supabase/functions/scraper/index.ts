// Supabase Edge Function — Binance P2P Scraper
// Deployed via: supabase functions deploy scraper --no-verify-jwt
// Triggered by pg_cron every 5 min

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const BINANCE_API = "https://www.binance.com/bapi/c2c/v1/public/c2c/agent/ad-list"
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000

// ── IQR price cleaning ──────────────────────────────────────────────

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  if (sorted.length === 1) return sorted[0]
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

function median(sorted: number[]): number {
  const n = sorted.length
  if (n === 0) return NaN
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function cleanPrices(prices: number[]) {
  if (prices.length === 0) throw new Error("cleanPrices: empty array")
  const sorted = [...prices].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const med = median(sorted)
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr
  let cleaned = sorted.filter((p) => p >= lower && p <= upper)
  if (cleaned.length < 3) {
    cleaned = sorted
  }
  return {
    min: cleaned[0],
    max: cleaned[cleaned.length - 1],
    median: med,
    q1,
    q3,
    trimmedCount: sorted.length - cleaned.length,
  }
}

// ── Binance P2P fetch ───────────────────────────────────────────────

interface BinanceAd {
  price: number
  tradableAmount: number
  minTransAmount: number
  maxTransAmount: number
  payTimeLimit: number
  tradeMethods: string[]
  advertiser: {
    nickName: string
    monthOrderCount: number
    monthFinishRate: number
    positiveRate: number
    userType: string
    merchantGroupMember: boolean
  }
}

async function fetchBinance(tradeType: "SELL" | "BUY"): Promise<BinanceAd[]> {
  const params = new URLSearchParams({
    fiat: "VES",
    asset: "USDT",
    tradeType,
    limit: "20",
  })
  const res = await fetch(`${BINANCE_API}?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Binance ${tradeType} returned ${res.status}`)
  const body = await res.json()
  return body.data?.items ?? []
}

// ── Round timestamp to 5-min bucket ─────────────────────────────────

function roundTimestamp(date: Date = new Date()): string {
  const bucket = Math.floor(date.getTime() / SNAPSHOT_INTERVAL_MS) * SNAPSHOT_INTERVAL_MS
  return new Date(bucket).toISOString()
}

// ── Raw SQL upsert via PostgREST ────────────────────────────────────

async function rawUpsert(payload: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/upsert_snapshot`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`rawUpsert failed ${res.status}: ${text}`)
  }
}

// ── Main handler ────────────────────────────────────────────────────

serve(async (req) => {
  try {
    // Fetch SELL + BUY in parallel
    const [sellAds, buyAds] = await Promise.all([
      fetchBinance("SELL"),
      fetchBinance("BUY"),
    ])

    if (sellAds.length === 0 && buyAds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No ads from Binance — API may be blocked" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      )
    }

    // Extract prices
    const sellPrices = sellAds.map((a) => a.price).filter((p) => p > 0)
    const buyPrices = buyAds.map((a) => a.price).filter((p) => p > 0)

    // Clean with IQR
    const sellStats = cleanPrices(sellPrices.length > 0 ? sellPrices : [0])
    const buyStats = cleanPrices(buyPrices.length > 0 ? buyPrices : [0])

    const medianSell = sellStats.median
    const medianBuy = buyStats.median
    const spread = medianBuy - medianSell
    const timestamp = roundTimestamp()

    const payload = {
      p_timestamp: timestamp,
      p_buyprice: Math.round(medianBuy * 100) / 100,
      p_sellprice: Math.round(medianSell * 100) / 100,
      p_spread: Math.round(spread * 100) / 100,
      p_medianbuy: medianBuy,
      p_mediansell: medianSell,
      p_q1buy: buyStats.q1,
      p_q3buy: buyStats.q3,
      p_q1sell: sellStats.q1,
      p_q3sell: sellStats.q3,
      p_trimmedads: sellStats.trimmedCount + buyStats.trimmedCount,
      p_volume: 0,
    }

    await rawUpsert(payload)

    return new Response(
      JSON.stringify({
        ok: true,
        buy: payload.p_buyprice,
        sell: payload.p_sellprice,
        spread: payload.p_spread,
        trimmed: payload.p_trimmedads,
        sellAds: sellAds.length,
        buyAds: buyAds.length,
        timestamp,
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

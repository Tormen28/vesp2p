// Standalone scraper — no src/ imports, no path aliases.
// Runs via: npx tsx scripts/scraper.ts
// Env vars required: SUPABASE_URL, SUPABASE_SECRET_KEY

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("[scraper] FATAL: Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars")
  process.exit(1)
}

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
    console.warn(`[scraper] IQR trim left ${cleaned.length}/${sorted.length}, using full array`)
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
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Binance ${tradeType} returned ${res.status}`)
  const body = await res.json()
  return body.data?.items ?? []
}

// ── Supabase REST upsert ────────────────────────────────────────────

async function upsertSnapshot(payload: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/rest/v1/marketsnapshot?on_conflict=timestamp`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET_KEY!,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Supabase upsert failed ${res.status}: ${text}`)
  }
}

// ── Main ────────────────────────────────────────────────────────────

function roundTimestamp(date: Date = new Date()): string {
  const bucket = Math.floor(date.getTime() / SNAPSHOT_INTERVAL_MS) * SNAPSHOT_INTERVAL_MS
  return new Date(bucket).toISOString()
}

async function main() {
  console.log("[scraper] Starting P2P snapshot...")
  const start = Date.now()

  const [sellAds, buyAds] = await Promise.all([fetchBinance("SELL"), fetchBinance("BUY")])
  console.log(`[scraper] Fetched ${sellAds.length} SELL, ${buyAds.length} BUY ads`)

  if (sellAds.length === 0 && buyAds.length === 0) {
    throw new Error("No ads returned from Binance — API may be blocked")
  }

  const sellPrices = sellAds.map((a) => a.price).filter((p) => p > 0)
  const buyPrices = buyAds.map((a) => a.price).filter((p) => p > 0)

  const sellStats = cleanPrices(sellPrices.length > 0 ? sellPrices : [0])
  const buyStats = cleanPrices(buyPrices.length > 0 ? buyPrices : [0])

  const medianSell = sellStats.median
  const medianBuy = buyStats.median
  const spread = medianBuy - medianSell

  const timestamp = roundTimestamp()

  const payload = {
    timestamp,
    buyPrice: Math.round(medianBuy * 100) / 100,
    sellPrice: Math.round(medianSell * 100) / 100,
    spread: Math.round(spread * 100) / 100,
    medianBuy,
    medianSell,
    q1Buy: buyStats.q1,
    q3Buy: buyStats.q3,
    q1Sell: sellStats.q1,
    q3Sell: sellStats.q3,
    trimmedAds: sellStats.trimmedCount + buyStats.trimmedCount,
    volume: 0,
  }

  await upsertSnapshot(payload)

  const elapsed = Date.now() - start
  console.log(
    `[scraper] OK (${elapsed}ms) — Buy=${payload.buyPrice} Sell=${payload.sellPrice} Spread=${payload.spread} trimmed=${payload.trimmedAds}`
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[scraper] FATAL:", err instanceof Error ? err.message : err)
    process.exit(1)
  })

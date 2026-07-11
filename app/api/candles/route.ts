import { NextResponse } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const dynamic = "force-dynamic"

interface MarketSnapshotRow {
  timestamp: string
  buyprice: number
}

const TIMEFRAME_MS: Record<string, number> = {
  "5m": 5 * 60 * 1000,
  "10m": 10 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "8h": 8 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
}

function aggregateCandles(rows: MarketSnapshotRow[], timeframe: string) {
  const intervalMs = TIMEFRAME_MS[timeframe]
  if (!intervalMs) return []

  const sorted = [...rows].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const buckets = new Map<number, MarketSnapshotRow[]>()

  for (const row of sorted) {
    const ts = new Date(row.timestamp).getTime()
    const bucketKey = Math.floor(ts / intervalMs) * intervalMs
    const bucket = buckets.get(bucketKey)
    if (bucket) {
      bucket.push(row)
    } else {
      buckets.set(bucketKey, [row])
    }
  }

  const candles: { time: string; open: number; high: number; low: number; close: number }[] = []

  for (const [bucketKey, bucketRows] of Array.from(buckets.entries())) {
    const open = bucketRows[0].buyprice
    const close = bucketRows[bucketRows.length - 1].buyprice
    let high = -Infinity
    let low = Infinity

    for (const r of bucketRows) {
      if (r.buyprice > high) high = r.buyprice
      if (r.buyprice < low) low = r.buyprice
    }

    candles.push({
      time: new Date(bucketKey).toISOString(),
      open,
      high,
      low,
      close,
    })
  }

  return candles
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "1h"
    const parsedLimit = parseInt(searchParams.get("limit") || "8000")
    const limit = Number.isFinite(parsedLimit) ? Math.min(parsedLimit, 10000) : 8000

    if (!TIMEFRAME_MS[timeframe]) {
      return NextResponse.json(
        { error: `Invalid timeframe "${timeframe}". Supported: ${Object.keys(TIMEFRAME_MS).join(", ")}` },
        { status: 400 }
      )
    }

    const { env } = getCloudflareContext()
    const SUPABASE_URL = (env as Record<string, string>).SUPABASE_URL
    const SUPABASE_SECRET_KEY = (env as Record<string, string>).SUPABASE_SECRET_KEY

    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars" },
        { status: 500 }
      )
    }

    const BATCH_SIZE = 1000
    const allRows: MarketSnapshotRow[] = []
    let offset = 0

    while (offset < limit) {
      const batchSize = Math.min(BATCH_SIZE, limit - offset)
      const url = new URL(`${SUPABASE_URL}/rest/v1/marketsnapshot`)
      url.searchParams.set("select", "timestamp,buyprice")
      url.searchParams.set("order", "timestamp.asc")
      url.searchParams.set("limit", String(batchSize))
      url.searchParams.set("offset", String(offset))

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(`Supabase REST error ${response.status}: ${errorText}`)
      }

      const rows: MarketSnapshotRow[] = await response.json()
      if (!rows || rows.length === 0) break
      allRows.push(...rows)
      if (rows.length < batchSize) break
      offset += batchSize
    }

    if (allRows.length === 0) {
      return NextResponse.json({ candles: [], timeframe, limit })
    }

    const candles = aggregateCandles(allRows, timeframe)

    return NextResponse.json(
      { candles, timeframe, limit },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Error en /api/candles:", msg)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

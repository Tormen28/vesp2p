import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET

  const authorized = expectedToken && authHeader === `Bearer ${expectedToken}`

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    message: "Scraping delegado a GitHub Actions (Binance bloquea Workers IPs).",
  })
}
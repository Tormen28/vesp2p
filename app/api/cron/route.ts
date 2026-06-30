import { NextResponse } from "next/server"
import { ScraperService } from "@/services/scraper.service"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const vercelCronHeader = request.headers.get("x-vercel-cron")
    const expectedToken = process.env.CRON_SECRET

    const authorized =
      (expectedToken && authHeader === `Bearer ${expectedToken}`) ||
      vercelCronHeader === "1"

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CRON] Guardando snapshot...")

    await ScraperService.saveSnapshot()

    return NextResponse.json({
      success: true,
      message: "Snapshot guardado correctamente",
    })
  } catch (error: unknown) {
    console.error("[CRON] Error:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

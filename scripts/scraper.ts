import { ScraperService } from "../src/services/scraper.service"

async function main() {
  console.log("[scraper] Iniciando snapshot P2P...")
  const start = Date.now()

  try {
    await ScraperService.saveSnapshot()
    console.log(`[scraper] OK - ${Date.now() - start}ms`)
    process.exit(0)
  } catch (err) {
    console.error("[scraper] ERROR:", err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
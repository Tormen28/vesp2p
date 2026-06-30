import "dotenv/config"
import { ScraperService } from "../src/services/scraper.service"

async function main() {
  console.log(`[${new Date().toISOString()}] Ejecutando Scraper de Mercado P2P...`)

  const result = await ScraperService.saveSnapshot()

  console.log(
    `[${new Date().toISOString()}] Snapshot guardado: Compra=${result.buyPrice}, Venta=${result.sellPrice}, Spread=${result.spread}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db")
    await prisma.$disconnect()
  })
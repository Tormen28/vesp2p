export interface CleanedPriceStats {
  min: number
  max: number
  median: number
  q1: number
  q3: number
  sampleSize: number
  trimmedCount: number
}

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

export function cleanPrices(prices: number[]): CleanedPriceStats {
  if (prices.length === 0) {
    throw new Error("cleanPrices: prices array is empty")
  }

  const sorted = [...prices].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const med = median(sorted)
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr

  let cleaned = sorted.filter((p) => p >= lower && p <= upper)

  if (cleaned.length < 3) {
    console.warn(
      `[price-stats] IQR trim left only ${cleaned.length} prices out of ${sorted.length}; falling back to full array.`
    )
    cleaned = sorted
  }

  return {
    min: cleaned[0],
    max: cleaned[cleaned.length - 1],
    median: med,
    q1,
    q3,
    sampleSize: cleaned.length,
    trimmedCount: sorted.length - cleaned.length,
  }
}
export interface SupabaseRestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string>
  prefer?: string
  signal?: AbortSignal
}

export function getSupabaseEnv(): { url: string; key: string } {
  // In Cloudflare Workers, use getCloudflareContext() for env bindings
  // Falls back to process.env for local dev
  try {
    // Dynamic import to avoid issues in non-Cloudflare environments
    const { getCloudflareContext } = require("@opennextjs/cloudflare")
    const ctx = getCloudflareContext()
    const url = ctx.env.SUPABASE_URL || process.env.SUPABASE_URL
    const key = ctx.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY
    if (url && key) return { url, key }
  } catch {
    // Not in Cloudflare context, fall back to process.env
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars")
  }
  return { url, key }
}

export async function supabaseRest<T = unknown>(
  table: string,
  options: SupabaseRestOptions = {}
): Promise<T> {
  const { method = "GET", body, query, prefer, signal } = options

  const { url: SUPABASE_URL, key: SUPABASE_SECRET_KEY } = getSupabaseEnv()

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v)
    }
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  }
  if (prefer) headers.Prefer = prefer

  // Add Range header for large limit requests (Supabase defaults to 1000 rows)
  if (query?.limit) {
    const limitNum = parseInt(query.limit)
    if (limitNum > 1000) {
      headers.Range = `0-${limitNum - 1}`
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(
      `Supabase REST error ${response.status} on ${method} ${table}: ${errorText}`
    )
  }

  const contentLength = response.headers.get("content-length")
  if (response.status === 204 || contentLength === "0") {
    return null as T
  }

  const text = await response.text()
  if (!text) return null as T

  return JSON.parse(text) as T
}

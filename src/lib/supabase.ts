const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars. Set them in .env or your deployment environment."
  )
}

export interface SupabaseRestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string>
  prefer?: string
  signal?: AbortSignal
}

export async function supabaseRest<T = unknown>(
  table: string,
  options: SupabaseRestOptions = {}
): Promise<T> {
  const { method = "GET", body, query, prefer, signal } = options

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v)
    }
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_SECRET_KEY!,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  }
  if (prefer) headers.Prefer = prefer

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
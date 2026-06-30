# Spec: Limpieza de precios + Supabase + Vercel

> **Fecha:** 2026-06-30
> **Proyecto:** vesp2p (Analizador P2P VES)
> **Autor del plan:** Edward (con brainstorming iterativo)

## 1. Contexto y problema

El proyecto `vesp2p` es un analizador del mercado P2P de Binance para el par USDT/VES. Está construido sobre `kirusiya/Analizador-de-Precios-Binance-P2P` y adaptado con persistencia (Prisma + SQLite), scraping programado y proyección OHLC.

**Bugs y limitaciones identificados durante el brainstorming:**

1. **"Agarra la primera opción" / "no limpia los datos para llegar al precio real":**
   `binance.client.ts:135-145` calcula `priceStats.min/max` con `Math.min/max` crudos sobre los anuncios que sobreviven al filtro blando (`orderCount >= 500`, `maxInUSDT >= 50`). No hay recorte de outliers. Bots con precios irreales (3 Bs o 300 Bs contra un mercado real de ~25 Bs) sobreviven al filtro y distorsionan tanto la UI como los snapshots guardados.

2. **Snapshots sesgados:**
   `ScraperService.saveSnapshot` usa `fetchSimpleSnapshot`, que calcula promedios simples sobre los mismos anuncios sucios. Cada snapshot guardado arrastra el mismo sesgo, inutilizando análisis histórico.

3. **SQLite en Vercel:**
   El usuario quiere deployar en Vercel, donde SQLite local no funciona (filesystem efímero). La migración de DB es obligatoria.

4. **DB mal aprovisionada:**
   `package.json` trae `@libsql/client` y `@prisma/adapter-libsql` pero `schema.prisma` usa provider SQLite clásico (sin driver adapter). Indicios de una migración a libSQL/Turso abandonada a medias.

5. **`isVerified` siempre `true`:**
   En `binance.client.ts:172`, `isVerified` se setea con `Boolean(proMerchant)`, ignorando `userType === "merchant"`. Bug menor.

## 2. Objetivos

1. **Calcular el "precio real" del medio del mercado** usando **mediana + recorte IQR**.
2. **Guardar snapshots confiables** con campos de distribución para auditoría posterior.
3. **Migrar la DB a Supabase Postgres** (gratis, persistente, integrable con Vercel).
4. **Automatizar el scraping con Vercel Cron** cada 5 minutos.
5. **Limpiar dependencias abandonadas** (libsql).
6. **Mostrar transparencia** al usuario: cuántos anuncios outliers se descartaron.

## 3. Diseño

### 3.1 Limpieza de precios (núcleo del fix)

**Nueva utilidad:** `src/lib/price-stats.ts`

```ts
export interface CleanedPriceStats {
  min: number
  max: number
  median: number
  q1: number
  q3: number
  sampleSize: number
  trimmedCount: number
}

export function cleanPrices(prices: number[]): CleanedPriceStats
```

**Algoritmo:**

1. Si `prices.length === 0` → lanzar `Error("empty prices array")`.
2. Calcular `Q1`, `Q2` (mediana), `Q3` con cuantiles estándar (interpolación lineal, igual que `numpy.percentile` por defecto).
3. Calcular `IQR = Q3 - Q1`.
4. Definir límites: `lower = Q1 - 1.5 * IQR`, `upper = Q3 + 1.5 * IQR`.
5. Filtrar precios en `[lower, upper]`.
6. Si `cleaned.length < 3` → fallback a `prices` originales (warning en consola, no error).
7. Devolver `min`/`max`/`median` sobre el array limpio + `trimmedCount = prices.length - cleaned.length`.

**Por qué IQR + mediana:** es el método estándar de detección de outliers en estadísticas robustas. La mediana es resistente a valores extremos, y el IQR descarta los anuncios con precios muy alejados del grueso del mercado sin asumir una distribución normal.

### 3.2 Integración en `binance.client.ts`

- `fetchP2PData` (línea 135-145): reemplazar `Math.min/max` por `cleanPrices(prices).min/max`. El resto del flujo no cambia.
- `fetchSimpleSnapshot`: usar `cleanPrices` para calcular `median` por tradeType. Ese `median` es el precio "real" que se guarda.

### 3.3 Nuevos campos en `MarketSnapshot`

```prisma
model MarketSnapshot {
  id          Int      @id @default(autoincrement())
  timestamp   DateTime @default(now())

  // Precios robustos (mediana del mercado limpio)
  buyPrice    Float    // mediana BUY
  sellPrice   Float    // mediana SELL
  spread      Float

  // Distribución del snapshot (auditoría)
  medianBuy   Float
  medianSell  Float
  q1Buy       Float
  q3Buy       Float
  q1Sell      Float
  q3Sell      Float
  trimmedAds  Int      // total de anuncios descartados (compra + venta)

  volume      Float?

  @@unique([timestamp])
  @@index([timestamp])
}
```

**Idempotencia de snapshots:** `ScraperService.saveSnapshot` redondeará `timestamp` a `floor(now / 5min) * 5min` antes del `create`, para que dos llamadas en el mismo intervalo colapsen en una sola fila (Postgres hace upsert vía `upsert` con `where: { timestamp }`).

### 3.4 Nuevo campo en `FilterInfo`

```ts
export interface FilterInfo {
  minOrders: number
  totalCount: number
  verifiedCount: number
  usingAllAds: boolean
  totalAdsFound: number
  trimmedCount: number  // NUEVO: anuncios outliers descartados
}
```

Esto se calcula en `binance.client.ts` después de `cleanPrices` y se devuelve al frontend.

### 3.5 Migración a Postgres (Supabase)

**Cambios en `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Limpiar migración SQLite vieja:**

- Borrar `prisma/migrations/20260622225229_init/` (era SQLite).
- Borrar `dev.db` (los 20 KB de datos no vale preservarlos; si el usuario lo pide después, se hace un script de export).

**Nueva migración inicial:** `npx prisma migrate dev --name init_postgres` (la crea automáticamente).

**Setup en Supabase:**

1. Crear proyecto en https://supabase.com
2. Settings → Database → Connection string → Transaction pooler (puerto 6543)
3. Copiar URL con formato `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. Setear `DATABASE_URL` en `.env` (local) y en Vercel env vars (prod).

### 3.6 Vercel Cron

**Nuevo `vercel.json` en la raíz:**

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "*/5 * * * *" }
  ]
}
```

Esto invoca `GET /api/cron` cada 5 minutos. Vercel manda `Authorization: Bearer ${CRON_SECRET}` automáticamente (igual que el chequeo actual en `app/api/cron/route.ts`).

**Por las dudas**, agregar también soporte para el header `x-vercel-cron` que Vercel manda en plan Pro:

```ts
const vercelCronHeader = request.headers.get("x-vercel-cron")
const isVercelCron = vercelCronHeader === "1" || authHeader === `Bearer ${expectedToken}`
```

**Plan Hobby de Vercel:** verificar antes de deploy si permite `*/5 * * * *` (288 invocaciones/día). Si no, alternativa: cron-job.org externo pegando al endpoint con `Authorization: Bearer ${CRON_SECRET}`.

### 3.7 Limpieza de dependencias

Sacar de `package.json`:

- `@libsql/client`
- `@prisma/adapter-libsql`

Verificar que no haya imports en el código antes de borrar.

### 3.8 Fix menor: `isVerified`

En `binance.client.ts:172`:

```ts
// Antes:
isVerified: Boolean(ad.advertiser.proMerchant),

// Después:
isVerified: Boolean(ad.advertiser.proMerchant) || ad.advertiser.userType === "merchant",
```

## 4. Cambios por archivo

| Archivo | Tipo | Cambio |
|---|---|---|
| `src/lib/price-stats.ts` | **nuevo** | Función `cleanPrices` (IQR + mediana) |
| `src/services/binance.client.ts` | editar | Usar `cleanPrices` en `fetchP2PData` y `fetchSimpleSnapshot`. Agregar `trimmedCount` al `FilterInfo`. Fix `isVerified`. |
| `src/types/binance.ts` | editar | Agregar `trimmedCount` a `FilterInfo` |
| `prisma/schema.prisma` | editar | `provider = "postgresql"`. Agregar campos de distribución al modelo. |
| `prisma/migrations/20260622225229_init/` | **borrar** | Migración SQLite obsoleta |
| `dev.db` | **borrar** | DB SQLite local |
| `src/services/scraper.service.ts` | editar | Timestamp redondeado a 5 min. `upsert` por timestamp. Nuevos campos en el create. |
| `scripts/scraper.ts` | reescribir | Usar `ScraperService.saveSnapshot()` directo (sin pegarle a localhost). Para backfill manual local. |
| `package.json` | editar | Quitar `@libsql/client` y `@prisma/adapter-libsql`. |
| `vercel.json` | **nuevo** | Cron config |
| `app/api/cron/route.ts` | editar | Aceptar header `x-vercel-cron` además del Bearer |
| `.env.example` | editar | Documentar `DATABASE_URL` apuntando a Supabase |
| `.env` | editar | (usuario) apuntar a Supabase |
| `README.md` | editar | Secciones "Setup Supabase" y "Deploy Vercel" |
| `src/components/dashboard/price-cards.tsx` | editar | Mostrar `trimmedCount` en el badge "Filtrando" |

## 5. Fuera de alcance

- **Velas OHLC** (esperar a tener snapshots limpios en Supabase).
- **Sistema de alertas / Telegram** (ya marcado como "100%" en `contexto.md`, sin validar; no se toca).
- **Backfill histórico** (la DB actual tiene ~20 KB, no vale preservar).
- **Tests automatizados** (no hay infra previa; se agrega cuando se estabilice).

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cambio visible de precios al activar IQR | `trimmedCount` visible en UI. Documentar que min/max ahora son del mercado real. |
| Pérdida de 20 KB de snapshots viejos | DB eliminada; el usuario confirmó que no vale preservarlos. |
| Plan Hobby de Vercel sin soporte para `*/5 *` | Fallback a `cron-job.org` documentado. |
| Supabase free tier se "duerme" a los 7 días | El scraper cada 5 min mantiene tráfico activo. |
| Tipos de TypeScript desactualizados tras cambios | Ejecutar `npm run build` al final para validar. |

## 7. Orden de ejecución

1. **Spec + commit** (este documento)
2. **`src/lib/price-stats.ts`** (independiente, se puede testear solo)
3. **`binance.client.ts`** (enchufar `cleanPrices`, fix `isVerified`)
4. **`binance.client.ts → FilterInfo` → types** → propagar `trimmedCount`
5. **`prisma/schema.prisma`** → Postgres + nuevos campos
6. **Borrar migración SQLite vieja + `dev.db`**
7. **`scraper.service.ts`** → timestamp redondeado + upsert + nuevos campos
8. **`scripts/scraper.ts`** → reescritura con `ScraperService` directo
9. **`package.json`** → quitar libsql
10. **`vercel.json`** + `app/api/cron/route.ts` → aceptar `x-vercel-cron`
11. **`README.md`** + `.env.example` → docs
12. **`price-cards.tsx`** → badge de `trimmedCount`
13. **Verificación final**: `npm run lint` + `npm run build`
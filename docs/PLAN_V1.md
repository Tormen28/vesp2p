# Plan Dashboard USDT/VES P2P

**Fecha:** 2024
**Estado:** Fase 1 Completa - Preparado para Fase 2

---

## Visión del Proyecto

Dashboard para trading personal P2P USDT/VES con:
- Comparativa de precios en tiempo real de múltiples exchanges
- Análisis algorítmico (arbitraje, tendencia, volatilidad, MA)
- Predicciones con ML (futuro)
- Persistencia de datos históricos

---

## Arquitectura de Datos

```
CriptoYa API
     │
     ▼
/api/rates (polling 60s)
     │
     ▼
┌─────────────┐      ┌─────────────┐
│   Frontend  │      │  Supabase   │ (Fase 2)
│  useRates   │      │  persist    │
└─────────────┘      └─────────────┘
     │
     ▼
┌─────────────┐
│  Algoritmos │
│  (memoria)  │
└─────────────┘
```

---

## Fuentes de Datos

### CriptoYa API (Principal)
- **URL:** `https://criptoya.com/api/usdt/ves/1`
- **Auth:** No requerida
- **Rate limit:** 120 req/min
- **Poll:** Cada 60 segundos

### Exchanges Incluidos
- binancep2p → Binance P2P
- okexp2p → OKX P2P
- bybitp2p → Bybit P2P
- bitgetp2p → Bitget P2P
- bingxp2p → BingX P2P
- mexcp2p → MEXC P2P
- coinexp2p → CoinEx P2P
- saldo → Saldo

---

## Estructura del Dashboard

### Pestañas
1. **Overview** - resumen con mejores precios
2. **Exchanges** - rankings completos
3. **Trends** - gráfico de tendencia
4. **Config** - alertas y configuración

---

## Componentes Creados

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| `use-rates` | `src/hooks/use-rates.ts` | Hook con polling, historial 20 pts, algoritmos |
| `exchange-card` | `components/ui/exchange-card.tsx` | Rankings comprar/vender con UI mejorada |
| `trend-chart` | `components/ui/trend-chart.tsx` | Gráfico de tendencia con Recharts |
| `algorithm-panel` | `components/ui/algorithm-panel.tsx` | Arbitraje, tendencia, volatilidad, MA |
| `alert-config` | `components/ui/alert-config.tsx` | Configuración de alertas (localStorage) |
| `dashboard-header` | `components/ui/dashboard-header.tsx` | Navegación por tabs |
| `rates-route` | `app/api/rates/route.ts` | API route proxy a CriptoYa |

---

## Fases de Desarrollo

### ✅ FASE 1: MVP Simple (COMPLETA)
**Objetivo:** Datos funcionando sin DB

**Entregado:**
- API Route `/api/rates` con CriptoYa proxy
- Hook `useRates()` con polling 60s
- Historial en memoria (20 lecturas)
- Exchange card con rankings visuales
- Trend chart con Recharts
- Algorithm panel (arbitraje, tendencia, volatilidad, MA)
- Alert config con localStorage

**Tecnologías:**
- Next.js 14
- Recharts
- Shadcn/ui (sin modificar componentes base)
- localStorage para alertas

### ⏳ FASE 2: Persistencia (PRÓXIMA)
**Objetivo:** Guardar histórico en Supabase

**Por hacer:**
- [ ] Crear proyecto Supabase
- [ ] Tabla `price_snapshots` (timestamp, rates JSON, metrics)
- [ ] Tabla `alerts` (threshold, enabled, last_triggered)
- [ ] Tabla `user_preferences`
- [ ] Cron/polling que guarde a Supabase
- [ ] Queries para histórico >24h
- [ ] Migrar alert config a Supabase

**Tiempo estimado:** 2-3 horas

### 🔮 FASE 3: Algoritmos Avanzados (FUTURO)
**Objetivo:** ML para predicciones

**Por hacer:**
- [ ] Feature engineering con datos acumulados
- [ ] Modelo de predicción de precios
- [ ] Detección de patrones
- [ ] Alertas inteligentes con thresholds dinámicos
- [ ] Notificaciones push (Service Workers)

**Requiere:** Mínimo 1-2 semanas de datos

---

## Decisiones de Diseño

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| Polling | 60 segundos | Balance refresh vs rate limit |
| Historial (memoria) | 20 lecturas | Suficiente para tendencia visual |
| Storage alertas | localStorage | Simple, no necesita backend |
| Chart library | Recharts | Ya instalado |
| DB futura | Supabase | Gratis, fácil, rápido |
| Idioma UI | Español (Venezuela) | Mercado objetivo |

---

## API Endpoints

### GET /api/rates

**Response:**
```json
{
  "timestamp": 1234567890,
  "rates": [
    {
      "name": "binancep2p",
      "ask": 788.49,
      "bid": 787.505,
      "spread": 0.99,
      "spreadAbs": 0.985
    }
  ],
  "bestBid": { "exchange": "binancep2p", "price": 787.505 },
  "bestAsk": { "exchange": "binancep2p", "price": 788.49 },
  "globalSpread": 0.99,
  "avgPrice": 787.997
}
```

---

## Métricas Calculadas (Algoritmos)

| Métrica | Fórmula |
|---------|---------|
| Spread % | `(ask - bid) / ask * 100` |
| Spread Abs | `ask - bid` |
| Mejor Bid | `max(all bids)` - mayor precio de compra |
| Mejor Ask | `min(all asks)` - menor precio de venta |
| Arbitraje | `bestBid.price > bestAsk.price` |
| Tendencia | Comparación lectura actual vs anterior |
| Volatilidad | Desviación estándar de últimos 20 |
| MA | Promedio móvil de últimos 20 |

---

## Bugs Corregidos

| Bug | Solución |
|-----|----------|
| Mejor precio compra/venta invertido | Intercambiado bestBid ↔ bestAsk |
| Ranking vender top 1 ilegible | Contraste mejorado: red-100 fondo, red-700+ texto |
| UI inconsistente entre rankings | Estandarizado estilos comprar/vender |

---

## Para Hacer (Backlog)

### Fase 2
- [ ] Setup Supabase
- [ ] Tabla price_snapshots
- [ ] Tabla alerts (migrar de localStorage)
- [ ] Tabla user_preferences
- [ ] Polling que persista a DB
- [ ] Queries histórico

### Fase 3
- [ ] Feature engineering
- [ ] Modelo ML predicción
- [ ] Detección de patrones
- [ ] Alertas inteligentes
- [ ] Browser notifications (Service Workers)

### Nice to Have
- [ ] PWA para móvil
- [ ] Exportar datos (CSV/Excel)
- [ ] Más exchanges
- [ ] Widget de escritorio

---

## Notas Técnicas

### CriptoYa API
- Endpoint: `https://criptoya.com/api/{coin}/{fiat}/{volumen}`
- No requiere API key
- Rate limit: 120 requests/minuto
- Coins: BTC, ETH, USDT, USDC, etc.
- Fiats: VES, ARS, BRL, COP, etc.

### Importante
- Binance SPOT NO tiene par USDT/VES
- Binance P2P tiene traders pero datos no públicos
- CriptoYa agrega datos de múltiples P2P

---

## Archivos del Proyecto

```
vesp2p/
├── app/
│   ├── api/rates/route.ts    # Proxy CriptoYa
│   └── page.tsx               # Dashboard principal
├── components/ui/
│   ├── exchange-card.tsx      # Rankings exchanges
│   ├── trend-chart.tsx        # Gráfico tendencia
│   ├── algorithm-panel.tsx    # Panel algoritmos
│   ├── alert-config.tsx      # Config alertas
│   └── dashboard-header.tsx   # Navegación tabs
├── hooks/
│   └── use-rates.ts          # Hook principal
├── docs/
│   └── PLAN_V1.md            # Este archivo
└── package.json
```

---

## Checklist Antes de Fase 2

- [x] MVP funcionando
- [x] UI/UX corregida
- [x] Bugs de colores resueltos
- [x] Rankings comprar/vender claros
- [ ] Crear cuenta Supabase
- [ ] Diseñar schema DB
- [ ] Implementar persistencia

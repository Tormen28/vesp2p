# Plan Maestro: Analizador y Recolector P2P VES

> **Proyecto:** VES P2P Analyzer | **Tipo:** Aplicación web full-stack (Dashboard + Scraper)
> **Objetivo:** Herramienta personal para monitorear, persistir y analizar el mercado P2P de Binance para Venezuela (VES), basada en la arquitectura de `kirusiya/Analizador-de-Precios-Binance-P2P`.

---

## 1. Visión del Proyecto

Convertir un simple visor de precios en un **sistema de recolección y análisis persistente**. Al guardar periódicamente los datos del mercado en una base de datos local (SQLite), podemos generar gráficos de velas (TradingView Lightweight Charts) para visualizar tendencias históricas, spread y liquidez, filtrando inteligentemente los "bots" y anuncios sin reputación.

## 2. Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** Shadcn/ui (Radix UI), Lucide React
- **Gráficos:** TradingView Lightweight Charts
- **Base de Datos:** SQLite
- **ORM:** Prisma
- **Procesamiento de Fechas:** date-fns

## 3. Arquitectura

```text
vesp2p/
├── prisma/
│   ├── schema.prisma         # Esquema de SQLite (MarketSnapshot)
│   └── dev.db               # Base de datos SQLite
├── app/
│   ├── api/
│   │   ├── binance-p2p/     # Route handler proxy (tiempo real)
│   │   └── history/         # Endpoint para datos históricos (OHLC)
│   ├── page.tsx             # Dashboard principal
│   └── layout.tsx
├── components/
│   ├── ui/                  # Shadcn/ui components
│   ├── candlestick-chart.tsx # Gráfico de velas (Lightweight Charts)
│   ├── price-alert-system.tsx # Sistema de alertas
│   ├── price-display.tsx    # Display de precios
│   ├── price-projection.tsx # Proyecciones de precio
│   └── advertisers-table.tsx # Tabla de anunciantes
└── scripts/
    └── scraper.ts           # Script para recolectar datos
```

---

## 4. Fases de Desarrollo y Progreso

Usa esta sección para llevar un control estricto de qué falta por hacer.

### Fase 1: Setup del Entorno Base (100%)
- [x] Inicializar proyecto Next.js 14 (`npx create-next-app@latest`).
- [x] Configurar Tailwind CSS y TypeScript.
- [x] Inicializar Shadcn/ui y agregar componentes base (card, table, button, input).
- [x] Instalar dependencias extra (lucide-react, date-fns, clsx, tailwind-merge).

### Fase 2: Proxy API y Lógica de Filtrado (100%)
- [x] Implementar el servicio de scraping P2P en `src/services/binance.ts`.
- [x] Programar los filtros anti-bot (priorizar anunciantes con >500 órdenes, tasa > 95%).
- [x] Implementar filtro de monto mínimo (ej. >= 50 USD) para evitar anuncios sin liquidez real.
- [x] Crear el Route Handler `/api/binance-p2p` que devuelva el payload limpio y procesado.
- [x] Implementar el algoritmo de proyecciones a corto plazo (tendencia al alza/baja).

### Fase 3: Persistencia de Datos (Base de Datos) (100%)
- [x] Instalar e inicializar Prisma (`npx prisma init --datasource-provider sqlite`).
- [x] Definir el esquema `MarketSnapshot` (timestamp, min_compra, max_venta, spread, etc.).
- [x] Ejecutar migraciones para crear la DB.
- [x] Crear script recolector (`scraper.ts`) o un Route Handler tipo cron para ingestar datos cada 5 minutos.

### Fase 4: Frontend y Dashboard Visual (100%)
- [x] **Resumen en Tiempo Real**: Tarjetas (Cards) con Precio de Compra, Venta y Spread.
- [x] **Tabla de Anunciantes**: Lista interactiva, ordenable y filtrable.
- [x] **Gráfico de Velas (Lightweight Charts)**: Componente `CandlestickChart` integrado con datos de SQLite.
- [x] Conectar el gráfico a los datos históricos extraídos de SQLite para renderizar las velas (OHLC) de forma dinámica.

### Fase 5: Alertas y Refinamiento (100%)
- [x] Lógica de notificaciones visuales/sonoras en el navegador cuando el precio cruza umbrales.
- [x] Sistema de alertas configurable con persistencia en localStorage.
- [x] Revisión de diseño (Light/Dark mode) y responsive design.

---

## 5. Preguntas Abiertas de Diseño (Por definir)
1. **Scraping Periódico:** ¿Usamos un script en Node aparte corriendo con un cronjob en el sistema operativo, o dejamos que se encargue Next.js internamente mientras la pestaña esté abierta?
2. **Alertas:** ¿Son suficientes las alertas visuales en pantalla, o requerimos integración directa con Telegram?
3. **Estética:** ¿Tema oscuro por defecto para dar un aspecto "Pro Trader"?

*Última actualización: Fase de planificación completada. Listo para iniciar Fase 1.*

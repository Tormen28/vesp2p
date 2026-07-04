# Contexto del Proyecto: Analizador P2P VES con Memoria (Velas)

Este documento sirve como el "norte" del proyecto. Aquí explicamos de dónde partimos, qué estamos construyendo y los pasos exactos que iremos dando.

## 1. El Origen (Idea Base)
Partimos clonando el repositorio open-source: `kirusiya/Analizador-de-Precios-Binance-P2P`.
Ese proyecto original está hecho en **Next.js 14**, usa **TailwindCSS** y **Shadcn/ui**, y funciona como un excelente "visor" en tiempo real del mercado P2P para el par USDT/VES. Filtra anunciantes, muestra proyecciones a muy corto plazo y permite buscar en una tabla dinámica.

**El problema del original:** Es solo un *visor*. No tiene memoria. Si cierras la web, los datos se pierden. No permite ver el historial de cómo se ha movido el mercado en las últimas horas o días (no tiene velas).

## 2. Nuestro Objetivo (Lo que haremos)
Vamos a transformar ese visor en una **herramienta personal de análisis histórico y en tiempo real** enfocada en Venezuela (VES). 

Nuestra herramienta tendrá **Memoria (Base de Datos)** y **Velas (Gráficos OHLC)**.

### Los 4 Pilares de nuestro desarrollo:
1. **Adaptación a Venezuela (VES):** Cambiar todo el código para que apunte al par USDT/VES. Ajustar los filtros de "monto mínimo" para que tengan sentido en Bolívares y evitar los bots que ponen montos irreales.
2. **Persistencia (Memoria con SQLite):** Integrar `Prisma` con `SQLite`. Crearemos un proceso en segundo plano (scraper/cron) que guarde automáticamente una "foto" (snapshot) del mercado cada 5 minutos (precio promedio de compra, de venta y spread).
3. **El Gráfico de Velas:** Usando la librería `Lightweight Charts` de TradingView, leeremos esos datos guardados en SQLite para dibujar velas japonesas de 5 minutos, 1 hora, etc. Así podrás ver la tendencia real del mercado P2P venezolano.
4. **Alertas:** Lógica para notificar cuando el spread o el precio crucen ciertos umbrales que definas.

## 3. Hoja de Ruta (Cómo lo vamos haciendo)

- [x] **Paso 1: Clonar y Preparar**
  - Clonar el repositorio base.
  - Instalar dependencias (`npm install`).
  - Crear este documento de contexto.

- [x] **Paso 2: Adaptación a VES y Limpieza**
  - Buscar en el código donde diga "VES" o "fiat=VES" y cambiarlo a "VES".
  - Ajustar la lógica del Route Handler (`/api/binance-p2p`) para los montos de Venezuela.
  - Comprobar que la UI base funciona bien para VES.

- [x] **Paso 3: Integrar SQLite y Prisma (El Motor de Memoria)**
  - Instalar `prisma` y configurar SQLite.
  - Crear la tabla `MarketSnapshot` (timestamp, buyPrice, sellPrice, spread, volume).
  - Hacer un script (`scraper.ts`) o endpoint que recolecte los datos de Binance y haga el `INSERT` en SQLite cada 5 minutos.

- [x] **Paso 4: El Gráfico de Velas (Lightweight Charts)**
  - Componente `candlestick-chart.tsx` con Lightweight Charts.
  - Endpoint `/api/history` que lee de SQLite y convierte snapshots a formato OHLC.
  - Gráfico con intervalos de 5min, 15min, 1h, 4h, 1 día.

- [x] **Paso 5: Pulido y Alertas**
  - Sistema de alertas con umbrales configurables.
  - Notificaciones del navegador y sonido.
  - Tema oscuro por defecto (NextThemes).

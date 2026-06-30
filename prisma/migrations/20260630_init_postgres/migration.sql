-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "spread" DOUBLE PRECISION NOT NULL,
    "medianBuy" DOUBLE PRECISION NOT NULL,
    "medianSell" DOUBLE PRECISION NOT NULL,
    "q1Buy" DOUBLE PRECISION NOT NULL,
    "q3Buy" DOUBLE PRECISION NOT NULL,
    "q1Sell" DOUBLE PRECISION NOT NULL,
    "q3Sell" DOUBLE PRECISION NOT NULL,
    "trimmedAds" INTEGER NOT NULL DEFAULT 0,
    "volume" DOUBLE PRECISION,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketSnapshot_timestamp_idx" ON "MarketSnapshot"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSnapshot_timestamp_key" ON "MarketSnapshot"("timestamp");


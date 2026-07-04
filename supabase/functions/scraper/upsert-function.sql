CREATE OR REPLACE FUNCTION upsert_snapshot(
  p_timestamp TIMESTAMPTZ,
  p_buyprice DOUBLE PRECISION,
  p_sellprice DOUBLE PRECISION,
  p_spread DOUBLE PRECISION,
  p_medianbuy DOUBLE PRECISION,
  p_mediansell DOUBLE PRECISION,
  p_q1buy DOUBLE PRECISION,
  p_q3buy DOUBLE PRECISION,
  p_q1sell DOUBLE PRECISION,
  p_q3sell DOUBLE PRECISION,
  p_trimmedads INTEGER,
  p_volume DOUBLE PRECISION
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO MarketSnapshot (timestamp, buyPrice, sellPrice, spread, medianBuy, medianSell, q1Buy, q3Buy, q1Sell, q3Sell, trimmedAds, volume)
  VALUES (p_timestamp, p_buyprice, p_sellprice, p_spread, p_medianbuy, p_mediansell, p_q1buy, p_q3buy, p_q1sell, p_q3sell, p_trimmedads, p_volume)
  ON CONFLICT (timestamp) DO UPDATE SET
    buyPrice = EXCLUDED.buyPrice,
    sellPrice = EXCLUDED.sellPrice,
    spread = EXCLUDED.spread,
    medianBuy = EXCLUDED.medianBuy,
    medianSell = EXCLUDED.medianSell,
    q1Buy = EXCLUDED.q1Buy,
    q3Buy = EXCLUDED.q3Buy,
    q1Sell = EXCLUDED.q1Sell,
    q3Sell = EXCLUDED.q3Sell,
    trimmedAds = EXCLUDED.trimmedAds,
    volume = EXCLUDED.volume;
END;
$$ LANGUAGE plpgsql;

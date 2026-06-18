import { createServerFn } from "@tanstack/react-start";

export type PriceData = {
  ticker: string;
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  spark: number[];
  stale: boolean;
};

function toFinnhubSymbol(ticker: string): string {
  // Crypto: BTC-USD -> BINANCE:BTCUSDT
  if (ticker.endsWith("-USD")) {
    const coin = ticker.slice(0, -4);
    return `BINANCE:${coin}USDT`;
  }
  return ticker;
}

async function fetchOne(ticker: string, key: string): Promise<PriceData> {
  const symbol = toFinnhubSymbol(ticker);
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("bad status");
    const j = (await res.json()) as {
      c?: number; d?: number; dp?: number; pc?: number;
    };
    const price = typeof j.c === "number" && j.c > 0 ? j.c : null;
    const prev = typeof j.pc === "number" && j.pc > 0 ? j.pc : null;
    const changePct =
      typeof j.dp === "number"
        ? j.dp
        : price != null && prev != null && prev !== 0
        ? ((price - prev) / prev) * 100
        : null;
    return {
      ticker,
      price,
      prevClose: prev,
      changePct,
      spark: price != null && prev != null ? [prev, price] : price != null ? [price] : [],
      stale: price == null,
    };
  } catch {
    return { ticker, price: null, prevClose: null, changePct: null, spark: [], stale: true };
  }
}

export const getPrices = createServerFn({ method: "POST" })
  .inputValidator((data: { tickers: string[] }) => data)
  .handler(async ({ data }) => {
    const key = process.env.FINNHUB_API_KEY;
    const unique = Array.from(new Set(data.tickers)).slice(0, 60);
    const map: Record<string, PriceData> = {};
    if (!key) {
      for (const t of unique) {
        map[t] = { ticker: t, price: null, prevClose: null, changePct: null, spark: [], stale: true };
      }
      return { prices: map, fetchedAt: Date.now() };
    }
    const results = await Promise.all(unique.map((t) => fetchOne(t, key)));
    for (const r of results) map[r.ticker] = r;
    return { prices: map, fetchedAt: Date.now() };
  });

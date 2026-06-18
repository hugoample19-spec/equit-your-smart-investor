import { createServerFn } from "@tanstack/react-start";

export type PriceData = {
  ticker: string;
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  spark: number[];
  stale: boolean;
  reference?: boolean; // true = static reference price, not live
};

// Reference prices for commodities (real APIs require paid plans).
// Approximate market levels — marked as "Precio de referencia" in UI.
const REFERENCE_PRICES: Record<string, number> = {
  "GC=F": 2650,   // Gold (USD/oz)
  "SI=F": 31.5,   // Silver (USD/oz)
  "CL=F": 72,     // WTI Crude Oil (USD/bbl)
  "NG=F": 3.2,    // Natural Gas (USD/MMBtu)
  "HG=F": 4.3,    // Copper (USD/lb)
  "ZW=F": 580,    // Wheat (USD/bu)
};

function toFinnhubSymbol(ticker: string): string {
  if (ticker.endsWith("-USD")) {
    const coin = ticker.slice(0, -4);
    return `BINANCE:${coin}USDT`;
  }
  return ticker;
}

async function fromFinnhub(ticker: string, key: string): Promise<PriceData | null> {
  try {
    const symbol = toFinnhubSymbol(ticker);
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const j = (await res.json()) as { c?: number; dp?: number; pc?: number };
    const price = typeof j.c === "number" && j.c > 0 ? j.c : null;
    if (price == null) return null;
    const prev = typeof j.pc === "number" && j.pc > 0 ? j.pc : null;
    const changePct =
      typeof j.dp === "number"
        ? j.dp
        : prev != null && prev !== 0
        ? ((price - prev) / prev) * 100
        : null;
    return {
      ticker,
      price,
      prevClose: prev,
      changePct,
      spark: prev != null ? [prev, price] : [price],
      stale: false,
    };
  } catch {
    return null;
  }
}

async function fromYahoo(ticker: string): Promise<PriceData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker
    )}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
      };
    };
    const r = j.chart?.result?.[0];
    const price = r?.meta?.regularMarketPrice ?? null;
    if (!price || price <= 0) return null;
    const prev = r?.meta?.chartPreviousClose ?? r?.meta?.previousClose ?? null;
    const closes = (r?.indicators?.quote?.[0]?.close ?? []).filter(
      (v): v is number => typeof v === "number" && v > 0
    );
    const changePct = prev && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    return {
      ticker,
      price,
      prevClose: prev,
      changePct,
      spark: closes.length > 1 ? closes : prev ? [prev, price] : [price],
      stale: false,
    };
  } catch {
    return null;
  }
}

async function fetchOne(ticker: string, key: string | undefined): Promise<PriceData> {
  // Commodities → reference price
  if (REFERENCE_PRICES[ticker] != null) {
    const p = REFERENCE_PRICES[ticker];
    return {
      ticker,
      price: p,
      prevClose: p,
      changePct: 0,
      spark: [p, p],
      stale: false,
      reference: true,
    };
  }
  if (key) {
    const f = await fromFinnhub(ticker, key);
    if (f) return f;
  }
  const y = await fromYahoo(ticker);
  if (y) return y;
  return {
    ticker,
    price: null,
    prevClose: null,
    changePct: null,
    spark: [],
    stale: true,
  };
}

export const getPrices = createServerFn({ method: "POST" })
  .inputValidator((data: { tickers: string[] }) => data)
  .handler(async ({ data }) => {
    const key = process.env.FINNHUB_API_KEY;
    const unique = Array.from(new Set(data.tickers)).slice(0, 80);
    const results = await Promise.all(unique.map((t) => fetchOne(t, key)));
    const map: Record<string, PriceData> = {};
    for (const r of results) map[r.ticker] = r;
    return { prices: map, fetchedAt: Date.now() };
  });

/* =========================== History (chart) =========================== */

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "1Y";
export type ChartPoint = { t: number; price: number; volume: number };
export type HistoryData = {
  ticker: string;
  range: ChartRange;
  points: ChartPoint[];
  reference?: boolean;
};

const RANGE_MAP: Record<ChartRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
};

function syntheticSeries(price: number, range: ChartRange): ChartPoint[] {
  const n = range === "1D" ? 78 : range === "1W" ? 65 : range === "1M" ? 22 : range === "3M" ? 65 : 52;
  const now = Date.now();
  const stepMs =
    range === "1D"
      ? 5 * 60 * 1000
      : range === "1W"
      ? 30 * 60 * 1000
      : range === "1M" || range === "3M"
      ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
  // Deterministic flat-ish series so the user sees a chart even for reference assets
  return Array.from({ length: n }, (_, i) => ({
    t: now - (n - 1 - i) * stepMs,
    price,
    volume: 0,
  }));
}

export const getHistory = createServerFn({ method: "POST" })
  .inputValidator((data: { ticker: string; range: ChartRange }) => data)
  .handler(async ({ data }): Promise<HistoryData> => {
    const { ticker, range } = data;
    if (REFERENCE_PRICES[ticker] != null) {
      return { ticker, range, points: syntheticSeries(REFERENCE_PRICES[ticker], range), reference: true };
    }
    const { range: r, interval } = RANGE_MAP[range];
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?interval=${interval}&range=${r}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) throw new Error("bad status");
      const j = (await res.json()) as {
        chart?: {
          result?: Array<{
            timestamp?: number[];
            indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> };
          }>;
        };
      };
      const r0 = j.chart?.result?.[0];
      const ts = r0?.timestamp ?? [];
      const cl = r0?.indicators?.quote?.[0]?.close ?? [];
      const vol = r0?.indicators?.quote?.[0]?.volume ?? [];
      const points: ChartPoint[] = [];
      for (let i = 0; i < ts.length; i++) {
        const c = cl[i];
        if (typeof c === "number" && c > 0) {
          points.push({ t: ts[i] * 1000, price: c, volume: typeof vol[i] === "number" ? (vol[i] as number) : 0 });
        }
      }
      return { ticker, range, points };
    } catch {
      return { ticker, range, points: [] };
    }
  });

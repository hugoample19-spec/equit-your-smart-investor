import { createServerFn } from "@tanstack/react-start";

export type PriceData = {
  ticker: string;
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  spark: number[];
  stale: boolean;            // true = served from cache, live fetch failed this round
  reference?: boolean;       // true = static reference price, not live
  source?: "finnhub" | "yahoo" | "reference" | "cache" | "none";
  error?: string;            // human-readable reason when price is null
  fetchedAt?: number;        // ms timestamp of when this price was actually fetched
};

// Reference prices for commodities (real APIs require paid plans).
const REFERENCE_PRICES: Record<string, number> = {
  "GC=F": 2650, "SI=F": 31.5, "CL=F": 72, "NG=F": 3.2, "HG=F": 4.3, "ZW=F": 580,
};

function toFinnhubSymbol(ticker: string): string {
  if (ticker.endsWith("-USD")) {
    const coin = ticker.slice(0, -4);
    return `BINANCE:${coin}USDT`;
  }
  return ticker;
}

const DEBUG_TICKERS = new Set(["AAPL", "MSFT", "AMZN", "BTC-USD"]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fromFinnhub(
  ticker: string,
  key: string,
): Promise<{ data: PriceData | null; raw: unknown; status: number; error?: string }> {
  const symbol = toFinnhubSymbol(ticker);
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    let raw: unknown = text;
    try { raw = JSON.parse(text); } catch { /* keep as text */ }
    if (!res.ok) {
      return { data: null, raw, status: res.status, error: `Finnhub HTTP ${res.status}` };
    }
    const j = raw as { c?: number; dp?: number; pc?: number; error?: string };
    if (j && typeof j === "object" && typeof j.error === "string" && j.error) {
      return { data: null, raw, status: res.status, error: `Finnhub: ${j.error}` };
    }
    const price = typeof j.c === "number" && j.c > 0 ? j.c : null;
    if (price == null) {
      return { data: null, raw, status: res.status, error: "Finnhub: sin precio (c=0)" };
    }
    const prev = typeof j.pc === "number" && j.pc > 0 ? j.pc : null;
    const changePct =
      typeof j.dp === "number" ? j.dp
      : prev != null && prev !== 0 ? ((price - prev) / prev) * 100
      : null;
    return {
      data: {
        ticker, price, prevClose: prev, changePct,
        spark: prev != null ? [prev, price] : [price],
        stale: false, source: "finnhub",
      },
      raw, status: res.status,
    };
  } catch (e) {
    return { data: null, raw: null, status: 0, error: `Finnhub fetch failed: ${(e as Error).message}` };
  }
}

async function fromYahoo(ticker: string): Promise<{ data: PriceData | null; error?: string }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker
    )}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return { data: null, error: `Yahoo HTTP ${res.status}` };
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
    if (!price || price <= 0) return { data: null, error: "Yahoo: sin precio" };
    const prev = r?.meta?.chartPreviousClose ?? r?.meta?.previousClose ?? null;
    const closes = (r?.indicators?.quote?.[0]?.close ?? []).filter(
      (v): v is number => typeof v === "number" && v > 0
    );
    const changePct = prev && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    return {
      data: {
        ticker, price, prevClose: prev, changePct,
        spark: closes.length > 1 ? closes : prev ? [prev, price] : [price],
        stale: false, source: "yahoo",
      },
    };
  } catch (e) {
    return { data: null, error: `Yahoo fetch failed: ${(e as Error).message}` };
  }
}

async function fetchOne(ticker: string, key: string | undefined): Promise<PriceData> {
  if (REFERENCE_PRICES[ticker] != null) {
    const p = REFERENCE_PRICES[ticker];
    return {
      ticker, price: p, prevClose: p, changePct: 0,
      spark: [p, p], stale: false, reference: true, source: "reference",
    };
  }

  const errors: string[] = [];

  if (key) {
    const f = await fromFinnhub(ticker, key);
    if (DEBUG_TICKERS.has(ticker)) {
      // eslint-disable-next-line no-console
      console.log(`[finnhub:${ticker}]`, {
        status: f.status,
        symbol: toFinnhubSymbol(ticker),
        error: f.error ?? null,
        raw: f.raw,
      });
    }
    if (f.data) return f.data;
    if (f.error) errors.push(f.error);
  } else {
    errors.push("FINNHUB_API_KEY missing");
  }

  const y = await fromYahoo(ticker);
  if (DEBUG_TICKERS.has(ticker)) {
    // eslint-disable-next-line no-console
    console.log(`[yahoo:${ticker}]`, { error: y.error ?? null, price: y.data?.price ?? null });
  }
  if (y.data) return y.data;
  if (y.error) errors.push(y.error);

  return {
    ticker, price: null, prevClose: null, changePct: null,
    spark: [], stale: true, source: "none",
    error: errors.join(" · ") || "Precio no disponible",
  };
}

export const getPrices = createServerFn({ method: "POST" })
  .inputValidator((data: { tickers: string[] }) => data)
  .handler(async ({ data }) => {
    const key = process.env.FINNHUB_API_KEY;
    const unique = Array.from(new Set(data.tickers)).slice(0, 80);

    // Load cached prices first so we can always show last-known-good values
    // when a live fetch fails (rate limit, transient error, etc.).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    type CacheRow = {
      ticker: string;
      price: number | string;
      prev_close: number | string | null;
      change_pct: number | string | null;
      source: string | null;
      fetched_at: string;
    };
    const cache: Record<string, CacheRow> = {};
    if (unique.length > 0) {
      const { data: rows } = await supabaseAdmin
        .from("price_cache")
        .select("ticker, price, prev_close, change_pct, source, fetched_at")
        .in("ticker", unique);
      for (const r of (rows ?? []) as CacheRow[]) cache[r.ticker] = r;
    }

    // Sequential staggered fetch (250ms) to stay under Finnhub free tier (60/min).
    const map: Record<string, PriceData> = {};
    const toUpsert: Array<{
      ticker: string; price: number; prev_close: number | null;
      change_pct: number | null; source: string; fetched_at: string;
    }> = [];

    for (const t of unique) {
      const fresh = await fetchOne(t, key);
      if (fresh.price != null) {
        map[t] = fresh;
        toUpsert.push({
          ticker: t,
          price: fresh.price,
          prev_close: fresh.prevClose,
          change_pct: fresh.changePct,
          source: fresh.source ?? "none",
          fetched_at: new Date().toISOString(),
        });
      } else {
        // Live fetch failed → fall back to cached price if we have one.
        const c = cache[t];
        if (c) {
          const price = Number(c.price);
          const prev = c.prev_close != null ? Number(c.prev_close) : null;
          const chg = c.change_pct != null ? Number(c.change_pct) : null;
          map[t] = {
            ticker: t, price, prevClose: prev, changePct: chg,
            spark: prev != null ? [prev, price] : [price],
            stale: true, source: "cache",
            fetchedAt: new Date(c.fetched_at).getTime(),
          };
        } else {
          map[t] = fresh; // truly unavailable: no live, no cache
        }
      }
      await sleep(250);
    }

    // Best-effort cache write; don't block the response on failure.
    if (toUpsert.length > 0) {
      const { error } = await supabaseAdmin.from("price_cache").upsert(toUpsert, { onConflict: "ticker" });
      if (error) console.warn("[prices] cache upsert failed:", error.message);
    }

    const failed = Object.values(map).filter((p) => p.price == null).map((p) => `${p.ticker}(${p.error ?? "?"})`);
    if (failed.length) {
      console.warn("[prices] no live + no cache:", failed.join(", "));
    }
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

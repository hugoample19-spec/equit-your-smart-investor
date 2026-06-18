import { createServerFn } from "@tanstack/react-start";

export type PriceData = {
  ticker: string;
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  spark: number[];
  stale: boolean;
};

async function fetchOne(ticker: string): Promise<PriceData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=7d&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error("bad status");
    const json = (await res.json()) as any;
    const r = json?.chart?.result?.[0];
    if (!r) throw new Error("no result");
    const meta = r.meta ?? {};
    const closes: number[] = (r.indicators?.quote?.[0]?.close ?? []).filter(
      (n: any) => typeof n === "number"
    );
    const price = meta.regularMarketPrice ?? closes[closes.length - 1] ?? null;
    const prev = meta.chartPreviousClose ?? closes[0] ?? null;
    const changePct =
      price != null && prev != null && prev !== 0 ? ((price - prev) / prev) * 100 : null;
    return {
      ticker,
      price,
      prevClose: prev,
      changePct,
      spark: closes.length ? closes : price != null ? [price] : [],
      stale: false,
    };
  } catch {
    return { ticker, price: null, prevClose: null, changePct: null, spark: [], stale: true };
  }
}

export const getPrices = createServerFn({ method: "POST" })
  .inputValidator((data: { tickers: string[] }) => data)
  .handler(async ({ data }) => {
    const unique = Array.from(new Set(data.tickers)).slice(0, 60);
    const results = await Promise.all(unique.map(fetchOne));
    const map: Record<string, PriceData> = {};
    for (const r of results) map[r.ticker] = r;
    return { prices: map, fetchedAt: Date.now() };
  });

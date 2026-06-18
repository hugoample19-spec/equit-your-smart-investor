import { createServerFn } from "@tanstack/react-start";

export type RealHolding = {
  ticker: string;
  name: string;
  shares: number;
  value: number;
  pct: number;
};

export type ThirteenFResult = {
  cik: string;
  filingDate: string | null;
  holdings: RealHolding[];
  fallback: boolean;
};

const padCik = (cik: string) => cik.replace(/\D/g, "").padStart(10, "0");

export const getThirteenF = createServerFn({ method: "GET" })
  .inputValidator((data: { cik: string }) => data)
  .handler(async ({ data }): Promise<ThirteenFResult> => {
    const key = process.env.FMP_API_KEY;
    const cik = padCik(data.cik);
    if (!key) return { cik, filingDate: null, holdings: [], fallback: true };

    try {
      // Get latest filing date
      const datesUrl = `https://financialmodelingprep.com/api/v3/form-thirteen-f-dates/${cik}?apikey=${key}`;
      const dRes = await fetch(datesUrl);
      let filingDate: string | null = null;
      if (dRes.ok) {
        const dates = (await dRes.json()) as string[] | { date: string }[];
        if (Array.isArray(dates) && dates.length) {
          const first = dates[0];
          filingDate = typeof first === "string" ? first : first?.date ?? null;
        }
      }

      const url = filingDate
        ? `https://financialmodelingprep.com/api/v3/form-thirteen-f/${cik}?date=${filingDate}&apikey=${key}`
        : `https://financialmodelingprep.com/api/v3/form-thirteen-f/${cik}?apikey=${key}`;
      const res = await fetch(url);
      if (!res.ok) return { cik, filingDate, holdings: [], fallback: true };
      const raw = (await res.json()) as Array<{
        date?: string;
        nameOfIssuer?: string;
        tickercusip?: string;
        ticker?: string;
        shares?: number;
        value?: number;
      }>;
      if (!Array.isArray(raw) || raw.length === 0)
        return { cik, filingDate, holdings: [], fallback: true };

      if (!filingDate && raw[0]?.date) filingDate = raw[0].date!;
      const total = raw.reduce((s, r) => s + (Number(r.value) || 0), 0) || 1;
      const holdings: RealHolding[] = raw
        .map((r) => ({
          ticker: (r.tickercusip || r.ticker || "").toUpperCase(),
          name: r.nameOfIssuer || "",
          shares: Number(r.shares) || 0,
          value: Number(r.value) || 0,
          pct: ((Number(r.value) || 0) / total) * 100,
        }))
        .filter((h) => h.ticker && h.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

      if (!holdings.length) return { cik, filingDate, holdings: [], fallback: true };
      return { cik, filingDate, holdings, fallback: false };
    } catch {
      return { cik, filingDate: null, holdings: [], fallback: true };
    }
  });

// Shared portfolio calculation. Single source of truth for Home + Wallet.
// One metric only: TOTAL HISTORICAL RETURN since purchase, live vs current price.
// No daily/intraday comparison anywhere.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  useWallet,
  positionQty,
  positionAvg,
  positionInvested,
  type Position,
} from "./wallet-store";
import { getPrices } from "./prices.functions";
import { useApp } from "./app-context";

export type AssetBreakdown = {
  ticker: string;
  qty: number;
  avg: number;        // weighted avg purchase price (€)
  price: number;      // current live price (€)
  invested: number;   // qty * avg
  value: number;      // qty * price (market value)
  gain: number;       // (price - avg) * qty
  gainPct: number;    // (price - avg) / avg * 100
  stale?: boolean;
};

export type PortfolioSummary = {
  ready: boolean;
  hasWallet: boolean;
  cash: number;
  starting: number;             // total amount ever invested (deposits)
  marketValue: number;          // sum of value across positions
  totalValue: number;           // marketValue + cash
  totalReturn: number;          // sum of per-asset gain (cash contributes 0)
  totalReturnPct: number;       // totalReturn / starting * 100
  assets: AssetBreakdown[];
  series: { t: number; v: number }[];
};

function compute(
  positions: Record<string, Position>,
  prices: Record<string, { price?: number | null; stale?: boolean } | undefined>,
): { assets: AssetBreakdown[]; marketValue: number; totalReturn: number } {
  let marketValue = 0;
  let totalReturn = 0;
  const assets: AssetBreakdown[] = [];
  for (const p of Object.values(positions)) {
    const qty = positionQty(p);
    const avg = positionAvg(p);
    const invested = positionInvested(p);
    const pd = prices[p.ticker];
    const price = pd?.price ?? avg;
    const value = qty * price;
    const gain = (price - avg) * qty;
    const gainPct = avg > 0 ? ((price - avg) / avg) * 100 : 0;
    marketValue += value;
    totalReturn += gain;
    assets.push({ ticker: p.ticker, qty, avg, price, invested, value, gain, gainPct, stale: pd?.stale });
  }
  return { assets, marketValue, totalReturn };
}

export function usePortfolioSummary(): PortfolioSummary {
  const { user } = useApp();
  const { state, ready } = useWallet(user?.id ?? null);
  const tickers = useMemo(() => Object.keys(state.positions), [state.positions]);

  const getPricesFn = useServerFn(getPrices);
  const { data: pricesResp } = useQuery({
    queryKey: ["prices", tickers.sort().join(",")],
    queryFn: () => getPricesFn({ data: { tickers } }),
    enabled: ready && tickers.length > 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const prices = pricesResp?.prices ?? {};

  return useMemo(() => {
    const hasWallet = state.starting != null;
    const { assets, marketValue, totalReturn } = compute(state.positions, prices);
    const cash = state.cash;
    const totalValue = marketValue + cash;
    const starting = state.starting ?? 0;
    const totalReturnPct = starting > 0 ? (totalReturn / starting) * 100 : 0;

    // Debug log of one asset's math so the formula is auditable.
    if (typeof window !== "undefined" && assets.length > 0) {
      const a = assets[0];
      // eslint-disable-next-line no-console
      console.log("[portfolio:asset]", {
        ticker: a.ticker,
        qty: a.qty,
        avgPurchasePrice: a.avg,
        currentPrice: a.price,
        gainEUR: a.gain,
        gainPct: a.gainPct,
        formula: `((${a.price} - ${a.avg}) / ${a.avg}) * 100 = ${a.gainPct.toFixed(2)}%`,
      });
      // eslint-disable-next-line no-console
      console.log("[portfolio:total]", {
        cash,
        marketValue,
        totalValue,
        starting,
        totalReturn,
        totalReturnPct,
      });
    }

    // Equity curve from transaction history (mark-to-market at current price).
    const series: { t: number; v: number }[] = [];
    if (hasWallet) {
      let runningCash = starting;
      const runningQty: Record<string, number> = {};
      series.push({
        t: state.history[0]?.at ? state.history[0].at - 86_400_000 : Date.now() - 86_400_000,
        v: starting,
      });
      const sorted = [...state.history].sort((a, b) => a.at - b.at);
      for (const ev of sorted) {
        if (ev.type === "buy") {
          runningCash -= ev.qty * ev.price;
          runningQty[ev.ticker] = (runningQty[ev.ticker] ?? 0) + ev.qty;
        } else {
          runningCash += ev.qty * ev.price;
          runningQty[ev.ticker] = (runningQty[ev.ticker] ?? 0) - ev.qty;
        }
        let mv = 0;
        for (const [tk, q] of Object.entries(runningQty)) {
          const pd = prices[tk];
          const px = pd?.price ?? ev.price;
          mv += q * px;
        }
        series.push({ t: ev.at, v: runningCash + mv });
      }
      series.push({ t: Date.now(), v: totalValue });
    }

    return {
      ready,
      hasWallet,
      cash,
      starting,
      marketValue,
      totalValue,
      totalReturn,
      totalReturnPct,
      assets,
      series,
    };
  }, [state, pricesResp, ready]);
}

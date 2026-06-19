// Shared portfolio summary derived from the wallet store + live prices.
// Home and Wallet read from the same source so values always match.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWallet, positionQty, positionInvested } from "./wallet-store";
import { getPrices } from "./prices.functions";

export type PortfolioSummary = {
  ready: boolean;
  hasWallet: boolean;
  cash: number;
  starting: number;
  invested: number;
  marketValue: number;
  totalValue: number;
  dailyGain: number;
  dailyPct: number;
  totalReturn: number;
  totalReturnPct: number;
  series: { t: number; v: number }[]; // equity curve from transaction history
};

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
    let marketValue = 0;
    let invested = 0;
    let dailyGain = 0;
    let prevValue = 0;

    for (const p of Object.values(state.positions)) {
      const qty = positionQty(p);
      const inv = positionInvested(p);
      const pd = prices[p.ticker];
      const price = pd?.price ?? (qty > 0 ? inv / qty : 0);
      const prevClose = pd?.prevClose ?? price;
      marketValue += qty * price;
      prevValue += qty * prevClose;
      invested += inv;
      if (pd?.price != null && pd?.prevClose != null) {
        dailyGain += qty * (price - prevClose);
      }
    }

    const cash = state.cash;
    const totalValue = marketValue + cash;
    const starting = state.starting ?? 0;
    const prevTotal = prevValue + cash;
    const dailyPct = prevTotal > 0 ? (dailyGain / prevTotal) * 100 : 0;
    const totalReturn = totalValue - starting;
    const totalReturnPct = starting > 0 ? (totalReturn / starting) * 100 : 0;

    // Equity curve from real transaction history:
    // simulate cash + positions over time, mark-to-market with current price
    // (best approximation without historical price storage).
    const series: { t: number; v: number }[] = [];
    if (hasWallet) {
      let runningCash = starting;
      const runningQty: Record<string, number> = {};
      series.push({ t: state.history[0]?.at ? state.history[0].at - 86_400_000 : Date.now() - 86_400_000, v: starting });
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
      // append "now" point with current market value
      series.push({ t: Date.now(), v: totalValue });
    }

    return {
      ready,
      hasWallet,
      cash,
      starting,
      invested,
      marketValue,
      totalValue,
      dailyGain,
      dailyPct,
      totalReturn,
      totalReturnPct,
      series,
    };
  }, [state, pricesResp, ready]);
}

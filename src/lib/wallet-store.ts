// Trading wallet state with localStorage persistence.
import { useEffect, useState, useCallback } from "react";

export type AssetCategory = "stocks" | "etfs" | "commodities" | "crypto";

export type CatalogAsset = {
  ticker: string;
  display: string;
  name: string;
  category: AssetCategory;
  sector?: string;
};

export const CATALOG: CatalogAsset[] = [
  // === Tech US ===
  { ticker: "AAPL", display: "AAPL", name: "Apple", category: "stocks", sector: "Tech US" },
  { ticker: "MSFT", display: "MSFT", name: "Microsoft", category: "stocks", sector: "Tech US" },
  { ticker: "NVDA", display: "NVDA", name: "Nvidia", category: "stocks", sector: "Tech US" },
  { ticker: "GOOGL", display: "GOOGL", name: "Alphabet", category: "stocks", sector: "Tech US" },
  { ticker: "META", display: "META", name: "Meta", category: "stocks", sector: "Tech US" },
  { ticker: "AMZN", display: "AMZN", name: "Amazon", category: "stocks", sector: "Tech US" },
  { ticker: "NFLX", display: "NFLX", name: "Netflix", category: "stocks", sector: "Tech US" },
  { ticker: "TSLA", display: "TSLA", name: "Tesla", category: "stocks", sector: "Tech US" },
  { ticker: "AMD", display: "AMD", name: "AMD", category: "stocks", sector: "Tech US" },
  { ticker: "INTC", display: "INTC", name: "Intel", category: "stocks", sector: "Tech US" },
  { ticker: "ORCL", display: "ORCL", name: "Oracle", category: "stocks", sector: "Tech US" },
  { ticker: "CRM", display: "CRM", name: "Salesforce", category: "stocks", sector: "Tech US" },
  { ticker: "ADBE", display: "ADBE", name: "Adobe", category: "stocks", sector: "Tech US" },
  { ticker: "UBER", display: "UBER", name: "Uber", category: "stocks", sector: "Tech US" },
  { ticker: "SPOT", display: "SPOT", name: "Spotify", category: "stocks", sector: "Tech US" },
  { ticker: "SNAP", display: "SNAP", name: "Snap", category: "stocks", sector: "Tech US" },
  { ticker: "PLTR", display: "PLTR", name: "Palantir", category: "stocks", sector: "Tech US" },
  // === Finanzas US ===
  { ticker: "JPM", display: "JPM", name: "JPMorgan Chase", category: "stocks", sector: "Finanzas US" },
  { ticker: "GS", display: "GS", name: "Goldman Sachs", category: "stocks", sector: "Finanzas US" },
  { ticker: "BAC", display: "BAC", name: "Bank of America", category: "stocks", sector: "Finanzas US" },
  { ticker: "V", display: "V", name: "Visa", category: "stocks", sector: "Finanzas US" },
  { ticker: "MA", display: "MA", name: "Mastercard", category: "stocks", sector: "Finanzas US" },
  // === Consumo US ===
  { ticker: "KO", display: "KO", name: "Coca-Cola", category: "stocks", sector: "Consumo US" },
  { ticker: "MCD", display: "MCD", name: "McDonald's", category: "stocks", sector: "Consumo US" },
  { ticker: "NKE", display: "NKE", name: "Nike", category: "stocks", sector: "Consumo US" },
  { ticker: "DIS", display: "DIS", name: "Disney", category: "stocks", sector: "Consumo US" },
  { ticker: "SBUX", display: "SBUX", name: "Starbucks", category: "stocks", sector: "Consumo US" },
  // === España ===
  { ticker: "ITX.MC", display: "ITX", name: "Inditex", category: "stocks", sector: "España" },
  { ticker: "SAN.MC", display: "SAN", name: "Santander", category: "stocks", sector: "España" },
  { ticker: "BBVA.MC", display: "BBVA", name: "BBVA", category: "stocks", sector: "España" },
  { ticker: "BKT.MC", display: "BKT", name: "Bankinter", category: "stocks", sector: "España" },
  { ticker: "REP.MC", display: "REP", name: "Repsol", category: "stocks", sector: "España" },
  // === Europa ===
  { ticker: "ASML", display: "ASML", name: "ASML (Países Bajos)", category: "stocks", sector: "Europa" },
  { ticker: "MC.PA", display: "MC", name: "LVMH", category: "stocks", sector: "Europa" },
  { ticker: "OR.PA", display: "OR", name: "L'Oréal", category: "stocks", sector: "Europa" },
  { ticker: "SAP", display: "SAP", name: "SAP (Alemania)", category: "stocks", sector: "Europa" },
  { ticker: "SIE.DE", display: "SIE", name: "Siemens", category: "stocks", sector: "Europa" },
  { ticker: "VOW3.DE", display: "VOW3", name: "Volkswagen", category: "stocks", sector: "Europa" },
  { ticker: "SHEL", display: "SHEL", name: "Shell", category: "stocks", sector: "Europa" },
  // ETFs
  { ticker: "SPY", display: "SPY", name: "S&P 500", category: "etfs" },
  { ticker: "QQQ", display: "QQQ", name: "Nasdaq 100", category: "etfs" },
  { ticker: "VTI", display: "VTI", name: "Total US Market", category: "etfs" },
  { ticker: "VWRA.L", display: "VWRA", name: "Vanguard All World", category: "etfs" },
  { ticker: "ARKK", display: "ARKK", name: "ARK Innovation", category: "etfs" },
  { ticker: "GLD", display: "GLD", name: "Gold ETF", category: "etfs" },
  { ticker: "TLT", display: "TLT", name: "US Treasury Bonds", category: "etfs" },
  { ticker: "IEMG", display: "IEMG", name: "Emerging Markets", category: "etfs" },
  { ticker: "EZU", display: "EZU", name: "Eurozone", category: "etfs" },
  { ticker: "SOXX", display: "SOXX", name: "Semiconductores", category: "etfs" },
  // Commodities (reference prices)
  { ticker: "GC=F", display: "XAU", name: "Oro (XAU/USD)", category: "commodities" },
  { ticker: "SI=F", display: "XAG", name: "Plata (XAG/USD)", category: "commodities" },
  { ticker: "CL=F", display: "WTI", name: "Petróleo WTI", category: "commodities" },
  { ticker: "NG=F", display: "NG", name: "Gas Natural", category: "commodities" },
  { ticker: "HG=F", display: "HG", name: "Cobre", category: "commodities" },
  { ticker: "ZW=F", display: "ZW", name: "Trigo", category: "commodities" },
  // Criptos
  { ticker: "BTC-USD", display: "BTC", name: "Bitcoin", category: "crypto" },
  { ticker: "ETH-USD", display: "ETH", name: "Ethereum", category: "crypto" },
  { ticker: "SOL-USD", display: "SOL", name: "Solana", category: "crypto" },
  { ticker: "BNB-USD", display: "BNB", name: "Binance Coin", category: "crypto" },
  { ticker: "XRP-USD", display: "XRP", name: "Ripple", category: "crypto" },
  { ticker: "DOGE-USD", display: "DOGE", name: "Dogecoin", category: "crypto" },
  { ticker: "ADA-USD", display: "ADA", name: "Cardano", category: "crypto" },
];

export const findAsset = (ticker: string) => CATALOG.find((a) => a.ticker === ticker);

export type Lot = { qty: number; price: number; at: number };
export type Position = { ticker: string; lots: Lot[] };

export type WalletState = {
  starting: number | null; // null = needs setup
  cash: number;
  positions: Record<string, Position>;
  history: { type: "buy" | "sell"; ticker: string; qty: number; price: number; at: number }[];
};

const KEY = "equit_wallet_v1";
const empty: WalletState = { starting: null, cash: 0, positions: {}, history: [] };

function load(): WalletState {
  if (typeof window === "undefined") return empty;
  try {
    const v = localStorage.getItem(KEY);
    return v ? { ...empty, ...(JSON.parse(v) as WalletState) } : empty;
  } catch {
    return empty;
  }
}
function persist(s: WalletState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  const update = useCallback((mut: (s: WalletState) => WalletState) => {
    setState((prev) => {
      const next = mut(prev);
      persist(next);
      return next;
    });
  }, []);

  const setupStarting = useCallback(
    (amount: number) => update(() => ({ starting: amount, cash: amount, positions: {}, history: [] })),
    [update]
  );

  const reset = useCallback(
    () =>
      update((s) =>
        s.starting != null
          ? { starting: s.starting, cash: s.starting, positions: {}, history: [] }
          : s
      ),
    [update]
  );

  const buy = useCallback(
    (ticker: string, qty: number, price: number) =>
      update((s) => {
        const cost = qty * price;
        if (cost > s.cash + 0.0001) return s;
        const pos = s.positions[ticker] ?? { ticker, lots: [] };
        const next: WalletState = {
          ...s,
          cash: Math.max(0, s.cash - cost),
          positions: {
            ...s.positions,
            [ticker]: { ticker, lots: [...pos.lots, { qty, price, at: Date.now() }] },
          },
          history: [...s.history, { type: "buy", ticker, qty, price, at: Date.now() }],
        };
        return next;
      }),
    [update]
  );

  const sell = useCallback(
    (ticker: string, qty: number, price: number) =>
      update((s) => {
        const pos = s.positions[ticker];
        if (!pos) return s;
        const owned = pos.lots.reduce((a, l) => a + l.qty, 0);
        const sellQty = Math.min(qty, owned);
        if (sellQty <= 0) return s;
        // reduce from earliest lots (FIFO)
        let remaining = sellQty;
        const lots: Lot[] = [];
        for (const lot of pos.lots) {
          if (remaining <= 0) {
            lots.push(lot);
            continue;
          }
          if (lot.qty <= remaining) {
            remaining -= lot.qty;
          } else {
            lots.push({ ...lot, qty: lot.qty - remaining });
            remaining = 0;
          }
        }
        const newPositions = { ...s.positions };
        if (lots.length === 0) delete newPositions[ticker];
        else newPositions[ticker] = { ticker, lots };
        return {
          ...s,
          cash: s.cash + sellQty * price,
          positions: newPositions,
          history: [...s.history, { type: "sell", ticker, qty: sellQty, price, at: Date.now() }],
        };
      }),
    [update]
  );

  // Adjust cash without affecting returns: shift `starting` baseline by the same amount.
  const addFunds = useCallback(
    (amount: number) =>
      update((s) => {
        if (amount <= 0 || s.starting == null) return s;
        return { ...s, cash: s.cash + amount, starting: s.starting + amount };
      }),
    [update]
  );

  const withdrawFunds = useCallback(
    (amount: number) =>
      update((s) => {
        if (amount <= 0 || s.starting == null) return s;
        const take = Math.min(amount, s.cash);
        if (take <= 0) return s;
        return { ...s, cash: s.cash - take, starting: Math.max(0, s.starting - take) };
      }),
    [update]
  );

  return { state, ready, setupStarting, reset, buy, sell, addFunds, withdrawFunds };
}

export const positionQty = (p: Position) => p.lots.reduce((a, l) => a + l.qty, 0);
export const positionInvested = (p: Position) =>
  p.lots.reduce((a, l) => a + l.qty * l.price, 0);
export const positionAvg = (p: Position) => {
  const q = positionQty(p);
  return q > 0 ? positionInvested(p) / q : 0;
};

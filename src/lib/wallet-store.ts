// Trading wallet state with localStorage persistence (per-user).
import { useEffect, useState, useCallback, useRef } from "react";

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
  // ETFs (liquid fund-based, Finnhub real-time)
  { ticker: "SPY", display: "SPY", name: "S&P 500", category: "etfs" },
  { ticker: "QQQ", display: "QQQ", name: "Nasdaq 100", category: "etfs" },
  { ticker: "VTI", display: "VTI", name: "Total US Market", category: "etfs" },
  { ticker: "VOO", display: "VOO", name: "Vanguard S&P 500", category: "etfs" },
  { ticker: "IWM", display: "IWM", name: "Russell 2000", category: "etfs" },
  { ticker: "DIA", display: "DIA", name: "Dow Jones 30", category: "etfs" },
  // Commodities (liquid ETFs, Finnhub real-time)
  { ticker: "GLD", display: "GLD", name: "Oro (SPDR Gold)", category: "commodities" },
  { ticker: "SLV", display: "SLV", name: "Plata (iShares Silver)", category: "commodities" },
  { ticker: "USO", display: "USO", name: "Petróleo (US Oil Fund)", category: "commodities" },
  { ticker: "UNG", display: "UNG", name: "Gas Natural (US Natural Gas)", category: "commodities" },
  { ticker: "CPER", display: "CPER", name: "Cobre (US Copper Index)", category: "commodities" },
  { ticker: "DBA", display: "DBA", name: "Agricultura (Invesco Agriculture)", category: "commodities" },
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

const LEGACY_KEY = "equit_wallet_v1";
const keyFor = (uid: string | null) => `equit_wallet_v1:${uid ?? "guest"}`;
const empty: WalletState = { starting: null, cash: 0, positions: {}, history: [] };

function load(uid: string | null): WalletState {
  if (typeof window === "undefined") return empty;
  try {
    let v = localStorage.getItem(keyFor(uid));
    // One-time migration of legacy unscoped wallet into the signed-in user's slot.
    if (!v && uid) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(keyFor(uid), legacy);
        localStorage.removeItem(LEGACY_KEY);
        v = legacy;
      }
    }
    return v ? { ...empty, ...(JSON.parse(v) as WalletState) } : empty;
  } catch {
    return empty;
  }
}
function persist(uid: string | null, s: WalletState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(s));
  } catch {}
}

export function useWallet(userId: string | null = null) {
  const [state, setState] = useState<WalletState>(empty);
  const [ready, setReady] = useState(false);
  const uidRef = useRef<string | null>(userId);

  // Reload when the active user changes (login / logout / switch).
  useEffect(() => {
    uidRef.current = userId;
    setState(load(userId));
    setReady(true);
  }, [userId]);

  const update = useCallback((mut: (s: WalletState) => WalletState) => {
    setState((prev) => {
      const next = mut(prev);
      persist(uidRef.current, next);
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

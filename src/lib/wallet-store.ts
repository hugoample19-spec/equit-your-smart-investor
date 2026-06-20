// Trading wallet state — persisted in Supabase (holdings, transactions, profiles).
// No localStorage. The wallet is loaded once the authenticated user.id is known.
import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  { ticker: "VOO", display: "VOO", name: "Vanguard S&P 500", category: "etfs" },
  { ticker: "IWM", display: "IWM", name: "Russell 2000", category: "etfs" },
  { ticker: "DIA", display: "DIA", name: "Dow Jones 30", category: "etfs" },
  // Commodities
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

// We store a single synthetic lot per ticker, derived from holdings.avg_cost
// (standard average-cost accounting). `lots` is kept as an array for backward
// compat with the existing UI helpers below.
export type Lot = { qty: number; price: number; at: number };
export type Position = { ticker: string; lots: Lot[] };

export type WalletState = {
  starting: number | null;
  cash: number;
  positions: Record<string, Position>;
  history: { type: "buy" | "sell"; ticker: string; qty: number; price: number; at: number }[];
};

const empty: WalletState = { starting: null, cash: 0, positions: {}, history: [] };

type ProfileWalletRow = {
  wallet_cash: number | null;
  wallet_starting: number | null;
  starting_balance: number | null;
};
type HoldingRow = { ticker: string; shares: number; avg_cost: number; updated_at: string };
type TxRow = {
  type: string;
  ticker: string;
  shares: number | null;
  price: number | null;
  amount: number | null;
  executed_at: string;
};

async function fetchWallet(uid: string): Promise<WalletState> {
  const [profileRes, holdingsRes, txRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("wallet_cash, wallet_starting, starting_balance")
      .eq("id", uid)
      .maybeSingle(),
    supabase.from("holdings").select("ticker, shares, avg_cost, updated_at").eq("user_id", uid),
    supabase
      .from("transactions")
      .select("type, ticker, shares, price, amount, executed_at")
      .eq("user_id", uid)
      .order("executed_at", { ascending: true }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (holdingsRes.error) throw holdingsRes.error;
  if (txRes.error) throw txRes.error;

  const profile = (profileRes.data ?? null) as ProfileWalletRow | null;
  const holdings = (holdingsRes.data ?? []) as HoldingRow[];
  const txs = (txRes.data ?? []) as TxRow[];

  const starting =
    profile?.wallet_starting != null
      ? Number(profile.wallet_starting)
      : profile?.starting_balance != null
      ? Number(profile.starting_balance)
      : null;
  const cash =
    profile?.wallet_cash != null
      ? Number(profile.wallet_cash)
      : starting ?? 0;

  const positions: Record<string, Position> = {};
  for (const h of holdings) {
    const qty = Number(h.shares);
    const price = Number(h.avg_cost);
    if (qty <= 0) continue;
    positions[h.ticker] = {
      ticker: h.ticker,
      lots: [{ qty, price, at: new Date(h.updated_at).getTime() }],
    };
  }

  const history: WalletState["history"] = [];
  for (const t of txs) {
    if (t.type !== "buy" && t.type !== "sell") continue;
    history.push({
      type: t.type,
      ticker: t.ticker,
      qty: Number(t.shares ?? 0),
      price: Number(t.price ?? 0),
      at: new Date(t.executed_at).getTime(),
    });
  }

  return { starting, cash, positions, history };
}

export function useWallet(userId: string | null = null) {
  const qc = useQueryClient();
  const enabled = !!userId;

  const query = useQuery({
    queryKey: ["wallet", userId],
    queryFn: () => fetchWallet(userId!),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const state: WalletState = query.data ?? empty;
  // `ready` is true only once Supabase has actually returned data.
  const ready = enabled && query.isSuccess;

  const writeCash = useCallback(
    async (uid: string, cash: number, starting?: number) => {
      const patch: { wallet_cash: number; wallet_starting?: number } = { wallet_cash: cash };
      if (starting !== undefined) patch.wallet_starting = starting;
      const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
      if (error) throw error;
    },
    [],
  );

  const setupStartingMut = useMutation({
    mutationFn: async (amount: number) => {
      if (!userId) throw new Error("no-user");
      await writeCash(userId, amount, amount);
      // Reset any pre-existing holdings/transactions if user explicitly sets a starting amount.
      await supabase.from("holdings").delete().eq("user_id", userId);
      await supabase.from("transactions").delete().eq("user_id", userId);
      const next: WalletState = { starting: amount, cash: amount, positions: {}, history: [] };
      return next;
    },
    onSuccess: (next) => qc.setQueryData(["wallet", userId], next),
  });

  const resetMut = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("no-user");
      const cur = qc.getQueryData<WalletState>(["wallet", userId]) ?? state;
      if (cur.starting == null) return cur;
      await writeCash(userId, cur.starting, cur.starting);
      await supabase.from("holdings").delete().eq("user_id", userId);
      await supabase.from("transactions").delete().eq("user_id", userId);
      return { starting: cur.starting, cash: cur.starting, positions: {}, history: [] } as WalletState;
    },
    onSuccess: (next) => qc.setQueryData(["wallet", userId], next),
  });

  const buyMut = useMutation({
    mutationFn: async (args: { ticker: string; qty: number; price: number }) => {
      if (!userId) throw new Error("no-user");
      const { ticker, qty, price } = args;
      const cur = qc.getQueryData<WalletState>(["wallet", userId]) ?? state;
      const cost = qty * price;
      if (cost > cur.cash + 0.0001) return cur;

      const prevPos = cur.positions[ticker];
      const prevQty = prevPos ? prevPos.lots.reduce((a, l) => a + l.qty, 0) : 0;
      const prevInvested = prevPos ? prevPos.lots.reduce((a, l) => a + l.qty * l.price, 0) : 0;
      const newQty = prevQty + qty;
      const newAvg = newQty > 0 ? (prevInvested + cost) / newQty : 0;
      const name = findAsset(ticker)?.name ?? ticker;
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();
      const newCash = Math.max(0, cur.cash - cost);

      const { error: hErr } = await supabase
        .from("holdings")
        .upsert(
          { user_id: userId, ticker, name, shares: newQty, avg_cost: newAvg, updated_at: nowIso },
          { onConflict: "user_id,ticker" },
        );
      if (hErr) throw hErr;

      const { error: tErr } = await supabase.from("transactions").insert({
        user_id: userId,
        ticker,
        name,
        type: "buy",
        shares: qty,
        price,
        amount: cost,
        executed_at: nowIso,
      });
      if (tErr) throw tErr;

      await writeCash(userId, newCash);

      const next: WalletState = {
        ...cur,
        cash: newCash,
        positions: {
          ...cur.positions,
          [ticker]: { ticker, lots: [{ qty: newQty, price: newAvg, at: nowMs }] },
        },
        history: [...cur.history, { type: "buy", ticker, qty, price, at: nowMs }],
      };
      return next;
    },
    onSuccess: (next) => qc.setQueryData(["wallet", userId], next),
  });

  const sellMut = useMutation({
    mutationFn: async (args: { ticker: string; qty: number; price: number }) => {
      if (!userId) throw new Error("no-user");
      const { ticker, qty, price } = args;
      const cur = qc.getQueryData<WalletState>(["wallet", userId]) ?? state;
      const pos = cur.positions[ticker];
      if (!pos) return cur;
      const owned = pos.lots.reduce((a, l) => a + l.qty, 0);
      const sellQty = Math.min(qty, owned);
      if (sellQty <= 0) return cur;
      const avg = pos.lots[0]?.price ?? 0;
      const remaining = owned - sellQty;
      const proceeds = sellQty * price;
      const name = findAsset(ticker)?.name ?? ticker;
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();
      const newCash = cur.cash + proceeds;

      if (remaining <= 0.0000001) {
        const { error } = await supabase
          .from("holdings")
          .delete()
          .eq("user_id", userId)
          .eq("ticker", ticker);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("holdings")
          .update({ shares: remaining, avg_cost: avg, updated_at: nowIso })
          .eq("user_id", userId)
          .eq("ticker", ticker);
        if (error) throw error;
      }

      const { error: tErr } = await supabase.from("transactions").insert({
        user_id: userId,
        ticker,
        name,
        type: "sell",
        shares: sellQty,
        price,
        amount: proceeds,
        executed_at: nowIso,
      });
      if (tErr) throw tErr;

      await writeCash(userId, newCash);

      const newPositions = { ...cur.positions };
      if (remaining <= 0.0000001) delete newPositions[ticker];
      else newPositions[ticker] = { ticker, lots: [{ qty: remaining, price: avg, at: nowMs }] };

      const next: WalletState = {
        ...cur,
        cash: newCash,
        positions: newPositions,
        history: [...cur.history, { type: "sell", ticker, qty: sellQty, price, at: nowMs }],
      };
      return next;
    },
    onSuccess: (next) => qc.setQueryData(["wallet", userId], next),
  });

  const addFundsMut = useMutation({
    mutationFn: async (amount: number) => {
      if (!userId) throw new Error("no-user");
      const cur = qc.getQueryData<WalletState>(["wallet", userId]) ?? state;
      if (amount <= 0 || cur.starting == null) return cur;
      const newCash = cur.cash + amount;
      const newStarting = cur.starting + amount;
      await writeCash(userId, newCash, newStarting);
      await supabase.from("transactions").insert({
        user_id: userId,
        ticker: "CASH",
        type: "deposit",
        amount,
        executed_at: new Date().toISOString(),
      });
      return { ...cur, cash: newCash, starting: newStarting } as WalletState;
    },
    onSuccess: (next) => qc.setQueryData(["wallet", userId], next),
  });

  const withdrawFundsMut = useMutation({
    mutationFn: async (amount: number) => {
      if (!userId) throw new Error("no-user");
      const cur = qc.getQueryData<WalletState>(["wallet", userId]) ?? state;
      if (amount <= 0 || cur.starting == null) return cur;
      const take = Math.min(amount, cur.cash);
      if (take <= 0) return cur;
      const newCash = cur.cash - take;
      const newStarting = Math.max(0, cur.starting - take);
      await writeCash(userId, newCash, newStarting);
      await supabase.from("transactions").insert({
        user_id: userId,
        ticker: "CASH",
        type: "withdraw",
        amount: take,
        executed_at: new Date().toISOString(),
      });
      return { ...cur, cash: newCash, starting: newStarting } as WalletState;
    },
    onSuccess: (next) => qc.setQueryData(["wallet", userId], next),
  });

  const setupStarting = useCallback((n: number) => { setupStartingMut.mutate(n); }, [setupStartingMut]);
  const reset = useCallback(() => { resetMut.mutate(); }, [resetMut]);
  const buy = useCallback((t: string, q: number, p: number) => { buyMut.mutate({ ticker: t, qty: q, price: p }); }, [buyMut]);
  const sell = useCallback((t: string, q: number, p: number) => { sellMut.mutate({ ticker: t, qty: q, price: p }); }, [sellMut]);
  const addFunds = useCallback((n: number) => { addFundsMut.mutate(n); }, [addFundsMut]);
  const withdrawFunds = useCallback((n: number) => { withdrawFundsMut.mutate(n); }, [withdrawFundsMut]);

  return useMemo(
    () => ({ state, ready, setupStarting, reset, buy, sell, addFunds, withdrawFunds }),
    [state, ready, setupStarting, reset, buy, sell, addFunds, withdrawFunds],
  );
}

export const positionQty = (p: Position) => p.lots.reduce((a, l) => a + l.qty, 0);
export const positionInvested = (p: Position) =>
  p.lots.reduce((a, l) => a + l.qty * l.price, 0);
export const positionAvg = (p: Position) => {
  const q = positionQty(p);
  return q > 0 ? positionInvested(p) / q : 0;
};

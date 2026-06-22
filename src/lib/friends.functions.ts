import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


type LeaderRow = {
  code: string;
  name: string;
  perf: number | null;
  totalValue: number | null;
  isPublic: boolean;
  isMe?: boolean;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  username: string | null;
  friend_code: string;
  is_portfolio_public: boolean;
  wallet_cash: number | null;
  wallet_starting: number | null;
  starting_balance: number | null;
};

async function computePerf(
  supabase: SupabaseClient,
  profiles: ProfileLite[],
): Promise<Map<string, { perf: number | null; totalValue: number | null }>> {

  const out = new Map<string, { perf: number | null; totalValue: number | null }>();
  const ids = profiles.map((p) => p.id);
  if (ids.length === 0) return out;

  const { data: holdings } = await supabase
    .from("holdings")
    .select("user_id, ticker, shares, avg_cost")
    .in("user_id", ids);

  const tickers = Array.from(new Set((holdings ?? []).map((h) => h.ticker as string)));
  const priceMap = new Map<string, number>();
  if (tickers.length > 0) {
    const { data: prices } = await supabase
      .from("price_cache")
      .select("ticker, price")
      .in("ticker", tickers);
    for (const p of prices ?? []) priceMap.set(p.ticker as string, Number(p.price));
  }

  const byUser = new Map<string, { user_id: string; ticker: string; shares: number; avg_cost: number }[]>();
  for (const h of holdings ?? []) {
    const arr = byUser.get(h.user_id as string) ?? [];
    arr.push({
      user_id: h.user_id as string,
      ticker: h.ticker as string,
      shares: Number(h.shares),
      avg_cost: Number(h.avg_cost),
    });
    byUser.set(h.user_id as string, arr);
  }

  for (const p of profiles) {
    if (!p.is_portfolio_public) {
      out.set(p.id, { perf: null, totalValue: null });
      continue;
    }
    const starting =
      p.wallet_starting != null
        ? Number(p.wallet_starting)
        : p.starting_balance != null
          ? Number(p.starting_balance)
          : 0;
    const cash = p.wallet_cash != null ? Number(p.wallet_cash) : starting;
    const hs = byUser.get(p.id) ?? [];
    let marketValue = 0;
    for (const h of hs) {
      const px = priceMap.get(h.ticker);
      marketValue += h.shares * (px ?? h.avg_cost);
    }
    const totalValue = cash + marketValue;
    const perf = starting > 0 ? ((totalValue - starting) / starting) * 100 : 0;
    out.set(p.id, { perf, totalValue });
  }
  return out;
}

export const addFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => ({ code: String(d.code).trim() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase
      .from("profiles")
      .select("friend_code")
      .eq("id", userId)
      .maybeSingle();
    if (me?.friend_code === data.code) return { ok: false as const, reason: "self" as const };

    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("friend_code", data.code)
      .maybeSingle();
    if (!target) return { ok: false as const, reason: "not_found" as const };

    const { error } = await supabase
      .from("friendships")
      .insert({ user_id: userId, friend_id: target.id });
    if (error) {
      if (error.code === "23505") return { ok: false as const, reason: "already_added" as const };
      throw error;
    }
    return { ok: true as const };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => ({ code: String(d.code).trim() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("friend_code", data.code)
      .maybeSingle();
    if (!target) return { ok: true as const };
    await supabase
      .from("friendships")
      .delete()
      .eq("user_id", userId)
      .eq("friend_id", target.id);
    return { ok: true as const };
  });

export const getFriendsLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeaderRow[]> => {
    const { supabase, userId } = context;
    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);
    const ids = (friendships ?? []).map((f) => f.friend_id as string);
    if (ids.length === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, display_name, username, friend_code, is_portfolio_public, wallet_cash, wallet_starting, starting_balance",
      )
      .in("id", ids);
    const list = (profiles ?? []) as ProfileLite[];
    const perfs = await computePerf(supabase, list);
    const rows: LeaderRow[] = list.map((p) => {
      const m = perfs.get(p.id) ?? { perf: null, totalValue: null };
      return {
        code: p.friend_code,
        name: p.display_name ?? p.username ?? "Sin nombre",
        perf: m.perf,
        totalValue: m.totalValue,
        isPublic: p.is_portfolio_public,
      };
    });
    rows.sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity));
    return rows;
  });

export const getGlobalLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeaderRow[]> => {
    const { supabase, userId } = context;
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, display_name, username, friend_code, is_portfolio_public, wallet_cash, wallet_starting, starting_balance",
      )
      .eq("is_premium", true)
      .eq("is_portfolio_public", true);
    const list = (profiles ?? []) as ProfileLite[];
    const perfs = await computePerf(supabase, list);
    const rows: LeaderRow[] = list.map((p) => {
      const m = perfs.get(p.id) ?? { perf: null, totalValue: null };
      return {
        code: p.friend_code,
        name: p.display_name ?? p.username ?? "Sin nombre",
        perf: m.perf,
        totalValue: m.totalValue,
        isPublic: p.is_portfolio_public,
        isMe: p.id === userId,
      };
    });
    rows.sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity));
    return rows.slice(0, 10);
  });

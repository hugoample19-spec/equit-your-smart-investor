import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  addFriend as addFriendFn,
  removeFriend as removeFriendFn,
  getFriendsLeaderboard,
} from "@/lib/friends.functions";

export type FriendLeaderRow = {
  code: string;
  name: string;
  perf: number | null;
  totalValue: number | null;
  isPublic: boolean;
};


export type Holding = {
  ticker: string;
  name: string;
  pct: number;
  perf: number;
};

export type SectorAffinity = {
  sector: string;
  direction: "favors" | "avoids";
};

export type Investor = {
  id: string;
  name: string;
  fund: string;
  netWorth: string;
  photo: string;
  color: string;
  locked: boolean;
  bio: string;
  holdings: Holding[];
  sectorAffinity: SectorAffinity[];
};

export type Portfolio = {
  fromInvestor?: string;
  budget: number;
  holdings: { ticker: string; name: string; pct: number; amount: number; perf: number }[];
} | null;

export type ChatMessage = { from: "me" | "them"; text: string; at: number };

export type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  friend_code: string;
  starting_balance: number | null;
  onboarded: boolean;
  is_portfolio_public: boolean;
  favorite_referente_id: string | null;
  is_premium: boolean;
};

type AppState = {
  // Auth
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;


  // Existing local state
  username: string;
  fullName: string;
  setFullName: (s: string) => Promise<{ ok: boolean; error?: string }>;
  setUsername: (s: string) => void;
  avatar: string | null;
  setAvatar: (s: string | null) => void;
  isPremium: boolean;
  setIsPremium: (b: boolean) => void;
  budget: number;
  setBudget: (n: number) => void;
  portfolio: Portfolio;
  setPortfolio: (p: Portfolio) => void;
  pendingCopy: Investor | null;
  setPendingCopy: (i: Investor | null) => void;
  friendCode: string;
  favoriteReferenteId: string | null;
  setFavoriteReferente: (id: string | null) => void;
  isPortfolioPublic: boolean;
  setIsPortfolioPublic: (b: boolean) => void;
  friendsLeaderboard: FriendLeaderRow[];
  friendsLoading: boolean;
  addFriend: (code: string) => Promise<{ ok: boolean; reason?: string }>;
  removeFriend: (code: string) => Promise<void>;

  chats: Record<string, ChatMessage[]>;
  sendMessage: (code: string, text: string) => void;
  streak: { current: number; longest: number; lastReadDate: string | null };
  streakReady: boolean;
  markNewsRead: () => Promise<void>;
  seenFilingDates: Record<string, string>;
  markFilingSeen: (investorId: string, date: string) => void;
};

const Ctx = createContext<AppState | null>(null);

const genCode = () => Math.floor(10000000 + Math.random() * 90000000).toString();

function load<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function save(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

// Compute YYYY-MM-DD in Europe/Madrid timezone (consistent with how the
// streak is stored in Supabase news_reads.read_date).
export function madridDateISO(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function prevDateISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [username, setUsername] = useState("alexmtz");
  const [fullName, setFullName] = useState("Alejandro Martínez");
  const [avatar, setAvatarState] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [budget, setBudget] = useState(5000);
  const [portfolio, setPortfolio] = useState<Portfolio>(null);
  const [pendingCopy, setPendingCopy] = useState<Investor | null>(null);

  const [friendCode, setFriendCode] = useState<string>("00000000");
  const [favoriteReferenteId, setFavoriteState] = useState<string | null>(null);
  const [isPortfolioPublic, setPortfolioPublicState] = useState(true);
  
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [streak, setStreak] = useState<{ current: number; longest: number; lastReadDate: string | null }>({ current: 0, longest: 0, lastReadDate: null });
  const [streakReady, setStreakReady] = useState(false);
  const [seenFilingDates, setSeenFilingDates] = useState<Record<string, string>>({});

  // Load local state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = localStorage.getItem("equit_avatar");
    if (a) setAvatarState(a);
    let code = localStorage.getItem("equit_friend_code");
    if (!code) { code = genCode(); localStorage.setItem("equit_friend_code", code); }
    setFriendCode(code);
    setFavoriteState(load<string | null>("equit_fav_ref", null));
    setPortfolioPublicState(load<boolean>("equit_portfolio_public", true));
    
    setChats(load<Record<string, ChatMessage[]>>("equit_chats", {}));
    // Do NOT hydrate streak from localStorage — we wait for the authoritative
    // Supabase rebuild to avoid a flash of stale value (streakReady gates UI).
    setSeenFilingDates(load<Record<string, string>>("equit_seen_filings", {}));
  }, []);

  // Auth: subscribe to session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Hydrate profile when user changes
  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!data) return;
    setProfile(data as Profile);
    if (data.display_name) setFullName(data.display_name);
    if (data.username) setUsername(data.username);
    if (data.avatar_url) setAvatarState(data.avatar_url);
    if (data.friend_code) setFriendCode(data.friend_code);
    if (data.starting_balance) setBudget(Number(data.starting_balance));
    setPortfolioPublicState(data.is_portfolio_public);
    setFavoriteState(data.favorite_referente_id);
    setIsPremium(!!(data as { is_premium?: boolean }).is_premium);

    // Rebuild streak from authoritative server-side news_reads log,
    // using Europe/Madrid as the canonical calendar day.
    try {
      const { data: reads } = await supabase
        .from("news_reads")
        .select("read_date")
        .eq("user_id", uid)
        .order("read_date", { ascending: false })
        .limit(400);
      const set = new Set((reads ?? []).map((r) => r.read_date as string));
      let current = 0;
      let cursor = madridDateISO();
      // Streak counts from today (or yesterday if today not yet read).
      if (!set.has(cursor)) cursor = prevDateISO(cursor);
      while (set.has(cursor)) {
        current += 1;
        cursor = prevDateISO(cursor);
      }
      const lastReadDate = (reads && reads[0]?.read_date as string) ?? null;
      const local = load<{ current: number; longest: number; lastReadDate: string | null }>(
        "equit_streak",
        { current: 0, longest: 0, lastReadDate: null },
      );
      const next = {
        current,
        longest: Math.max(current, local.longest),
        lastReadDate,
      };
      setStreak(next);
      save("equit_streak", next);
    } catch { /* offline ok */ }
    setStreakReady(true);
  };
  useEffect(() => {
    if (!user) { setProfile(null); setStreakReady(true); return; }
    setStreakReady(false);
    loadProfile(user.id);
  }, [user]);

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("[auth] signOut error:", error);
    } catch (e) {
      console.error("[auth] signOut threw:", e);
    }
    setUser(null);
    setProfile(null);
    setStreak({ current: 0, longest: 0, lastReadDate: null });
    setStreakReady(true);
    if (typeof window !== "undefined") {
      try {
        // Best-effort clear of cached Supabase session keys so we don't
        // rehydrate the signed-out user on next mount.
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") || k === "equit_streak")
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* ignore */ }
    }
  };

  const setAvatar = (s: string | null) => {
    setAvatarState(s);
    if (typeof window !== "undefined") {
      if (s) localStorage.setItem("equit_avatar", s);
      else localStorage.removeItem("equit_avatar");
    }
    if (user) supabase.from("profiles").update({ avatar_url: s }).eq("id", user.id);
  };

  const setFullNamePersist = async (s: string): Promise<{ ok: boolean; error?: string }> => {
    const trimmed = s.trim();
    if (!trimmed) return { ok: false, error: "El nombre no puede estar vacío" };
    if (trimmed === fullName) return { ok: true };
    // Uniqueness check
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("display_name", trimmed)
        .limit(1);
      if (existing && existing.length > 0 && (!user || existing[0].id !== user.id)) {
        return { ok: false, error: "Este nombre ya está en uso" };
      }
    } catch { /* allow offline */ }
    setFullName(trimmed);
    if (user) {
      const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
      if (error) return { ok: false, error: "No se pudo guardar" };
    }
    return { ok: true };
  };


  const setFavoriteReferente = (id: string | null) => {
    setFavoriteState(id);
    save("equit_fav_ref", id);
    if (user) supabase.from("profiles").update({ favorite_referente_id: id }).eq("id", user.id);
  };
  const setIsPortfolioPublic = (b: boolean) => {
    setPortfolioPublicState(b);
    save("equit_portfolio_public", b);
    if (user) supabase.from("profiles").update({ is_portfolio_public: b }).eq("id", user.id);
  };
  const addFriendCall = useServerFn(addFriendFn);
  const removeFriendCall = useServerFn(removeFriendFn);
  const getFriendsLeaderboardFn = useServerFn(getFriendsLeaderboard);
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ["friends-leaderboard", user?.id ?? null],
    queryFn: () => getFriendsLeaderboardFn(),
    enabled: !!user,
    staleTime: 60_000,
  });
  const friendsLeaderboard: FriendLeaderRow[] = friendsQuery.data ?? [];
  const invalidateFriends = () =>
    queryClient.invalidateQueries({ queryKey: ["friends-leaderboard"] });

  const addFriend = async (code: string) => {
    try {
      const res = await addFriendCall({ data: { code } });
      if (res.ok) invalidateFriends();
      return res;
    } catch (e) {
      console.error("[friends] addFriend failed:", e);
      return { ok: false, reason: "error" };
    }
  };
  const removeFriend = async (code: string) => {
    try {
      await removeFriendCall({ data: { code } });
      invalidateFriends();
    } catch (e) {
      console.error("[friends] removeFriend failed:", e);
    }
  };

  const sendMessage = (code: string, text: string) => {
    setChats((prev) => {
      const list = prev[code] ?? [];
      const next = { ...prev, [code]: [...list, { from: "me" as const, text, at: Date.now() }] };
      save("equit_chats", next);
      return next;
    });
  };

  const markNewsRead = async () => {
    const today = madridDateISO();
    const yesterday = prevDateISO(today);
    // No-op if already marked today (avoid duplicate writes/toasts)
    if (streak.lastReadDate === today) {
      console.log("[streak] already marked today:", today);
      return;
    }
    // Persist to Supabase FIRST (only authoritative source). If not signed in,
    // fall back to local-only optimistic update.
    if (user) {
      try {
        const { data, error } = await supabase
          .from("news_reads")
          .upsert(
            { user_id: user.id, read_date: today },
            { onConflict: "user_id,read_date" },
          )
          .select();
        if (error) {
          console.error("[streak] news_reads upsert FAILED:", error);
          toast.error("No se pudo guardar tu racha, inténtalo de nuevo");
          return;
        }
        console.log("[streak] news_reads upsert OK for", today, data);
      } catch (e) {
        console.error("[streak] news_reads upsert threw:", e);
        toast.error("No se pudo guardar tu racha, inténtalo de nuevo");
        return;
      }
    }
    // Write succeeded (or no user) — update local optimistic streak.
    setStreak((prev) => {
      if (prev.lastReadDate === today) return prev;
      const current = prev.lastReadDate === yesterday ? prev.current + 1 : 1;
      const next = { current, longest: Math.max(current, prev.longest), lastReadDate: today };
      save("equit_streak", next);
      return next;
    });
  };

  const markFilingSeen = (investorId: string, date: string) => {
    setSeenFilingDates((prev) => {
      if (prev[investorId] === date) return prev;
      const next = { ...prev, [investorId]: date };
      save("equit_seen_filings", next);
      return next;
    });
  };

  const setIsPremiumPersist = (b: boolean) => {
    setIsPremium(b);
    if (user) {
      supabase.from("profiles").update({ is_premium: b }).eq("id", user.id).then(({ error }) => {
        if (error) console.error("Failed to persist is_premium:", error);
      });
    }
  };

  return (
    <Ctx.Provider value={{
      user, profile, isAuthenticated: !!user, authLoading, signOut, refreshProfile,
      username, setUsername, fullName, setFullName: setFullNamePersist,
      avatar, setAvatar, isPremium, setIsPremium: setIsPremiumPersist,
      budget, setBudget, portfolio, setPortfolio,
      pendingCopy, setPendingCopy,
      friendCode, favoriteReferenteId, setFavoriteReferente,
      isPortfolioPublic, setIsPortfolioPublic,
      friendsLeaderboard, friendsLoading: friendsQuery.isLoading, addFriend, removeFriend,
      chats, sendMessage,
      streak, streakReady, markNewsRead,
      seenFilingDates, markFilingSeen,
    }}>

      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

// Alias for auth-only consumers
export function useAuth() {
  const { user, profile, isAuthenticated, authLoading, signOut } = useApp();
  return { user, profile, isAuthenticated, authLoading, signOut };
}

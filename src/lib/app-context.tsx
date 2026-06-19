import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Holding = {
  ticker: string;
  name: string;
  pct: number;
  perf: number;
};

export type Investor = {
  id: string;
  name: string;
  fund: string;
  netWorth: string;
  photo: string;
  locked: boolean;
  bio: string;
  holdings: Holding[];
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
  setFullName: (s: string) => void;
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
  friendCodes: string[];
  addFriend: (code: string) => void;
  removeFriend: (code: string) => void;
  chats: Record<string, ChatMessage[]>;
  sendMessage: (code: string, text: string) => void;
  streak: { current: number; longest: number; lastReadDate: string | null };
  markNewsRead: () => void;
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
  const [friendCodes, setFriendCodes] = useState<string[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [streak, setStreak] = useState<{ current: number; longest: number; lastReadDate: string | null }>({ current: 0, longest: 0, lastReadDate: null });
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
    setFriendCodes(load<string[]>("equit_friends", ["47392810", "82910374", "65103982"]));
    setChats(load<Record<string, ChatMessage[]>>("equit_chats", {}));
    setStreak(load("equit_streak", { current: 0, longest: 0, lastReadDate: null as string | null }));
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
  };
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    loadProfile(user.id);
  }, [user]);

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const setAvatar = (s: string | null) => {
    setAvatarState(s);
    if (typeof window !== "undefined") {
      if (s) localStorage.setItem("equit_avatar", s);
      else localStorage.removeItem("equit_avatar");
    }
    if (user) supabase.from("profiles").update({ avatar_url: s }).eq("id", user.id);
  };

  const setFullNamePersist = (s: string) => {
    setFullName(s);
    if (user) supabase.from("profiles").update({ display_name: s }).eq("id", user.id);
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
  const addFriend = (code: string) => {
    setFriendCodes((prev) => {
      if (prev.includes(code)) return prev;
      const next = [...prev, code];
      save("equit_friends", next);
      return next;
    });
  };
  const removeFriend = (code: string) => {
    setFriendCodes((prev) => {
      const next = prev.filter((c) => c !== code);
      save("equit_friends", next);
      return next;
    });
  };
  const sendMessage = (code: string, text: string) => {
    setChats((prev) => {
      const list = prev[code] ?? [];
      const next = { ...prev, [code]: [...list, { from: "me" as const, text, at: Date.now() }] };
      save("equit_chats", next);
      return next;
    });
  };

  const markNewsRead = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStreak((prev) => {
      if (prev.lastReadDate === today) return prev;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = y.toISOString().slice(0, 10);
      const current = prev.lastReadDate === yesterday ? prev.current + 1 : 1;
      const next = { current, longest: Math.max(current, prev.longest), lastReadDate: today };
      save("equit_streak", next);
      return next;
    });
    // Also log to Supabase if authenticated (server-side tracking for notifications)
    if (user) {
      const madridDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })).toISOString().slice(0, 10);
      supabase.from("news_reads").upsert({ user_id: user.id, read_date: madridDate }, { onConflict: "user_id,read_date" });
    }
  };

  const markFilingSeen = (investorId: string, date: string) => {
    setSeenFilingDates((prev) => {
      if (prev[investorId] === date) return prev;
      const next = { ...prev, [investorId]: date };
      save("equit_seen_filings", next);
      return next;
    });
  };

  return (
    <Ctx.Provider value={{
      user, profile, isAuthenticated: !!user, authLoading, signOut, refreshProfile,
      username, setUsername, fullName, setFullName: setFullNamePersist,
      avatar, setAvatar, isPremium, setIsPremium,
      budget, setBudget, portfolio, setPortfolio,
      pendingCopy, setPendingCopy,
      friendCode, favoriteReferenteId, setFavoriteReferente,
      isPortfolioPublic, setIsPortfolioPublic,
      friendCodes, addFriend, removeFriend,
      chats, sendMessage,
      streak, markNewsRead,
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

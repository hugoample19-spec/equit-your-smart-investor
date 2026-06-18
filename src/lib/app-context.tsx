import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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

type AppState = {
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
  // new
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
};

const Ctx = createContext<AppState | null>(null);

const genCode = () => Math.floor(10000000 + Math.random() * 90000000).toString();

function load<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = localStorage.getItem("equit_avatar");
    if (a) setAvatarState(a);

    let code = localStorage.getItem("equit_friend_code");
    if (!code) {
      code = genCode();
      localStorage.setItem("equit_friend_code", code);
    }
    setFriendCode(code);

    setFavoriteState(load<string | null>("equit_fav_ref", null));
    setPortfolioPublicState(load<boolean>("equit_portfolio_public", true));
    setFriendCodes(load<string[]>("equit_friends", ["47392810", "82910374", "65103982"]));
    setChats(load<Record<string, ChatMessage[]>>("equit_chats", {}));
  }, []);

  const setAvatar = (s: string | null) => {
    setAvatarState(s);
    if (typeof window !== "undefined") {
      if (s) localStorage.setItem("equit_avatar", s);
      else localStorage.removeItem("equit_avatar");
    }
  };

  const setFavoriteReferente = (id: string | null) => {
    setFavoriteState(id);
    save("equit_fav_ref", id);
  };
  const setIsPortfolioPublic = (b: boolean) => {
    setPortfolioPublicState(b);
    save("equit_portfolio_public", b);
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

  return (
    <Ctx.Provider value={{
      username, setUsername, fullName, setFullName,
      avatar, setAvatar, isPremium, setIsPremium,
      budget, setBudget, portfolio, setPortfolio,
      pendingCopy, setPendingCopy,
      friendCode, favoriteReferenteId, setFavoriteReferente,
      isPortfolioPublic, setIsPortfolioPublic,
      friendCodes, addFriend, removeFriend,
      chats, sendMessage,
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

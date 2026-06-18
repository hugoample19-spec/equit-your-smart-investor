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
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState("alexmtz");
  const [fullName, setFullName] = useState("Alejandro Martínez");
  const [avatar, setAvatarState] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [budget, setBudget] = useState(5000);
  const [portfolio, setPortfolio] = useState<Portfolio>(null);
  const [pendingCopy, setPendingCopy] = useState<Investor | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = localStorage.getItem("equit_avatar");
    if (a) setAvatarState(a);
  }, []);

  const setAvatar = (s: string | null) => {
    setAvatarState(s);
    if (typeof window !== "undefined") {
      if (s) localStorage.setItem("equit_avatar", s);
      else localStorage.removeItem("equit_avatar");
    }
  };

  return (
    <Ctx.Provider value={{
      username, setUsername, fullName, setFullName,
      avatar, setAvatar, isPremium, setIsPremium,
      budget, setBudget, portfolio, setPortfolio,
      pendingCopy, setPendingCopy,
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

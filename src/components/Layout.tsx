import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Users, Newspaper, Wallet, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/referentes", label: "Referentes", icon: Users },
  { to: "/noticias", label: "Noticias", icon: Newspaper },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#E5E0D5" }}>
      <div className="w-full max-w-[430px] min-h-screen relative flex flex-col" style={{ background: "var(--cream)" }}>
        <header className="pt-5 pb-3 flex items-center justify-center">
          <Link to="/" className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>
            Equit<span style={{ color: "var(--gold)" }}>.</span>
          </Link>
        </header>
        <main className="flex-1 pb-24 px-5">{children}</main>
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t z-50" style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-5 py-2 pb-3">
            {tabs.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link key={to} to={to} className="flex flex-col items-center gap-1 py-1.5">
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.6} style={{ color: active ? "var(--navy)" : "#9A9AAB" }} />
                  <span className="text-[10px] font-medium tracking-wide" style={{ color: active ? "var(--navy)" : "#9A9AAB" }}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

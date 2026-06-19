import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, Users, Newspaper, Wallet, User, Bell } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/referentes", label: "Referentes", icon: Users },
  { to: "/noticias", label: "Noticias", icon: Newspaper },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

const PUBLIC_PATHS = ["/auth"];

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, user, profile } = useApp();
  const [unread, setUnread] = useState(0);

  // Soft auth gate: redirect to /auth when not signed in (except for /auth itself)
  useEffect(() => {
    if (authLoading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isAuthenticated && !isPublic) {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, authLoading, pathname, navigate]);

  // Onboarding gate
  useEffect(() => {
    if (!profile) return;
    if (!profile.onboarded && pathname !== "/onboarding" && pathname !== "/auth") {
      navigate({ to: "/onboarding" });
    }
  }, [profile, pathname, navigate]);

  // Unread notification count
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let mounted = true;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (mounted) setUnread(count ?? 0);
    };
    load();
    const channel = supabase.channel(`notif-${user.id}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
      () => load(),
    ).subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [user]);

  const showChrome = pathname !== "/auth" && pathname !== "/onboarding";

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#E5E0D5" }}>
      <div className="w-full max-w-[430px] min-h-screen relative flex flex-col" style={{ background: "var(--cream)" }}>
        {showChrome && (
          <header className="pt-5 pb-3 px-5 flex items-center justify-between">
            <div className="w-9" />
            <Link to="/" className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>
              Equit<span style={{ color: "var(--gold)" }}>.</span>
            </Link>
            <Link to="/notificaciones" className="w-9 h-9 rounded-full flex items-center justify-center relative" aria-label="Notificaciones">
              <Bell size={20} style={{ color: "var(--navy)" }} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-semibold flex items-center justify-center" style={{ background: "var(--gold)", color: "var(--navy)" }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </header>
        )}
        <main className={`flex-1 px-5 ${showChrome ? "pb-24" : "pb-6"}`}>{children}</main>
        {showChrome && (
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
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, ArrowUpRight, Lock, Users } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { investors, globalUsers, trendingStocks } from "@/lib/data";
import { usePortfolioSummary } from "@/lib/portfolio";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Equit · Home" },
      { name: "description", content: "Tu portfolio, los movimientos de los grandes y el leaderboard de la semana." },
    ],
  }),
  component: HomePage,
});

const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function HomePage() {
  const { fullName, username, profile, friendCodes } = useApp();
  const summary = usePortfolioSummary();

  const displayName = (profile?.display_name?.trim() || fullName?.trim() || username || "").trim();
  const firstName = displayName.split(" ")[0] || displayName;

  const myFriends = globalUsers
    .filter((u) => friendCodes.includes(u.code))
    .sort((a, b) => b.perf - a.perf);
  const global = [...globalUsers].sort((a, b) => b.perf - a.perf).slice(0, 8);

  const eur = summary.totalValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [intPart, decPart] = eur.split(",");
  const gainColor = summary.totalReturn >= 0 ? "#5BD2A5" : "#FF7A8A";
  const gainSign = summary.totalReturn >= 0 ? "+" : "";

  return (
    <div className="space-y-6">
      {/* Portfolio card */}
      <section className="rounded-3xl p-6 shadow-card" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <p className="text-xs" style={{ color: "rgba(250,248,245,0.6)" }}>Hola, {firstName}</p>
        {summary.hasWallet ? (
          <>
            <h1 className="mt-2 text-[40px] leading-none font-semibold tracking-tight tabular-nums">
              €{intPart}<span style={{ color: "var(--gold)" }}>,</span>{decPart ?? "00"}
            </h1>
            <p className="mt-3 text-sm" style={{ color: gainColor }}>
              {gainSign}€{Math.abs(summary.totalReturn).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {gainSign}{summary.totalReturnPct.toFixed(2)}%
              <span style={{ color: "rgba(250,248,245,0.5)" }} className="ml-1">rendimiento total</span>
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-[40px] leading-none font-semibold tracking-tight">€0<span style={{ color: "var(--gold)" }}>,</span>00</h1>
            <p className="mt-3 text-sm" style={{ color: "rgba(250,248,245,0.6)" }}>Aún no has creado tu cartera</p>
          </>
        )}
        <div className="mt-5 flex gap-2">
          <Link to="/wallet" className="flex-1 py-2.5 rounded-full border text-sm font-medium text-center" style={{ borderColor: "rgba(250,248,245,0.25)", color: "var(--cream)" }}>
            {summary.hasWallet ? "Ver cartera" : "Crear portfolio"}
          </Link>
          <Link to="/wallet" className="flex-1 py-2.5 rounded-full border text-sm font-medium text-center" style={{ borderColor: "rgba(250,248,245,0.25)", color: "var(--cream)" }}>
            Operar
          </Link>
        </div>
      </section>


      {/* Trending stocks */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--navy)" }}>Lo más comprado</h2>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Las acciones que más agregan los usuarios esta semana</p>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
          {trendingStocks.map((s) => {
            const display = s.ticker.replace(/[-.].*/, "");
            return (
              <Link
                key={s.ticker}
                to="/wallet"
                search={{ asset: s.ticker }}
                className="snap-start min-w-[140px] w-[140px] rounded-2xl bg-card shadow-soft p-3 block"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold text-white" style={{ background: s.color }}>
                    {display.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight" style={{ color: "var(--navy)" }}>{display}</p>
                    <p className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>{s.name}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <Users size={11} style={{ color: "var(--gold)" }} />
                  <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--gold)" }}>+{s.users}</p>
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>esta semana</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Referentes horizontal */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--navy)" }}>Referentes</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Los movimientos de los grandes</p>
          </div>
          <Link to="/referentes" className="text-xs font-medium flex items-center gap-0.5" style={{ color: "var(--navy)" }}>
            Ver todo <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x">
          {investors.slice(0, 6).map((i) => (
            <Link
              key={i.id}
              to="/referentes/$id"
              params={{ id: i.id }}
              className="snap-start min-w-[150px] w-[150px] rounded-2xl bg-card shadow-soft p-3 relative"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative" style={{ background: "var(--muted)" }}>
                <img src={i.photo} alt={i.name} className="w-full h-full object-cover" />
                {i.locked && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(26,26,46,0.45)" }}>
                    <Lock size={18} color="var(--gold)" />
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold leading-tight" style={{ color: "var(--navy)" }}>{i.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{i.fund}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--gold)" }}>{i.netWorth}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Mis amigos leaderboard */}
      <section className="rounded-3xl bg-card shadow-soft p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} style={{ color: "var(--navy)" }} />
          <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Mis amigos</h2>
        </div>
        {myFriends.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>
            Añade amigos desde tu perfil para verlos aquí
          </p>
        ) : (
          <LeaderboardList rows={myFriends} />
        )}
      </section>

      {/* Global leaderboard */}
      <section className="rounded-3xl bg-card shadow-soft p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} style={{ color: "var(--gold)" }} />
          <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Global</h2>
        </div>
        <LeaderboardList rows={global} />
      </section>

      <PremiumBanner />
    </div>
  );
}

function LeaderboardList({ rows }: { rows: typeof globalUsers }) {
  return (
    <ul className="space-y-3">
      {rows.map((u, idx) => (
        <li key={u.code}>
          <Link to="/u/$code" params={{ code: u.code }} className="flex items-center gap-3">
            <span className="text-sm font-bold tabular-nums w-7" style={{ color: idx === 0 ? "var(--gold)" : "var(--navy)" }}>
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{u.name}</p>
              <p className="text-[10px] tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>{u.strategy}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums" style={{ color: u.perf >= 0 ? "var(--success)" : "var(--danger)" }}>
              {u.perf >= 0 ? "+" : ""}{fmt(u.perf)}%
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PremiumBanner() {
  const { isPremium, setIsPremium } = useApp();
  if (isPremium) return null;
  return (
    <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "var(--navy)", color: "var(--cream)" }}>
      <div>
        <p className="text-[10px] tracking-widest font-medium" style={{ color: "var(--gold)" }}>EQUIT PREMIUM</p>
        <p className="text-sm font-semibold mt-0.5">€3,99/mes · todos los referentes</p>
      </div>
      <button onClick={() => setIsPremium(true)} className="px-4 py-1.5 rounded-full border text-xs font-medium" style={{ borderColor: "rgba(250,248,245,0.3)" }}>
        Probar
      </button>
    </div>
  );
}

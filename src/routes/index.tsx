import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, ArrowUpRight, Lock } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { investors, leaderboard } from "@/lib/data";

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
  const { username } = useApp();
  return (
    <div className="space-y-6">
      {/* Portfolio card */}
      <section className="rounded-3xl p-6 shadow-card" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <p className="text-xs" style={{ color: "rgba(250,248,245,0.6)" }}>Hola, {username}</p>
        <h1 className="mt-2 text-[40px] leading-none font-semibold tracking-tight">€12.847<span style={{ color: "var(--gold)" }}>,</span>32</h1>
        <p className="mt-3 text-sm" style={{ color: "#5BD2A5" }}>
          +€284,12 · +2,26% <span style={{ color: "rgba(250,248,245,0.5)" }} className="ml-1">hoy</span>
        </p>
        <div className="mt-5 flex gap-2">
          <button className="flex-1 py-2.5 rounded-full border text-sm font-medium" style={{ borderColor: "rgba(250,248,245,0.25)", color: "var(--cream)" }}>
            Crear portfolio
          </button>
          <button className="flex-1 py-2.5 rounded-full border text-sm font-medium" style={{ borderColor: "rgba(250,248,245,0.25)", color: "var(--cream)" }}>
            Depositar
          </button>
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

      {/* Leaderboard */}
      <section className="rounded-3xl bg-card shadow-soft p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} style={{ color: "var(--gold)" }} />
          <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Leaderboard semanal</h2>
        </div>
        <ul className="space-y-3">
          {leaderboard.map((row) => (
            <li key={row.rank} className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums w-7" style={{ color: row.rank === 1 ? "var(--gold)" : "var(--navy)" }}>
                {String(row.rank).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{row.handle}</p>
                <p className="text-[10px] tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>{row.strategy}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--success)" }}>+{fmt(row.perf)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <PremiumBanner />
    </div>
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

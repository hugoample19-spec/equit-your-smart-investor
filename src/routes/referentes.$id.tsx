import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight,
  Cpu, Zap, HeartPulse, Landmark, ShoppingBag, Bitcoin, Building2,
  Globe2, Factory, TrendingUp,
} from "lucide-react";
import { investors } from "@/lib/data";
import { useApp } from "@/lib/app-context";
import { InvestorLogo } from "@/components/InvestorLogo";
import { PremiumModal } from "@/components/PremiumModal";

const SECTOR_ICON: Record<string, ComponentType<{ size?: number }>> = {
  Tech: Cpu,
  Energía: Zap,
  Salud: HeartPulse,
  Banca: Landmark,
  Consumo: ShoppingBag,
  Cripto: Bitcoin,
  Inmobiliario: Building2,
  Macro: Globe2,
  Industriales: Factory,
  Emergentes: TrendingUp,
};



export const Route = createFileRoute("/referentes/$id")({
  head: ({ params }) => {
    const i = investors.find((x) => x.id === params.id);
    return {
      meta: [
        { title: `${i?.name ?? "Referente"} · Equit` },
        { name: "description", content: i ? `Cartera completa de ${i.name} (${i.fund}).` : "Referente" },
      ],
    };
  },
  loader: ({ params }) => {
    const investor = investors.find((x) => x.id === params.id);
    if (!investor) throw notFound();
    return { investor };
  },
  component: InvestorDetail,
  notFoundComponent: () => <p className="pt-10 text-center text-sm">Referente no encontrado</p>,
});

function InvestorDetail() {
  const data = Route.useLoaderData() as { investor: typeof investors[number] };
  const investor = data.investor;
  const { isPremium, setPendingCopy, favoriteReferenteId, setFavoriteReferente } = useApp();
  const navigate = useNavigate();
  const locked = investor.locked && !isPremium;
  const isFav = favoriteReferenteId === investor.id;
  const [showPremium, setShowPremium] = useState(locked);

  useEffect(() => {
    if (locked) setShowPremium(true);
  }, [locked]);

  if (locked) {
    return (
      <>
        <Link to="/referentes" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--navy)" }}>
          <ArrowLeft size={16} /> Referentes
        </Link>
        {showPremium && (
          <PremiumModal
            onClose={() => {
              setShowPremium(false);
              navigate({ to: "/referentes" });
            }}
          />
        )}
      </>
    );
  }

  const onCopy = () => {
    setPendingCopy(investor);
    navigate({ to: "/wallet" });
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <Link to="/referentes" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--navy)" }}>
          <ArrowLeft size={16} /> Referentes
        </Link>
        <button
          onClick={() => setFavoriteReferente(isFav ? null : investor.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
          style={{ borderColor: "var(--gold)", color: "var(--navy)" }}
        >
          <Star size={14} fill={isFav ? "var(--gold)" : "none"} color="var(--gold)" />
          {isFav ? "Favorito" : "Marcar favorito"}
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden relative aspect-[4/5] shadow-card">
        <InvestorLogo bgColor={investor.color} name={investor.name} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,46,0) 40%, rgba(26,26,46,0.9) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--gold)" }}>{investor.fund}</p>
          <h1 className="text-3xl font-semibold mt-1" style={{ color: "var(--cream)" }}>{investor.name}</h1>
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--gold)" }}>Patrimonio · {investor.netWorth}</p>
        </div>
      </div>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold mb-2" style={{ color: "var(--navy)" }}>Filosofía de inversión</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{investor.bio}</p>
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold mb-4" style={{ color: "var(--navy)" }}>Cartera</h2>
        <ul className="space-y-3">
          {investor.holdings.map((h) => (
            <li key={h.ticker} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--muted)", color: "var(--navy)" }}>
                {h.ticker}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{h.name}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{h.pct.toFixed(1)}% · €{(h.pct * 1000).toFixed(0)}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums" style={{ color: h.perf >= 0 ? "var(--success)" : "var(--danger)" }}>
                {h.perf >= 0 ? "+" : ""}{h.perf.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>

        {investor.sectorAffinity.length > 0 && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--muted)" }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
              Afinidad por sectores
            </p>
            <div className="flex flex-wrap gap-2">
              {investor.sectorAffinity.map((a) => {
                const Icon = SECTOR_ICON[a.sector] ?? Globe2;
                const favors = a.direction === "favors";
                const Arrow = favors ? ArrowUpRight : ArrowDownRight;
                const color = favors ? "var(--success)" : "var(--danger)";
                return (
                  <span
                    key={a.sector + a.direction}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "var(--muted)", color: "var(--navy)" }}
                  >
                    <Icon size={14} />
                    {a.sector}
                    <Arrow size={14} color={color} />
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <button
        onClick={onCopy}
        className="w-full py-4 rounded-full text-sm font-semibold shadow-card"
        style={{ background: "var(--navy)", color: "var(--cream)" }}
      >
        Copiar cartera
      </button>

    </div>
  );
}

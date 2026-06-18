import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ArrowLeft, Lock, Star } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { investors, investorCiks } from "@/lib/data";
import { useApp } from "@/lib/app-context";
import { getThirteenF } from "@/lib/investors.functions";

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

function formatFilingDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
}

function InvestorDetail() {
  const data = Route.useLoaderData() as { investor: typeof investors[number] };
  const investor = data.investor;
  const { isPremium, setPendingCopy, favoriteReferenteId, setFavoriteReferente, markFilingSeen } = useApp();
  const navigate = useNavigate();
  const locked = investor.locked && !isPremium;
  const isFav = favoriteReferenteId === investor.id;
  const cik = investorCiks[investor.id];

  const { data: real } = useQuery({
    queryKey: ["13f", investor.id],
    queryFn: () => getThirteenF({ data: { cik: cik! } }),
    enabled: !!cik && !locked,
    staleTime: 6 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (real?.filingDate && !real.fallback) markFilingSeen(investor.id, real.filingDate);
  }, [real?.filingDate, real?.fallback, investor.id, markFilingSeen]);

  if (locked) {
    return (
      <div className="space-y-5">
        <Link to="/referentes" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--navy)" }}>
          <ArrowLeft size={16} /> Referentes
        </Link>
        <div className="rounded-3xl overflow-hidden relative aspect-[4/5] shadow-card">
          <img src={investor.photo} alt={investor.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 backdrop-blur-md" style={{ background: "rgba(26,26,46,0.65)" }}>
            <Lock size={36} style={{ color: "var(--gold)" }} />
            <p className="mt-3 text-[10px] tracking-widest font-semibold" style={{ color: "var(--gold)" }}>EQUIT PREMIUM</p>
            <p className="mt-2 text-xl font-semibold" style={{ color: "var(--cream)" }}>{investor.name}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(250,248,245,0.7)" }}>Desbloquea su cartera completa por €3,99/mes</p>
          </div>
        </div>
      </div>
    );
  }

  const onCopy = () => {
    setPendingCopy(investor);
    navigate({ to: "/wallet" });
  };

  const useReal = real && !real.fallback && real.holdings.length > 0;
  const fmt = (n: number) =>
    n >= 1_000_000_000 ? `€${(n / 1_000_000_000).toFixed(2)}B` :
    n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1)}M` :
    `€${n.toLocaleString("es-ES")}`;

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
        <img src={investor.photo} alt={investor.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,46,0) 40%, rgba(26,26,46,0.9) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--gold)" }}>{investor.fund}</p>
          <h1 className="text-3xl font-semibold mt-1" style={{ color: "var(--cream)" }}>{investor.name}</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(250,248,245,0.8)" }}>{investor.bio}</p>
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--gold)" }}>Patrimonio · {investor.netWorth}</p>
        </div>
      </div>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: "var(--navy)" }}>Cartera</h2>
          {useReal && (
            <span className="text-[9px] tracking-widest font-semibold px-2 py-1 rounded-full" style={{ background: "var(--muted)", color: "var(--navy)" }}>
              13F · SEC
            </span>
          )}
        </div>
        <ul className="space-y-3">
          {useReal
            ? real!.holdings.map((h) => (
                <li key={h.ticker} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--muted)", color: "var(--navy)" }}>
                    {h.ticker.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{h.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {h.shares.toLocaleString("es-ES")} acc · {fmt(h.value)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
                    {h.pct.toFixed(1)}%
                  </span>
                </li>
              ))
            : investor.holdings.map((h) => (
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
        {useReal && real!.filingDate && (
          <p className="text-[10px] mt-4 text-center tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            ACTUALIZADO · {formatFilingDate(real!.filingDate)}
          </p>
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

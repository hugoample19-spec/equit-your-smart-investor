import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { investors } from "@/lib/data";
import { useApp } from "@/lib/app-context";

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
  const { investor } = Route.useLoaderData();
  const { isPremium, setPendingCopy } = useApp();
  const navigate = useNavigate();
  const locked = investor.locked && !isPremium;

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

  return (
    <div className="space-y-5 pb-6">
      <Link to="/referentes" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--navy)" }}>
        <ArrowLeft size={16} /> Referentes
      </Link>

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

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, RefreshCw, Plus, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { sectors } from "@/lib/data";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet · Equit" },
      { name: "description", content: "Wallet simulada con IA. Genera carteras a tu medida." },
    ],
  }),
  component: WalletPage,
});

const fmtEUR = (n: number) => "€" + n.toLocaleString("es-ES", { maximumFractionDigits: 0 });

const aiStocks = [
  { ticker: "NVDA", name: "Nvidia", sector: "Tech", perf: 124.6 },
  { ticker: "MSFT", name: "Microsoft", sector: "Tech", perf: 18.4 },
  { ticker: "ASML", name: "ASML", sector: "Tech", perf: 22.1 },
  { ticker: "SAN", name: "Santander", sector: "Banca", perf: 14.2 },
  { ticker: "BBVA", name: "BBVA", sector: "Banca", perf: 19.7 },
  { ticker: "ITX", name: "Inditex", sector: "Consumo", perf: 21.3 },
  { ticker: "REP", name: "Repsol", sector: "Energía", perf: 6.4 },
  { ticker: "BTC", name: "Bitcoin", sector: "Cripto", perf: 62.4 },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Salud", perf: 7.8 },
];

type Mode = "generator" | "results" | "copy";

function WalletPage() {
  const { budget, setBudget, portfolio, setPortfolio, pendingCopy, setPendingCopy } = useApp();
  const initialMode: Mode = pendingCopy ? "copy" : portfolio ? "results" : "generator";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [risk, setRisk] = useState<"Bajo" | "Medio" | "Alto">("Medio");
  const [selSectors, setSelSectors] = useState<string[]>(["Tech", "Banca"]);

  const generate = () => {
    const pool = aiStocks.filter((s) => selSectors.includes(s.sector));
    const chosen = (pool.length ? pool : aiStocks).slice(0, 6);
    const weights = chosen.map((_, i) => (chosen.length - i));
    const total = weights.reduce((a, b) => a + b, 0);
    const holdings = chosen.map((s, i) => {
      const pct = (weights[i] / total) * 100;
      return {
        ticker: s.ticker,
        name: s.name,
        pct,
        amount: (pct / 100) * budget,
        perf: s.perf * (risk === "Alto" ? 1.2 : risk === "Bajo" ? 0.6 : 1),
      };
    });
    setPortfolio({ budget, holdings });
    setMode("results");
  };

  const applyCopy = () => {
    if (!pendingCopy) return;
    const holdings = pendingCopy.holdings.map((h) => ({
      ticker: h.ticker, name: h.name, pct: h.pct,
      amount: (h.pct / 100) * budget, perf: h.perf,
    }));
    setPortfolio({ fromInvestor: pendingCopy.name, budget, holdings });
    setPendingCopy(null);
    setMode("results");
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <p className="text-[10px] tracking-widest font-semibold" style={{ color: "var(--gold)" }}>POWERED BY IA ✦</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-0.5" style={{ color: "var(--navy)" }}>Wallet simulada</h1>
      </div>

      {mode === "copy" && pendingCopy && (
        <CopyPreview budget={budget} investor={pendingCopy} onApply={applyCopy} onCancel={() => { setPendingCopy(null); setMode(portfolio ? "results" : "generator"); }} />
      )}

      {mode === "generator" && (
        <Generator
          budget={budget} setBudget={setBudget}
          risk={risk} setRisk={setRisk}
          selSectors={selSectors} setSelSectors={setSelSectors}
          onGenerate={generate}
        />
      )}

      {mode === "results" && portfolio && (
        <Results portfolio={portfolio} onRegen={() => setMode("generator")} />
      )}
    </div>
  );
}

function Generator({
  budget, setBudget, risk, setRisk, selSectors, setSelSectors, onGenerate,
}: {
  budget: number; setBudget: (n: number) => void;
  risk: "Bajo" | "Medio" | "Alto"; setRisk: (r: "Bajo" | "Medio" | "Alto") => void;
  selSectors: string[]; setSelSectors: (s: string[]) => void;
  onGenerate: () => void;
}) {
  const toggleSector = (s: string) =>
    setSelSectors(selSectors.includes(s) ? selSectors.filter((x) => x !== s) : [...selSectors, s]);

  return (
    <>
      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>Presupuesto</p>
          <p className="text-2xl font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
            {fmtEUR(budget)}<span style={{ color: "var(--gold)" }}>.</span>
          </p>
        </div>
        <input
          type="range" min={500} max={50000} step={100}
          value={budget} onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full mt-4 accent-[#1A1A2E]"
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
          <span>€500</span><span>€50.000</span>
        </div>
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--navy)" }}>Riesgo</p>
        <div className="flex gap-2">
          {(["Bajo", "Medio", "Alto"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className="flex-1 py-2.5 rounded-full text-sm font-medium border transition"
              style={{
                background: risk === r ? "var(--navy)" : "transparent",
                color: risk === r ? "var(--cream)" : "var(--navy)",
                borderColor: risk === r ? "var(--navy)" : "var(--border)",
              }}
            >{r}</button>
          ))}
        </div>
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--navy)" }}>Sectores</p>
        <div className="flex flex-wrap gap-2">
          {sectors.map((s) => {
            const on = selSectors.includes(s);
            return (
              <button key={s} onClick={() => toggleSector(s)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  background: on ? "var(--navy)" : "transparent",
                  color: on ? "var(--cream)" : "var(--navy)",
                  borderColor: on ? "var(--navy)" : "var(--border)",
                }}>
                {s}
              </button>
            );
          })}
        </div>
      </section>

      <button onClick={onGenerate}
        className="w-full py-4 rounded-full text-sm font-semibold shadow-card flex items-center justify-center gap-2"
        style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <Sparkles size={16} style={{ color: "var(--gold)" }} />
        Generar portfolio con IA
      </button>
    </>
  );
}

function Donut({ data }: { data: { pct: number; color: string }[] }) {
  const r = 60, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40 mx-auto">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--muted)" strokeWidth="20" />
      {data.map((d, i) => {
        const len = (d.pct / 100) * c;
        const el = (
          <circle key={i} cx="80" cy="80" r={r} fill="none"
            stroke={d.color} strokeWidth="20"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 80 80)"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

function Sparkline({ perf }: { perf: number }) {
  const pts = useMemo(() => {
    const arr: number[] = [];
    let v = 50;
    for (let i = 0; i < 12; i++) {
      v += (Math.random() - 0.4 + perf / 200) * 6;
      arr.push(v);
    }
    return arr;
  }, [perf]);
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map((v, i) => `${(i / 11) * 50},${20 - ((v - min) / (max - min || 1)) * 18}`);
  return (
    <svg viewBox="0 0 50 20" className="w-14 h-5">
      <polyline points={norm.join(" ")} fill="none" stroke={perf >= 0 ? "var(--success)" : "var(--danger)"} strokeWidth="1.4" />
    </svg>
  );
}

function LineChart() {
  const pts = useMemo(() => {
    const arr: number[] = [];
    let v = 50;
    for (let i = 0; i < 40; i++) { v += (Math.random() - 0.35) * 4; arr.push(v); }
    return arr;
  }, []);
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map((v, i) => `${(i / 39) * 300},${80 - ((v - min) / (max - min || 1)) * 70}`);
  return (
    <svg viewBox="0 0 300 90" className="w-full h-24">
      <polyline points={norm.join(" ")} fill="none" stroke="var(--navy)" strokeWidth="1.8" />
    </svg>
  );
}

const COLORS = ["#1A1A2E", "#C9A84C", "#5BD2A5", "#6B6B7D", "#A8957A", "#3C3C5C"];

function Results({ portfolio, onRegen }: { portfolio: NonNullable<ReturnType<typeof useApp>["portfolio"]>; onRegen: () => void }) {
  const donut = portfolio.holdings.map((h, i) => ({ pct: h.pct, color: COLORS[i % COLORS.length] }));
  return (
    <>
      {portfolio.fromInvestor && (
        <div className="rounded-2xl p-3 text-center text-xs" style={{ background: "var(--muted)", color: "var(--navy)" }}>
          Cartera copiada de <strong>{portfolio.fromInvestor}</strong>
        </div>
      )}

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Total invertido</p>
        <p className="text-3xl font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
          {fmtEUR(portfolio.budget)}<span style={{ color: "var(--gold)" }}>.</span>
        </p>
        <Donut data={donut} />
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Composición</h3>
        <ul className="space-y-3">
          {portfolio.holdings.map((h, i) => (
            <li key={h.ticker} className="flex items-center gap-3">
              <span className="w-2 h-10 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--muted)", color: "var(--navy)" }}>
                {h.ticker}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{h.name}</p>
                <p className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>{fmtEUR(h.amount)} · {h.pct.toFixed(1)}%</p>
              </div>
              <Sparkline perf={h.perf} />
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h3 className="font-semibold mb-2" style={{ color: "var(--navy)" }}>Evolución simulada</h3>
        <LineChart />
        <div className="grid grid-cols-3 gap-3 mt-3 text-center">
          <Stat label="Sharpe" value="1,42" />
          <Stat label="Volatilidad" value="12,8%" />
          <Stat label="Max DD" value="-8,4%" />
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={onRegen} className="flex-1 py-3 rounded-full border text-sm font-medium flex items-center justify-center gap-1.5" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
          <RefreshCw size={14} /> Rebalancear
        </button>
        <button className="flex-1 py-3 rounded-full border text-sm font-medium flex items-center justify-center gap-1.5" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
          <Plus size={14} /> Añadir activo
        </button>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-wider" style={{ color: "var(--muted-foreground)" }}>{label.toUpperCase()}</p>
      <p className="text-sm font-semibold mt-1 tabular-nums" style={{ color: "var(--navy)" }}>{value}</p>
    </div>
  );
}

function CopyPreview({ budget, investor, onApply, onCancel }: { budget: number; investor: NonNullable<ReturnType<typeof useApp>["pendingCopy"]>; onApply: () => void; onCancel: () => void }) {
  return (
    <>
      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest" style={{ color: "var(--gold)" }}>VISTA PREVIA</p>
            <h2 className="text-lg font-semibold mt-1">Copiando a {investor.name}</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(250,248,245,0.7)" }}>Aplicado a tu presupuesto · {fmtEUR(budget)}</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(250,248,245,0.1)" }}>
            <X size={16} />
          </button>
        </div>
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Tu asignación</h3>
        <ul className="space-y-3">
          {investor.holdings.map((h) => (
            <li key={h.ticker} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--muted)", color: "var(--navy)" }}>
                {h.ticker}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{h.name}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{h.pct.toFixed(1)}%</p>
              </div>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
                {fmtEUR((h.pct / 100) * budget)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button onClick={onApply}
        className="w-full py-4 rounded-full text-sm font-semibold shadow-card"
        style={{ background: "var(--navy)", color: "var(--cream)" }}>
        Aplicar a mi cartera
      </button>
    </>
  );
}

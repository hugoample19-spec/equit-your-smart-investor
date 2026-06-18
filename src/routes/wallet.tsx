import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Search,
  TrendingUp,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  CATALOG,
  findAsset,
  positionAvg,
  positionInvested,
  positionQty,
  useWallet,
  type AssetCategory,
  type CatalogAsset,
} from "@/lib/wallet-store";
import { getPrices, getHistory, type PriceData, type ChartRange } from "@/lib/prices.functions";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet · Equit" },
      { name: "description", content: "Tu cartera simulada con precios reales." },
    ],
  }),
  component: WalletPage,
});

const fmtEUR = (n: number) =>
  "€" + n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEUR0 = (n: number) =>
  "€" + n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
const fmtPct = (n: number) =>
  (n >= 0 ? "+" : "") + n.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + "%";

type Screen =
  | { kind: "home" }
  | { kind: "buyList" }
  | { kind: "buy"; ticker: string }
  | { kind: "detail"; ticker: string }
  | { kind: "sell"; ticker: string };

function WalletPage() {
  const { state, ready, setupStarting, reset, buy, sell, addFunds, withdrawFunds } = useWallet();
  const [screen, setScreen] = useState<Screen>({ kind: "home" });

  const ownedTickers = useMemo(() => Object.keys(state.positions), [state.positions]);
  const tickersToFetch = useMemo(() => {
    const base = new Set<string>(ownedTickers);
    if (screen.kind === "buyList") CATALOG.forEach((c) => base.add(c.ticker));
    if (screen.kind === "buy" || screen.kind === "detail" || screen.kind === "sell")
      base.add(screen.ticker);
    return Array.from(base);
  }, [ownedTickers, screen]);

  const getPricesFn = useServerFn(getPrices);
  const pricesQuery = useQuery({
    queryKey: ["prices", tickersToFetch.sort().join(",")],
    queryFn: () => getPricesFn({ data: { tickers: tickersToFetch } }),
    enabled: tickersToFetch.length > 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  if (!ready) return <div className="py-10 text-center text-sm text-muted-foreground">Cargando…</div>;

  if (state.starting == null) return <SetupScreen onPick={setupStarting} />;

  const prices = pricesQuery.data?.prices ?? {};

  if (screen.kind === "buyList")
    return (
      <BuyListScreen
        prices={prices}
        loading={pricesQuery.isLoading}
        onBack={() => setScreen({ kind: "home" })}
        onPick={(t) => setScreen({ kind: "buy", ticker: t })}
      />
    );

  if (screen.kind === "buy")
    return (
      <BuyScreen
        ticker={screen.ticker}
        price={prices[screen.ticker]}
        cash={state.cash}
        onBack={() => setScreen({ kind: "buyList" })}
        onConfirm={(qty, price) => {
          buy(screen.ticker, qty, price);
          setScreen({ kind: "home" });
        }}
      />
    );

  if (screen.kind === "detail") {
    const pos = state.positions[screen.ticker];
    if (!pos) {
      setScreen({ kind: "home" });
      return null;
    }
    return (
      <DetailScreen
        position={pos}
        price={prices[screen.ticker]}
        onBack={() => setScreen({ kind: "home" })}
        onSell={() => setScreen({ kind: "sell", ticker: screen.ticker })}
      />
    );
  }

  if (screen.kind === "sell") {
    const pos = state.positions[screen.ticker];
    if (!pos) {
      setScreen({ kind: "home" });
      return null;
    }
    return (
      <SellScreen
        position={pos}
        price={prices[screen.ticker]}
        onBack={() => setScreen({ kind: "detail", ticker: screen.ticker })}
        onConfirm={(qty, price) => {
          sell(screen.ticker, qty, price);
          setScreen({ kind: "home" });
        }}
      />
    );
  }

  return (
    <HomeScreen
      state={state}
      prices={prices}
      onBuy={() => setScreen({ kind: "buyList" })}
      onReset={reset}
      onOpenAsset={(t) => setScreen({ kind: "detail", ticker: t })}
      onAddFunds={addFunds}
      onWithdrawFunds={withdrawFunds}
    />
  );
}

/* ============================== Setup ============================== */

function SetupScreen({ onPick }: { onPick: (n: number) => void }) {
  const [custom, setCustom] = useState("");
  const presets = [1000, 5000, 10000, 50000];
  return (
    <div className="space-y-5 pb-6">
      <div>
        <p className="text-[10px] tracking-widest font-semibold" style={{ color: "var(--gold)" }}>
          BIENVENIDO ✦
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-0.5" style={{ color: "var(--navy)" }}>
          Elige tu saldo inicial simulado
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Este será el dinero virtual con el que empezarás a invertir.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="bg-card rounded-2xl p-5 shadow-soft text-left active:scale-[0.98] transition-transform"
          >
            <p className="text-xs text-muted-foreground">Empezar con</p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
              {fmtEUR0(p)}
              <span style={{ color: "var(--gold)" }}>.</span>
            </p>
          </button>
        ))}
      </div>
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--navy)" }}>
          O un importe personalizado
        </p>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="€"
            inputMode="numeric"
            className="flex-1 rounded-xl border px-4 py-3 text-base outline-none focus:border-[var(--navy)]"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            disabled={!custom || Number(custom) <= 0}
            onClick={() => onPick(Number(custom))}
            className="px-5 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ background: "var(--navy)", color: "var(--cream)" }}
          >
            Empezar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== Home ============================== */

function HomeScreen({
  state,
  prices,
  onBuy,
  onReset,
  onOpenAsset,
  onAddFunds,
  onWithdrawFunds,
}: {
  state: ReturnType<typeof useWallet>["state"];
  prices: Record<string, PriceData>;
  onBuy: () => void;
  onReset: () => void;
  onOpenAsset: (t: string) => void;
  onAddFunds: (amount: number) => void;
  onWithdrawFunds: (amount: number) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [fundsOpen, setFundsOpen] = useState(false);

  const positions = Object.values(state.positions);
  const positionsValued = positions.map((p) => {
    const qty = positionQty(p);
    const invested = positionInvested(p);
    const avg = positionAvg(p);
    const pd = prices[p.ticker];
    const price = pd?.price ?? avg;
    const prevClose = pd?.prevClose ?? price;
    const value = qty * price;
    const gain = value - invested;
    const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
    // Daily delta for this position: qty * (price - prevClose)
    const dailyDelta = pd?.price != null && pd?.prevClose != null ? qty * (price - prevClose) : 0;
    return { ...p, qty, invested, avg, price, value, gain, gainPct, dailyDelta, stale: pd?.stale };
  });

  const portfolioValue = positionsValued.reduce((a, p) => a + p.value, 0);
  const totalInvested = positionsValued.reduce((a, p) => a + p.invested, 0);
  const totalValue = portfolioValue + state.cash;
  // Weighted daily gain in € across all owned positions.
  const dailyGain = positionsValued.reduce((a, p) => a + p.dailyDelta, 0);
  // Total return = current portfolio value vs invested cost basis (weighted by position size).
  const totalReturn = portfolioValue - totalInvested;
  const totalReturnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <div>
          <p className="text-xs text-muted-foreground">Valor total de cartera</p>
          <p
            className="text-3xl font-semibold tracking-tight tabular-nums mt-1"
            style={{ color: "var(--navy)" }}
          >
            {fmtEUR(totalValue)}
            <span style={{ color: "var(--gold)" }}>.</span>
          </p>
          <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
            <span
              className="tabular-nums font-medium"
              style={{ color: dailyGain >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {dailyGain >= 0 ? "+" : ""}
              {fmtEUR(dailyGain)} hoy
            </span>
            <span
              className="tabular-nums font-medium"
              style={{ color: totalReturn >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {fmtPct(totalReturnPct)} total
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between text-xs" style={{ borderColor: "var(--border)" }}>
          <span className="text-muted-foreground">Efectivo disponible</span>
          <span className="tabular-nums font-medium" style={{ color: "var(--navy)" }}>
            {fmtEUR(state.cash)}
          </span>
        </div>
      </section>

      {positions.length === 0 ? (
        <section className="bg-card rounded-2xl p-8 shadow-soft text-center">
          <TrendingUp size={36} className="mx-auto mb-3" style={{ color: "var(--gold)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--navy)" }}>
            Empieza a invertir
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Compra tu primer activo con tu saldo simulado.
          </p>
          <button
            onClick={onBuy}
            className="w-full rounded-xl py-3 text-sm font-semibold"
            style={{ background: "var(--gold)", color: "var(--navy)" }}
          >
            Comprar activos
          </button>
        </section>
      ) : (
        <>
          <Donut
            data={positionsValued.map((p) => ({
              label: findAsset(p.ticker)?.display ?? p.ticker,
              value: p.value,
            }))}
            cashValue={state.cash}
          />

          <section className="bg-card rounded-2xl p-2 shadow-soft">
            {positionsValued.map((p) => {
              const asset = findAsset(p.ticker);
              return (
                <button
                  key={p.ticker}
                  onClick={() => onOpenAsset(p.ticker)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl active:bg-black/5"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                      {asset?.display ?? p.ticker}
                    </p>
                    <p className="text-xs text-muted-foreground">{asset?.name ?? p.ticker}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                      {p.qty.toLocaleString("es-ES", { maximumFractionDigits: 4 })} ud · {fmtEUR(p.price)}
                      {p.stale && " · desactualizado"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
                      {fmtEUR(p.value)}
                    </p>
                    <p
                      className="text-xs tabular-nums font-medium"
                      style={{ color: p.gain >= 0 ? "var(--success)" : "var(--danger)" }}
                    >
                      {fmtPct(p.gainPct)}
                    </p>
                  </div>
                </button>
              );
            })}
          </section>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuy}
          className="rounded-xl py-3.5 text-sm font-semibold"
          style={{ background: "var(--gold)", color: "var(--navy)" }}
        >
          Comprar activos
        </button>
        <button
          onClick={() => setFundsOpen(true)}
          className="rounded-xl py-3.5 text-sm font-semibold border"
          style={{ borderColor: "var(--navy)", color: "var(--navy)" }}
        >
          Gestionar fondos
        </button>
      </div>

      <button
        onClick={() => setConfirmReset(true)}
        className="w-full text-center text-xs font-medium py-2"
        style={{ color: "var(--danger)" }}
      >
        Resetear cartera
      </button>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} style={{ color: "var(--danger)" }} />
            <div>
              <p className="font-semibold" style={{ color: "var(--navy)" }}>
                ¿Resetear cartera?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Si reseteas tu cartera perderás todos tus activos y rendimientos conseguidos.
                Volverás a tu saldo inicial. ¿Estás seguro?
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 py-3 rounded-xl border text-sm font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--danger)" }}
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}

      {fundsOpen && (
        <FundsModal
          cash={state.cash}
          onClose={() => setFundsOpen(false)}
          onAdd={(n) => {
            onAddFunds(n);
            setFundsOpen(false);
          }}
          onWithdraw={(n) => {
            onWithdrawFunds(n);
            setFundsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function FundsModal({
  cash,
  onClose,
  onAdd,
  onWithdraw,
}: {
  cash: number;
  onClose: () => void;
  onAdd: (n: number) => void;
  onWithdraw: (n: number) => void;
}) {
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [input, setInput] = useState("");
  const n = Number(input.replace(",", ".")) || 0;
  const isWithdraw = mode === "withdraw";
  const canDo = n > 0 && (!isWithdraw || n <= cash);

  return (
    <Modal onClose={onClose}>
      <p className="font-semibold text-base" style={{ color: "var(--navy)" }}>
        Gestionar fondos
      </p>
      <div className="flex gap-2 mt-3">
        {(["add", "withdraw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setInput("");
            }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold border"
            style={{
              background: mode === m ? "var(--navy)" : "transparent",
              color: mode === m ? "var(--cream)" : "var(--navy)",
              borderColor: mode === m ? "var(--navy)" : "var(--border)",
            }}
          >
            {m === "add" ? "Añadir fondos" : "Retirar fondos"}
          </button>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/[^0-9.,]/g, ""))}
        inputMode="decimal"
        placeholder="0,00 €"
        className="w-full mt-3 rounded-xl border px-4 py-3 text-base outline-none focus:border-[var(--navy)]"
        style={{ borderColor: "var(--border)" }}
      />
      <div className="flex justify-between text-xs mt-2">
        <span className="text-muted-foreground">Efectivo disponible</span>
        <span className="tabular-nums" style={{ color: "var(--navy)" }}>{fmtEUR(cash)}</span>
      </div>
      {isWithdraw && n > cash && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          Excede tu efectivo disponible
        </p>
      )}
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        ⚠ Añadir o retirar fondos no afecta a tus rendimientos históricos.
      </p>
      <button
        disabled={!canDo}
        onClick={() => (isWithdraw ? onWithdraw(n) : onAdd(n))}
        className="w-full mt-4 rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
        style={{ background: "var(--gold)", color: "var(--navy)" }}
      >
        {isWithdraw ? "Retirar" : "Añadir"}
      </button>
    </Modal>
  );
}

/* ============================== Donut ============================== */

function Donut({
  data,
  cashValue,
}: {
  data: { label: string; value: number }[];
  cashValue: number;
}) {
  const slices = [...data, { label: "Efectivo", value: cashValue }].filter((d) => d.value > 0);
  const total = slices.reduce((a, s) => a + s.value, 0);
  const COLORS = ["#1A1A2E", "#C9A84C", "#4A5568", "#8B7355", "#2D3748", "#A0826D", "#5C6F8A", "#D4B567"];
  let acc = 0;
  const R = 60;
  const r = 42;
  const cx = 80;
  const cy = 80;
  const arcs = slices.map((s, i) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start);
    const y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end);
    const y2 = cy + R * Math.sin(end);
    const xi2 = cx + r * Math.cos(end);
    const yi2 = cy + r * Math.sin(end);
    const xi1 = cx + r * Math.cos(start);
    const yi1 = cy + r * Math.sin(start);
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
    return { d, color: COLORS[i % COLORS.length], label: s.label, value: s.value };
  });
  return (
    <section className="bg-card rounded-2xl p-5 shadow-soft">
      <p className="text-xs font-semibold tracking-wide mb-3" style={{ color: "var(--navy)" }}>
        DISTRIBUCIÓN
      </p>
      <div className="flex items-center gap-4">
        <svg width={160} height={160} viewBox="0 0 160 160" className="shrink-0">
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color} />
          ))}
        </svg>
        <div className="flex-1 space-y-1.5">
          {arcs.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: a.color }} />
              <span className="flex-1 truncate" style={{ color: "var(--navy)" }}>
                {a.label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {((a.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== Buy List (4 tabs) ============================== */

function BuyListScreen({
  prices,
  loading,
  onBack,
  onPick,
}: {
  prices: Record<string, PriceData>;
  loading: boolean;
  onBack: () => void;
  onPick: (ticker: string) => void;
}) {
  const [tab, setTab] = useState<AssetCategory>("stocks");
  const [q, setQ] = useState("");
  const tabs: { key: AssetCategory; label: string }[] = [
    { key: "stocks", label: "Acciones" },
    { key: "etfs", label: "ETFs" },
    { key: "commodities", label: "Materias primas" },
    { key: "crypto", label: "Criptos" },
  ];
  const list = CATALOG.filter(
    (a) =>
      a.category === tab &&
      (q === "" ||
        a.display.toLowerCase().includes(q.toLowerCase()) ||
        a.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-full p-2 border"
          style={{ borderColor: "var(--border)" }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>
          Comprar activos
        </h1>
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <Search size={16} className="text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ticker o nombre"
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border"
            style={{
              background: tab === t.key ? "var(--navy)" : "transparent",
              color: tab === t.key ? "var(--cream)" : "var(--navy)",
              borderColor: tab === t.key ? "var(--navy)" : "var(--border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="bg-card rounded-2xl p-2 shadow-soft">
        {list.map((a) => {
          const p = prices[a.ticker];
          return (
            <button
              key={a.ticker}
              onClick={() => onPick(a.ticker)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl active:bg-black/5"
            >
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                  {a.display}
                </p>
                <p className="text-xs text-muted-foreground">{a.name}</p>
              </div>
              <div className="text-right">
                {loading && !p ? (
                  <div className="h-4 w-16 rounded bg-black/5 animate-pulse ml-auto" />
                ) : p?.price != null ? (
                  <>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--navy)" }}>
                      {fmtEUR(p.price)}
                    </p>
                    <p
                      className="text-xs tabular-nums font-medium"
                      style={{
                        color:
                          (p.changePct ?? 0) >= 0 ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {p.changePct != null ? fmtPct(p.changePct) : "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No disp.</p>
                )}
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Sin resultados</p>
        )}
      </section>
    </div>
  );
}

/* ============================== Buy ============================== */

function BuyScreen({
  ticker,
  price,
  cash,
  onBack,
  onConfirm,
}: {
  ticker: string;
  price?: PriceData;
  cash: number;
  onBack: () => void;
  onConfirm: (qty: number, price: number) => void;
}) {
  const asset = findAsset(ticker);
  const [mode, setMode] = useState<"qty" | "eur">("eur");
  const [input, setInput] = useState("");
  const px = price?.price ?? 0;
  const n = Number(input.replace(",", ".")) || 0;
  const qty = mode === "qty" ? n : px > 0 ? n / px : 0;
  const total = qty * px;
  const tooMuch = total > cash;
  const canBuy = px > 0 && qty > 0 && !tooMuch;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 border" style={{ borderColor: "var(--border)" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>
          Comprar {asset?.display}
        </h1>
      </div>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <p className="text-xs text-muted-foreground">{asset?.name}</p>
        <p className="text-2xl font-semibold tabular-nums mt-1" style={{ color: "var(--navy)" }}>
          {px > 0 ? fmtEUR(px) : "—"}
        </p>
        {price?.changePct != null && (
          <p
            className="text-sm font-medium tabular-nums"
            style={{ color: price.changePct >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {fmtPct(price.changePct)} hoy
          </p>
        )}
        {price?.stale && (
          <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
            ⚠ Precio desactualizado
          </p>
        )}
        {price?.spark && price.spark.length > 1 && <Sparkline data={price.spark} />}
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <div className="flex gap-2 mb-3">
          {(["eur", "qty"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setInput("");
              }}
              className="flex-1 py-2 rounded-lg text-xs font-medium border"
              style={{
                background: mode === m ? "var(--navy)" : "transparent",
                color: mode === m ? "var(--cream)" : "var(--navy)",
                borderColor: mode === m ? "var(--navy)" : "var(--border)",
              }}
            >
              {m === "eur" ? "Importe €" : "Nº participaciones"}
            </button>
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9.,]/g, ""))}
          inputMode="decimal"
          placeholder={mode === "eur" ? "0,00 €" : "0"}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:border-[var(--navy)]"
          style={{ borderColor: "var(--border)" }}
        />
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Coste total</span>
          <span className="tabular-nums font-semibold" style={{ color: "var(--navy)" }}>
            {fmtEUR(total)}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Participaciones</span>
          <span className="tabular-nums">{qty.toLocaleString("es-ES", { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Saldo disponible</span>
          <span className="tabular-nums">{fmtEUR(cash)}</span>
        </div>
        {tooMuch && (
          <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
            Excede tu saldo disponible
          </p>
        )}
      </section>

      <button
        disabled={!canBuy}
        onClick={() => onConfirm(qty, px)}
        className="w-full rounded-xl py-3.5 text-sm font-semibold disabled:opacity-40"
        style={{ background: "var(--gold)", color: "var(--navy)" }}
      >
        Confirmar compra
      </button>
    </div>
  );
}

/* ============================== Detail ============================== */

function DetailScreen({
  position,
  price,
  onBack,
  onSell,
}: {
  position: ReturnType<typeof useWallet>["state"]["positions"][string];
  price?: PriceData;
  onBack: () => void;
  onSell: () => void;
}) {
  const asset = findAsset(position.ticker);
  const qty = positionQty(position);
  const invested = positionInvested(position);
  const avg = positionAvg(position);
  const px = price?.price ?? avg;
  const value = qty * px;
  const gain = value - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 border" style={{ borderColor: "var(--border)" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>
          {asset?.display ?? position.ticker}
        </h1>
      </div>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <p className="text-xs text-muted-foreground">{asset?.name}</p>
        <p className="text-2xl font-semibold tabular-nums mt-1" style={{ color: "var(--navy)" }}>
          {fmtEUR(px)}
        </p>
        {price?.changePct != null && (
          <p
            className="text-sm font-medium tabular-nums"
            style={{ color: price.changePct >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {fmtPct(price.changePct)} hoy
          </p>
        )}
        {price?.spark && price.spark.length > 1 && <Sparkline data={price.spark} />}
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft space-y-2">
        <p className="text-xs font-semibold tracking-wide mb-2" style={{ color: "var(--navy)" }}>
          TU POSICIÓN
        </p>
        <Row label="Participaciones" value={qty.toLocaleString("es-ES", { maximumFractionDigits: 6 })} />
        <Row label="Precio medio compra" value={fmtEUR(avg)} />
        <Row label="Total invertido" value={fmtEUR(invested)} />
        <Row label="Valor actual" value={fmtEUR(value)} bold />
        <Row
          label="Ganancia / Pérdida"
          value={`${gain >= 0 ? "+" : ""}${fmtEUR(gain)} (${fmtPct(gainPct)})`}
          color={gain >= 0 ? "var(--success)" : "var(--danger)"}
          bold
        />
      </section>

      <button
        onClick={onSell}
        className="w-full rounded-xl py-3.5 text-sm font-semibold border"
        style={{ borderColor: "var(--navy)", color: "var(--navy)" }}
      >
        Vender
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={"tabular-nums " + (bold ? "font-semibold" : "")}
        style={{ color: color ?? "var(--navy)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================== Sell ============================== */

function SellScreen({
  position,
  price,
  onBack,
  onConfirm,
}: {
  position: ReturnType<typeof useWallet>["state"]["positions"][string];
  price?: PriceData;
  onBack: () => void;
  onConfirm: (qty: number, price: number) => void;
}) {
  const asset = findAsset(position.ticker);
  const owned = positionQty(position);
  const avg = positionAvg(position);
  const px = price?.price ?? avg;
  const [mode, setMode] = useState<"qty" | "eur">("qty");
  const [input, setInput] = useState("");
  const n = Number(input.replace(",", ".")) || 0;
  const requestedQty = mode === "qty" ? n : px > 0 ? n / px : 0;
  const qty = Math.min(requestedQty, owned);
  const proceeds = qty * px;
  const realizedPnl = qty * (px - avg);
  const canSell = qty > 0;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 border" style={{ borderColor: "var(--border)" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "var(--navy)" }}>
          Vender {asset?.display}
        </h1>
      </div>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <Row label="Precio actual" value={fmtEUR(px)} bold />
        <Row label="Participaciones" value={owned.toLocaleString("es-ES", { maximumFractionDigits: 6 })} />
        <Row label="Precio medio compra" value={fmtEUR(avg)} />
      </section>

      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <div className="flex gap-2 mb-3">
          {(["qty", "eur"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setInput("");
              }}
              className="flex-1 py-2 rounded-lg text-xs font-medium border"
              style={{
                background: mode === m ? "var(--navy)" : "transparent",
                color: mode === m ? "var(--cream)" : "var(--navy)",
                borderColor: mode === m ? "var(--navy)" : "var(--border)",
              }}
            >
              {m === "qty" ? "Participaciones" : "Euros"}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>
            Cantidad a vender
          </p>
          <button
            onClick={() => setInput(mode === "qty" ? String(owned) : String((owned * px).toFixed(2)))}
            className="text-xs font-semibold"
            style={{ color: "var(--gold)" }}
          >
            Vender todo
          </button>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9.,]/g, ""))}
          inputMode="decimal"
          placeholder={mode === "qty" ? "0" : "0,00 €"}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:border-[var(--navy)]"
          style={{ borderColor: "var(--border)" }}
        />
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Recibirás</span>
          <span className="tabular-nums font-semibold" style={{ color: "var(--navy)" }}>
            {fmtEUR(proceeds)}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Participaciones</span>
          <span className="tabular-nums">{qty.toLocaleString("es-ES", { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Resultado realizado</span>
          <span
            className="tabular-nums font-medium"
            style={{ color: realizedPnl >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {realizedPnl >= 0 ? "+" : ""}
            {fmtEUR(realizedPnl)}
          </span>
        </div>
        {mode === "eur" && requestedQty > owned && (
          <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
            Importe superior al valor de tu posición
          </p>
        )}
      </section>

      <button
        disabled={!canSell}
        onClick={() => onConfirm(qty, px)}
        className="w-full rounded-xl py-3.5 text-sm font-semibold disabled:opacity-40"
        style={{ background: "var(--navy)", color: "var(--cream)" }}
      >
        Confirmar venta
      </button>
    </div>
  );
}

/* ============================== Helpers ============================== */

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 320;
  const H = 64;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16 mt-3">
      <polyline
        fill="none"
        stroke={up ? "var(--success)" : "var(--danger)"}
        strokeWidth={2}
        points={pts}
      />
    </svg>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl p-5 shadow-xl"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-1 mb-1">
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

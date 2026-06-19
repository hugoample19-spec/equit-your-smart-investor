import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { completeOnboarding } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Equit · Empezar" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const fn = useServerFn(completeOnboarding);
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      toast.error("Introduce un saldo válido");
      return;
    }
    setBusy(true);
    try {
      await fn({ data: { startingBalance: n } });
      navigate({ to: "/" });
    } catch (err) {
      toast.error("No se ha podido guardar");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>
        Tu saldo inicial
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
        ¿Cuánto quieres invertir para empezar? Lo podrás cambiar más adelante.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "var(--border)" }}>
          <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Saldo</label>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[28px] font-semibold" style={{ color: "var(--navy)" }}>€</span>
            <input
              type="number" min="0" step="1" inputMode="decimal"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="text-[36px] font-semibold tracking-tight bg-transparent outline-none w-full tabular-nums"
              style={{ color: "var(--navy)" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1000, 5000, 10000, 25000].map((v) => (
            <button key={v} type="button" onClick={() => setAmount(String(v))}
              className="h-10 rounded-xl border text-xs font-medium"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
              €{v.toLocaleString("es-ES")}
            </button>
          ))}
        </div>

        <button type="submit" disabled={busy}
          className="w-full h-12 rounded-2xl text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--navy)", color: "var(--cream)" }}>
          Empezar
        </button>
      </form>
    </div>
  );
}

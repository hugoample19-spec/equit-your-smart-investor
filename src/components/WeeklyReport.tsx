import { useEffect, useState } from "react";
import { Sparkles, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getWeeklyReport, type WeeklyReportSections } from "@/lib/weekly-report.functions";
import { createCheckoutSession } from "@/lib/stripe.functions";

type Loaded = {
  weekLabel: string;
  sections: WeeklyReportSections;
  createdAt: string;
};

const SECTION_ORDER: { key: keyof WeeklyReportSections; label: string }[] = [
  { key: "macro", label: "MACRO" },
  { key: "bolsa", label: "BOLSA" },
  { key: "cripto", label: "CRIPTO" },
  { key: "referentes", label: "REFERENTES" },
  { key: "radar", label: "RADAR" },
];

const PLACEHOLDER: WeeklyReportSections = {
  macro: "Lectura macro: Fed, BCE e inflación de la semana resumidos para ti.",
  bolsa: "Movimientos clave de S&P500, Nasdaq, IBEX35 y DAX con sectores destacados.",
  cripto: "Bitcoin, Ethereum y narrativas que están moviendo el mercado cripto.",
  referentes: "Qué harían Buffett, Dalio, Druckenmiller y Burry esta semana.",
  radar: "Los 2-3 catalizadores que marcarán la próxima semana.",
};

export function WeeklyReport({ isPremium }: { isPremium: boolean }) {
  const fetchReport = useServerFn(getWeeklyReport);
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Loaded | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setReport(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchReport()
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setReport(res.report);
      })
      .catch((e) => {
        console.error("[weekly-report]", e);
        if (!cancelled) toast.error("No se pudo cargar el informe semanal");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isPremium, fetchReport]);

  const handleUnlock = async () => {
    setCtaLoading(true);
    try {
      const session = await checkout();
      if (session?.url) window.location.href = session.url;
      else toast.error("No se pudo iniciar el pago");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo iniciar el pago");
    } finally {
      setCtaLoading(false);
    }
  };

  return (
    <section
      className="relative rounded-3xl p-6 overflow-hidden shadow-card"
      style={{
        background: "var(--navy)",
        color: "var(--navy-foreground)",
      }}
    >
      {/* Gold shimmer top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--gold) 20%, #f0d27a 50%, var(--gold) 80%, transparent 100%)",
          opacity: 0.85,
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: "var(--gold)" }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--gold)" }}
          >
            Informe Semanal
          </span>
        </div>
        <span className="text-[11px] text-right" style={{ color: "rgba(250,248,245,0.55)" }}>
          {isPremium && report ? report.weekLabel : "Cada lunes"}
        </span>
      </div>

      {/* Body */}
      <div className="mt-4 relative">
        {!isPremium && (
          <>
            <div className="space-y-4 select-none" style={{ filter: "blur(6px)" }} aria-hidden>
              {SECTION_ORDER.map(({ key, label }, idx) => (
                <div key={key}>
                  {idx > 0 && (
                    <div
                      className="h-px mb-4"
                      style={{ background: "rgba(201,168,76,0.25)" }}
                    />
                  )}
                  <p
                    className="text-[11px] font-semibold tracking-[0.18em] mb-1.5"
                    style={{ color: "var(--gold)" }}
                  >
                    {label}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(250,248,245,0.85)" }}>
                    {PLACEHOLDER[key]}
                  </p>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.45)" }}
              >
                <Lock size={16} style={{ color: "var(--gold)" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--navy-foreground)" }}>
                Análisis semanal exclusivo
              </p>
              <p className="text-xs mb-4 max-w-xs" style={{ color: "rgba(250,248,245,0.6)" }}>
                Macro, bolsa, cripto y la mirada de los grandes referentes. Cada lunes.
              </p>
              <button
                onClick={handleUnlock}
                disabled={ctaLoading}
                className="px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #d8b75c 0%, var(--gold) 60%, #a8862f 100%)",
                  color: "var(--navy)",
                  boxShadow: "0 10px 24px -10px rgba(201,168,76,0.6)",
                }}
              >
                {ctaLoading ? "Cargando…" : "Desbloquear Premium"}
              </button>
            </div>
          </>
        )}

        {isPremium && loading && (
          <div className="space-y-4">
            {SECTION_ORDER.map(({ key }, idx) => (
              <div key={key}>
                {idx > 0 && (
                  <div className="h-px mb-4" style={{ background: "rgba(201,168,76,0.18)" }} />
                )}
                <div
                  className="h-2.5 w-20 rounded mb-2 animate-pulse"
                  style={{ background: "rgba(201,168,76,0.45)" }}
                />
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded animate-pulse" style={{ background: "rgba(250,248,245,0.18)" }} />
                  <div className="h-2 w-[92%] rounded animate-pulse" style={{ background: "rgba(250,248,245,0.14)" }} />
                  <div className="h-2 w-[78%] rounded animate-pulse" style={{ background: "rgba(250,248,245,0.12)" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {isPremium && !loading && report && (
          <div className="space-y-4">
            {SECTION_ORDER.map(({ key, label }, idx) => {
              const text = report.sections[key];
              if (!text) return null;
              return (
                <div key={key}>
                  {idx > 0 && (
                    <div className="h-px mb-4" style={{ background: "rgba(201,168,76,0.22)" }} />
                  )}
                  <p
                    className="text-[11px] font-semibold tracking-[0.18em] mb-1.5"
                    style={{ color: "var(--gold)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: "rgba(250,248,245,0.92)" }}
                  >
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {isPremium && !loading && !report && (
          <p className="text-sm py-6 text-center" style={{ color: "rgba(250,248,245,0.6)" }}>
            El informe de esta semana aún no está disponible.
          </p>
        )}
      </div>

      <div
        className="mt-5 pt-4 text-[10px] tracking-wide"
        style={{ color: "rgba(250,248,245,0.4)", borderTop: "1px solid rgba(250,248,245,0.08)" }}
      >
        Generado por IA · Actualizado cada lunes
      </div>
    </section>
  );
}

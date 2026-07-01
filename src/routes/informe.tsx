import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Lock, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import { useApp } from "@/lib/app-context";
import { getWeeklyReport, type WeeklyReportSections } from "@/lib/weekly-report.functions";
import { createCheckoutSession } from "@/lib/stripe.functions";

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•]\s+/gm, "• ");
}

export const Route = createFileRoute("/informe")({
  head: () => ({
    meta: [
      { title: "Informe semanal · Equit" },
      { name: "description", content: "Resumen semanal de mercados: macro, bolsa, cripto y referentes." },
    ],
  }),
  component: InformePage,
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="pt-10 text-center text-sm">
        <p style={{ color: "var(--danger)" }}>No se pudo cargar el informe.</p>
        <button
          className="mt-3 underline"
          onClick={() => { reset(); router.invalidate(); }}
        >
          Reintentar
        </button>
      </div>
    );
  },
  notFoundComponent: () => <p className="pt-10 text-center text-sm">No encontrado</p>,
});

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

const PREVIEW_SECTIONS: WeeklyReportSections = {
  macro:
    "La Fed mantiene tipos en 5,25-5,50% y el BCE encadena su tercera reunión sin cambios. La inflación subyacente en la eurozona sorprende a la baja (2,4%), reabriendo el debate sobre recortes en otoño.",
  bolsa:
    "S&P500 +1,8% en la semana liderado por tecnología; Nasdaq +2,3% empujado por semis. IBEX35 -0,4% lastrado por banca tras el recorte de previsiones. DAX plano. Energía y utilities, los sectores más débiles.",
  cripto:
    "Bitcoin consolida sobre 62.000$ tras tocar 65.000$ a media semana. Ethereum +3,2% acompañado por entradas netas en ETFs spot. Narrativa dominante: rotación hacia L2s.",
  referentes:
    "Buffett seguiría acumulando caja a la espera de múltiplos más bajos. Dalio reforzaría oro y bonos largos como cobertura. Druckenmiller iría largo de IA mientras la tendencia aguante. Burry mantendría cortos selectivos sobre consumo discrecional.",
  radar:
    "1) Datos de empleo no agrícola en EE.UU. (viernes). 2) IPC adelantado de la eurozona. 3) Resultados de Nvidia: termómetro del ciclo IA.",
};

function formatWeekShort(weekLabel: string | undefined): string {
  if (!weekLabel) return "Esta semana";
  const match = weekLabel.match(/(\d{1,2})\s+([A-Za-zñáéíóú]+)/);
  return match ? `${match[1]} ${match[2]}` : weekLabel;
}

function InformePage() {
  const { isPremium } = useApp();
  const fetchReport = useServerFn(getWeeklyReport);
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Loaded | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);

  useEffect(() => {
    if (!isPremium) { setReport(null); return; }
    let cancelled = false;
    setLoading(true);
    fetchReport()
      .then((res) => { if (!cancelled && res.ok) setReport(res.report); })
      .catch((e) => {
        console.error("[informe]", e);
        if (!cancelled) toast.error("No se pudo cargar el informe semanal");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
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

  const handleDownload = () => {
    if (!report) return;
    const lines: string[] = [];
    lines.push("INFORME SEMANAL EQUIT");
    lines.push(report.weekLabel);
    lines.push("");
    for (const { key, label } of SECTION_ORDER) {
      const text = report.sections[key];
      if (!text) continue;
      lines.push(label);
      lines.push("".padEnd(label.length, "─"));
      lines.push(text);
      lines.push("");
    }
    lines.push("— Análisis Equit · IA · Actualizado cada lunes");
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-equit-${formatWeekShort(report.weekLabel).replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const weekLabel = report?.weekLabel ?? "Esta semana";
  const displayShort = formatWeekShort(report?.weekLabel);
  const visibleSections: WeeklyReportSections =
    isPremium && report ? report.sections : PREVIEW_SECTIONS;

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 grid grid-cols-3 items-center px-4 py-3 border-b"
        style={{ background: "var(--cream)", borderColor: "rgba(26,26,46,0.08)" }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium justify-self-start"
          style={{ color: "var(--navy)" }}
        >
          <ArrowLeft size={16} /> Inicio
        </Link>
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles size={12} style={{ color: "var(--gold)" }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--gold)" }}
          >
            Informe Semanal
          </span>
        </div>
        <span
          className="text-[11px] font-medium justify-self-end"
          style={{ color: "var(--muted-foreground)" }}
        >
          {displayShort}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-12">
        {/* Locked state */}
        {!isPremium && (
          <div className="relative">
            <div
              className="space-y-4"
              style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}
              aria-hidden
            >
              {SECTION_ORDER.map(({ key, label }) => (
                <section key={key} className="bg-card rounded-2xl p-5 shadow-soft">
                  <p
                    className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-2"
                    style={{ color: "var(--gold)" }}
                  >
                    {label}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--navy)" }}>
                    {PREVIEW_SECTIONS[key]}
                  </p>
                </section>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div
                className="w-full max-w-xs rounded-2xl p-6 text-center"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(201,168,76,0.45)",
                  boxShadow: "0 20px 50px -20px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "rgba(201,168,76,0.18)",
                    border: "1px solid rgba(201,168,76,0.5)",
                  }}
                >
                  <Lock size={16} style={{ color: "var(--gold)" }} />
                </div>
                <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                  Informe semanal Premium
                </p>
                <p
                  className="text-xs mb-5 leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Macro, bolsa, cripto y la mirada de los grandes referentes. Resumen exclusivo cada lunes.
                </p>
                <button
                  onClick={handleUnlock}
                  disabled={ctaLoading}
                  className="w-full px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #d8b75c 0%, var(--gold) 60%, #a8862f 100%)",
                    color: "var(--navy)",
                    boxShadow: "0 10px 24px -10px rgba(201,168,76,0.6)",
                  }}
                >
                  {ctaLoading ? "Cargando…" : "Desbloquear Premium"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Premium loading */}
        {isPremium && loading && (
          SECTION_ORDER.map(({ key }) => (
            <section key={key} className="bg-card rounded-2xl p-5 shadow-soft">
              <div
                className="h-2.5 w-20 rounded mb-3 animate-pulse"
                style={{ background: "rgba(201,168,76,0.45)" }}
              />
              <div className="space-y-2">
                <div className="h-2 w-full rounded animate-pulse" style={{ background: "rgba(26,26,46,0.12)" }} />
                <div className="h-2 w-[92%] rounded animate-pulse" style={{ background: "rgba(26,26,46,0.10)" }} />
                <div className="h-2 w-[78%] rounded animate-pulse" style={{ background: "rgba(26,26,46,0.08)" }} />
              </div>
            </section>
          ))
        )}

        {/* Premium loaded */}
        {isPremium && !loading && report && (
          <>
            <p className="text-base font-medium" style={{ color: "var(--navy)" }}>
              {weekLabel}
            </p>
            {SECTION_ORDER.map(({ key, label }) => {
              const text = visibleSections[key];
              if (!text) return null;
              return (
                <section key={key} className="bg-card rounded-2xl p-5 shadow-soft">
                  <p
                    className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-2"
                    style={{ color: "var(--gold)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-[14px] leading-relaxed whitespace-pre-line"
                    style={{ color: "var(--navy)" }}
                  >
                    {text}
                  </p>
                </section>
              );
            })}

            <button
              onClick={handleDownload}
              className="w-full py-3 rounded-2xl text-sm font-semibold border-2 flex items-center justify-center gap-2 transition-colors"
              style={{ borderColor: "var(--navy)", color: "var(--navy)", background: "transparent" }}
            >
              <Download size={14} /> Descargar informe
            </button>

            <p
              className="text-[10px] text-center pt-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Análisis Equit · IA · Actualizado cada lunes
            </p>
          </>
        )}

        {isPremium && !loading && !report && (
          <p className="text-sm py-10 text-center" style={{ color: "var(--muted-foreground)" }}>
            El informe de esta semana aún no está disponible.
          </p>
        )}
      </main>
    </div>
  );
}

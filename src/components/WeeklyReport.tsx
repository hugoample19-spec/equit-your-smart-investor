import { useEffect, useState } from "react";
import { Sparkles, Lock, ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getWeeklyReport, type WeeklyReportSections } from "@/lib/weekly-report.functions";
import { createCheckoutSession } from "@/lib/stripe.functions";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

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

// Plausible-sounding placeholder content shown blurred to non-premium users
// so they see the structure of what they're missing.
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
  // Try to extract trailing "DD mmm" from "Semana del 22 jun"
  const match = weekLabel.match(/(\d{1,2})\s+([A-Za-zñáéíóú]+)/);
  return match ? `${match[1]} ${match[2]}` : weekLabel;
}

export function WeeklyReport({ isPremium }: { isPremium: boolean }) {
  const fetchReport = useServerFn(getWeeklyReport);
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Loaded | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [open, setOpen] = useState(false);

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

  const displayWeek = formatWeekShort(report?.weekLabel);
  const visibleSections: WeeklyReportSections =
    isPremium && report ? report.sections : PREVIEW_SECTIONS;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl pl-4 pr-3.5 py-3 text-left transition-transform active:scale-[0.99]"
        style={{
          background: "var(--navy)",
          borderLeft: "3px solid var(--gold)",
          boxShadow: "0 8px 20px -12px rgba(26,26,46,0.45)",
          color: "var(--navy-foreground)",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles size={16} style={{ color: "var(--gold)" }} />
          <div className="flex flex-col min-w-0">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.22em] leading-tight"
              style={{ color: "var(--navy-foreground)" }}
            >
              Informe Semanal
            </span>
            <span
              className="text-[11px] leading-tight mt-0.5"
              style={{ color: "rgba(201,168,76,0.85)" }}
            >
              {displayWeek}
            </span>
          </div>
        </div>
        <span
          className="flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap"
          style={{ color: "var(--gold)" }}
        >
          Ver
          <ChevronRight size={14} />
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          className="border-none"
          style={{ background: "var(--navy)", color: "var(--navy-foreground)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--gold) 20%, #f0d27a 50%, var(--gold) 80%, transparent 100%)",
            }}
          />
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "var(--gold)" }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--gold)" }}
              >
                Informe Semanal
              </span>
            </div>
            <DrawerTitle
              className="text-base font-medium mt-1"
              style={{ color: "var(--navy-foreground)" }}
            >
              {isPremium && report ? report.weekLabel : "Esta semana en los mercados"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="relative px-4 pb-8 max-h-[72vh] overflow-y-auto">
            {/* Content (real for premium, preview for free) */}
            <div
              className="space-y-4"
              style={
                !isPremium
                  ? {
                      filter: "blur(5px)",
                      pointerEvents: "none",
                      userSelect: "none",
                    }
                  : undefined
              }
              aria-hidden={!isPremium}
            >
              {isPremium && loading
                ? SECTION_ORDER.map(({ key }, idx) => (
                    <div key={key}>
                      {idx > 0 && (
                        <div
                          className="h-px mb-4"
                          style={{ background: "rgba(201,168,76,0.18)" }}
                        />
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
                  ))
                : SECTION_ORDER.map(({ key, label }, idx) => {
                    const text = visibleSections[key];
                    if (!text) return null;
                    return (
                      <div key={key}>
                        {idx > 0 && (
                          <div
                            className="h-px mb-4"
                            style={{ background: "rgba(201,168,76,0.22)" }}
                          />
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

            {isPremium && !loading && !report && (
              <p className="text-sm py-6 text-center" style={{ color: "rgba(250,248,245,0.6)" }}>
                El informe de esta semana aún no está disponible.
              </p>
            )}

            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div
                  className="w-full max-w-xs rounded-2xl p-6 text-center"
                  style={{
                    background: "rgba(26,26,46,0.78)",
                    border: "1px solid rgba(201,168,76,0.35)",
                    boxShadow: "0 20px 50px -20px rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
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
                  <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--navy-foreground)" }}>
                    Informe semanal Premium
                  </p>
                  <p
                    className="text-xs mb-5 leading-relaxed"
                    style={{ color: "rgba(250,248,245,0.65)" }}
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
                    {ctaLoading ? "Cargando…" : "Desbloquear por 3,99€/mes"}
                  </button>
                </div>
              </div>
            )}

            <div
              className="mt-6 pt-4 text-[10px] tracking-wide text-center"
              style={{
                color: "rgba(250,248,245,0.4)",
                borderTop: "1px solid rgba(250,248,245,0.08)",
              }}
            >
              Generado por IA · Actualizado cada lunes
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

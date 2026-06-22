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

  const handleClick = () => {
    if (!isPremium) {
      void handleUnlock();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={ctaLoading}
        className="w-full flex items-center justify-between gap-3 rounded-2xl pl-4 pr-3 py-3 text-left transition-colors disabled:opacity-60"
        style={{
          background: "var(--card)",
          borderLeft: "3px solid var(--gold)",
          boxShadow: "0 1px 2px rgba(26,26,46,0.04)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={15} style={{ color: "var(--gold)" }} />
          <span className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>
            Informe semanal
          </span>
        </div>
        {isPremium ? (
          <span
            className="flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap"
            style={{ color: "var(--gold)" }}
          >
            Esta semana
            <ChevronRight size={14} />
          </span>
        ) : (
          <span
            className="flex items-center gap-1 text-xs whitespace-nowrap"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Lock size={12} />
            {ctaLoading ? "Cargando…" : "Premium"}
          </span>
        )}
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
              {report?.weekLabel ?? "Cargando…"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">
            {loading && (
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

            {!loading && report && (
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

            {!loading && !report && (
              <p className="text-sm py-6 text-center" style={{ color: "rgba(250,248,245,0.6)" }}>
                El informe de esta semana aún no está disponible.
              </p>
            )}

            <div
              className="mt-6 pt-4 text-[10px] tracking-wide text-center"
              style={{ color: "rgba(250,248,245,0.4)", borderTop: "1px solid rgba(250,248,245,0.08)" }}
            >
              Generado por IA · Actualizado cada lunes
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

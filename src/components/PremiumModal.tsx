import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/stripe.functions";

const BENEFITS = [
  "Todos los referentes desbloqueados (Buffett, Dalio, Ackman, Cathie Wood…)",
  "Inversión en criptomonedas",
  "Análisis IA de noticias: entiende cómo afectan a tu cartera",
  "Insignia Premium en tu perfil",
];

export function PremiumModal({
  onClose,
  onSubscribe,
}: {
  onClose: () => void;
  onSubscribe?: () => void;
}) {
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (onSubscribe) {
      onSubscribe();
      return;
    }
    setLoading(true);
    try {
      const { url } = await checkout();
      if (!url) throw new Error("No checkout URL");
      window.location.href = url;
    } catch (err) {
      console.error("[premium] checkout failed:", err);
      toast.error("Error al procesar el pago. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(10,18,40,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-soft relative"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4" aria-label="Cerrar">
          <X size={18} style={{ color: "var(--muted-foreground)" }} />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "var(--gold)" }} />
          <span className="text-[11px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>
            EQUIT PREMIUM
          </span>
        </div>
        <h2 className="text-2xl font-semibold mt-2 leading-tight" style={{ color: "var(--navy)" }}>
          Desbloquea el análisis IA y mucho más
        </h2>
        <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
          Lleva tu aprendizaje al siguiente nivel con herramientas premium para inversores.
        </p>
        <ul className="mt-4 space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm" style={{ color: "var(--navy)" }}>
              <Check size={16} style={{ color: "var(--gold)" }} className="mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: "var(--navy)" }}>€3,99</span>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>/mes</span>
        </div>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-4 w-full rounded-2xl py-3.5 text-sm font-semibold shadow-soft flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: "var(--gold)", color: "var(--navy)" }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Procesando…
            </>
          ) : (
            "Suscribirme"
          )}
        </button>
        <p className="text-[10px] text-center mt-3" style={{ color: "var(--muted-foreground)" }}>
          Cancela cuando quieras desde tu perfil.
        </p>
      </div>
    </div>
  );
}

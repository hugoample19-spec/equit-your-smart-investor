import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Lock, X } from "lucide-react";
import { investors } from "@/lib/data";
import { useApp } from "@/lib/app-context";
import { PremiumBanner } from "./index";
import { InvestorLogo } from "@/components/InvestorLogo";
import { PremiumModal } from "@/components/PremiumModal";



export const Route = createFileRoute("/referentes/")({
  head: () => ({
    meta: [
      { title: "Referentes · Equit" },
      { name: "description", content: "Los mayores inversores del mundo y sus carteras." },
    ],
  }),
  component: ReferentesPage,
});

function ReferentesPage() {
  const { isPremium, favoriteReferenteId, setFavoriteReferente } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>Referentes</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Aprende y copia a los grandes</p>
        </div>
        <button
          type="button"
          aria-label="¿Cómo funciona esto?"
          onClick={() => setInfoOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{ background: "var(--muted)", color: "var(--navy)" }}
        >
          <Info size={14} />
          <span className="hidden sm:inline">¿Cómo funciona esto?</span>
        </button>
      </div>


      <div className="grid grid-cols-2 gap-3">
        {investors.map((i) => {
          const locked = i.locked && !isPremium;
          const isFav = favoriteReferenteId === i.id;
          return (
            <div key={i.id} className="relative rounded-2xl overflow-hidden shadow-soft bg-card">
              <button
                aria-label={isFav ? "Quitar favorito" : "Marcar favorito"}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFavoriteReferente(isFav ? null : i.id); }}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{ background: "rgba(26,26,46,0.45)" }}
              >
                <Star size={16} fill={isFav ? "var(--gold)" : "none"} color="var(--gold)" strokeWidth={2} />
              </button>
              {locked ? (
                <button
                  type="button"
                  onClick={() => setShowPremium(true)}
                  className="block w-full text-left"
                >
                  <div className="aspect-[3/4] relative" style={{ background: "var(--navy)" }}>
                    <div className="absolute inset-0" style={{ filter: "blur(10px)" }}>
                      <InvestorLogo bgColor={i.color} name={i.name} />
                    </div>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,46,0) 35%, rgba(26,26,46,0.85) 100%)" }} />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(26,26,46,0.35)" }}>
                      <div className="flex flex-col items-center text-center px-3">
                        <Lock size={20} style={{ color: "var(--gold)" }} />
                        <p className="mt-1.5 text-[9px] font-semibold tracking-wider" style={{ color: "var(--gold)" }}>EQUIT PREMIUM</p>
                        <p className="text-[10px]" style={{ color: "rgba(250,248,245,0.85)" }}>€3,99/mes</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left z-10">
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gold)" }}>{i.fund}</p>
                      <p className="text-sm font-semibold leading-tight" style={{ color: "var(--cream)" }}>{i.name}</p>
                    </div>
                  </div>
                </button>
              ) : (
                <Link to="/referentes/$id" params={{ id: i.id }}>
                  <div className="aspect-[3/4] relative" style={{ background: "var(--navy)" }}>
                    <InvestorLogo bgColor={i.color} name={i.name} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,46,0) 35%, rgba(26,26,46,0.85) 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left z-10">
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gold)" }}>{i.fund}</p>
                      <p className="text-sm font-semibold leading-tight" style={{ color: "var(--cream)" }}>{i.name}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--cream)" }}>{i.netWorth}</p>
                    </div>
                  </div>
                </Link>
              )}

            </div>
          );
        })}
      </div>

      <PremiumBanner />
      {showPremium && (
        <PremiumModal onClose={() => setShowPremium(false)} />
      )}

      {infoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(10,18,40,0.55)" }}
          onClick={() => setInfoOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 shadow-soft relative"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInfoOpen(false)}
              className="absolute top-3 right-3"
              aria-label="Cerrar"
            >
              <X size={18} style={{ color: "var(--muted-foreground)" }} />
            </button>
            <div className="flex items-center gap-2">
              <Info size={18} style={{ color: "var(--gold)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--navy)" }}>
                ¿Cómo funciona esto?
              </h2>
            </div>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Las carteras que ves provienen de los informes 13F que todos los grandes fondos de EE. UU. deben presentar públicamente ante la SEC cada trimestre. Los datos se actualizan cada ~3 meses, unos 45 días después de cerrar cada trimestre, por lo que reflejan la última posición pública declarada y no las tenencias en tiempo real.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


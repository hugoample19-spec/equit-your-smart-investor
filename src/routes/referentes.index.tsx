import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Star } from "lucide-react";
import { investors } from "@/lib/data";
import { useApp } from "@/lib/app-context";
import { PremiumBanner } from "./index";

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
  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>Referentes</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Aprende y copia a los grandes</p>
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
              <Link to="/referentes/$id" params={{ id: i.id }}>
                <div className="aspect-[3/4] relative">
                  <img src={i.photo} alt={i.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,46,0) 35%, rgba(26,26,46,0.85) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gold)" }}>{i.fund}</p>
                    <p className="text-sm font-semibold leading-tight" style={{ color: "var(--cream)" }}>{i.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--cream)" }}>{i.netWorth}</p>
                  </div>
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md text-center p-3" style={{ background: "rgba(26,26,46,0.55)" }}>
                      <Lock size={22} style={{ color: "var(--gold)" }} />
                      <p className="mt-2 text-[10px] font-semibold tracking-wider" style={{ color: "var(--cream)" }}>🔒 EQUIT PREMIUM</p>
                      <p className="text-[10px]" style={{ color: "rgba(250,248,245,0.8)" }}>€3,99/mes</p>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <PremiumBanner />
    </div>
  );
}

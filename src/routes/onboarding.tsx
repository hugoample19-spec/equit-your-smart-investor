import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { completeOnboarding } from "@/lib/profile.functions";
import { useApp } from "@/lib/app-context";
import { Home, Users, Newspaper, Wallet, User, Shield } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Equit · Empezar" }] }),
  component: Onboarding,
});

type Step = {
  Icon: typeof Home;
  title: string;
  body: string;
  bg: string;
  legal?: boolean;
};

const GOLD_DEEP = "#B8952A";

const STEPS: Step[] = [
  {
    Icon: Home,
    title: "Tu cartera, en tiempo real",
    body: "Sigue tu rendimiento, ve qué compra la comunidad y compite en el ranking.",
    bg: "var(--navy)",
  },
  {
    Icon: Users,
    title: "Invierte como Buffett",
    body: "Carteras reales de los 10 mejores inversores del mundo. Cópialas con un toque.",
    bg: GOLD_DEEP,
  },
  {
    Icon: Newspaper,
    title: "Noticias que importan",
    body: "Mercados, cripto y macro en español. Mantén tu racha leyendo cada día.",
    bg: "var(--navy)",
  },
  {
    Icon: Wallet,
    title: "Invierte sin arriesgar nada",
    body: "€1.000 virtuales para practicar con acciones, ETFs y criptos reales.",
    bg: GOLD_DEEP,
  },
  {
    Icon: User,
    title: "Compite con tus amigos",
    body: "Añádelos con tu código único y sube en el ranking.",
    bg: "var(--navy)",
  },
  {
    Icon: Shield,
    title: "Antes de empezar",
    body: "Equit es una app de simulación con dinero virtual. El contenido e informes de IA son solo informativos y no constituyen asesoramiento financiero.",
    bg: "var(--navy)",
    legal: true,
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile, isAuthenticated, authLoading } = useApp();
  const completeFn = useServerFn(completeOnboarding);
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const seededRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (seededRef.current) return;
    if (profile && profile.onboarded) return;
    seededRef.current = true;
    completeFn({ data: { startingBalance: 1000 } })
      .then(() => refreshProfile())
      .catch(() => {
        seededRef.current = false;
      });
  }, [authLoading, isAuthenticated, profile, completeFn, refreshProfile]);

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      if (!profile?.onboarded) {
        await completeFn({ data: { startingBalance: 1000 } }).catch(() => {});
        await refreshProfile();
      }
    } finally {
      navigate({ to: "/" });
    }
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const { Icon, title, body, bg, legal } = current;
  const canAdvance = !legal || accepted;

  const goNext = () => {
    if (isLast) {
      if (canAdvance) void finish();
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  return (
    <div
      className="min-h-[88vh] flex flex-col -mx-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-4 pt-2">
        <span className="text-[11px] tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
        </span>
        {!legal ? (
          <button
            type="button"
            onClick={finish}
            className="text-xs font-medium underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            Saltar
          </button>
        ) : (
          <span />
        )}
      </div>

      {/* Colored hero zone */}
      <div
        className="relative flex items-center justify-center"
        style={{ background: bg, minHeight: "45vh" }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            background: "rgba(255,255,255,0.10)",
          }}
        />
        <Icon size={64} color="#ffffff" strokeWidth={1.6} style={{ position: "relative" }} />
      </div>

      {/* Cream content zone */}
      <div
        className="flex-1 flex flex-col items-center text-center px-6 pt-8"
        style={{ background: "var(--cream, #FAF7F0)" }}
      >
        <h1
          className="text-[26px] font-semibold"
          style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        <p
          className="mt-3 text-sm leading-relaxed max-w-[340px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          {body}
        </p>

        {legal && (
          <label className="mt-6 flex items-start gap-3 max-w-[340px] text-left cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--navy)]"
            />
            <span className="text-xs leading-relaxed" style={{ color: "var(--navy)" }}>
              Acepto los{" "}
              <a href="/terms" className="underline font-medium">
                Términos y Condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacy" className="underline font-medium">
                Política de Privacidad
              </a>
              .
            </span>
          </label>
        )}

        <div className="flex items-center gap-1.5 mt-auto pt-8">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 20 : 6,
                background: i === step ? "var(--gold)" : "var(--border)",
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-[380px] py-4">
          <button
            type="button"
            onClick={goNext}
            disabled={finishing || (isLast && !canAdvance)}
            className="w-full h-12 rounded-2xl text-sm font-medium disabled:opacity-40"
            style={{ background: "var(--navy)", color: "var(--cream)" }}
          >
            {isLast ? "Empezar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

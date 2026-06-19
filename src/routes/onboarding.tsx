import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { completeOnboarding } from "@/lib/profile.functions";
import { useApp } from "@/lib/app-context";
import { Home, Users, Newspaper, Wallet, User } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Equit · Empezar" }] }),
  component: Onboarding,
});

const STEPS = [
  {
    Icon: Home,
    title: "Tu panel principal",
    body: "Aquí verás el valor de tu cartera en tiempo real, los activos más comprados por la comunidad y los referentes que siguen los grandes inversores.",
  },
  {
    Icon: Users,
    title: "Aprende de los mejores",
    body: "Consulta las carteras reales de Warren Buffett, Ray Dalio y otros grandes inversores. Copia su estrategia con un toque.",
  },
  {
    Icon: Newspaper,
    title: "Mantente informado",
    body: "Lee las noticias financieras más relevantes cada día y mantén tu racha de lectura.",
  },
  {
    Icon: Wallet,
    title: "Invierte sin riesgo",
    body: "Compra acciones, ETFs, materias primas y criptomonedas con dinero simulado. Sigue tu rendimiento real.",
  },
  {
    Icon: User,
    title: "Compite con tus amigos",
    body: "Agrega amigos con tu código único, compara rendimientos y sube en el ranking.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile, isAuthenticated, authLoading } = useApp();
  const completeFn = useServerFn(completeOnboarding);
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const seededRef = useRef(false);

  // Seed the default €1.000 starting balance in the background, once.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (seededRef.current) return;
    if (profile && profile.onboarded) return;
    seededRef.current = true;
    completeFn({ data: { startingBalance: 1000 } })
      .then(() => refreshProfile())
      .catch(() => { seededRef.current = false; });
  }, [authLoading, isAuthenticated, profile, completeFn, refreshProfile]);

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      // Make sure the profile is onboarded before navigating, otherwise the
      // Layout gate would loop us right back to /onboarding.
      if (!profile?.onboarded) {
        await completeFn({ data: { startingBalance: 1000 } }).catch(() => {});
        await refreshProfile();
      }
    } finally {
      navigate({ to: "/" });
    }
  };

  const isLast = step === STEPS.length - 1;
  const { Icon, title, body } = STEPS[step];

  return (
    <div className="min-h-[88vh] flex flex-col">
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={finish}
          className="text-xs font-medium underline"
          style={{ color: "var(--muted-foreground)" }}
        >
          Saltar
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-card"
          style={{ background: "var(--navy)" }}
        >
          <Icon size={42} color="var(--gold)" strokeWidth={1.75} />
        </div>
        <h1
          className="mt-8 text-[26px] font-semibold tracking-tight"
          style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        <p
          className="mt-3 text-sm leading-relaxed max-w-[320px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          {body}
        </p>

        <div className="flex items-center gap-1.5 mt-8">
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
      </div>

      <div className="pb-2">
        <button
          type="button"
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          disabled={finishing}
          className="w-full h-12 rounded-2xl text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--navy)", color: "var(--cream)" }}
        >
          {isLast ? "Empezar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { validateDisplayName } from "@/lib/profile.functions";
import { toast } from "sonner";

const DISPLAY_NAME_RE = /^[a-zA-ZÀ-ÿ0-9 _.\-]+$/;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Equit · Iniciar sesión" },
      { name: "description", content: "Accede a Equit con tu cuenta de Google." },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.62 6.62 0 0 1 5.48 12c0-.73.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const onGoogle = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        toast.error("No se ha podido iniciar sesión con Google");
        setBusy(false);
        return;
      }
      if (res.redirected) return;
      navigate({ to: "/" });
    } catch (e) {
      toast.error("Error inesperado");
      setBusy(false);
    }
  };

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      const name = displayName.trim();
      if (name.length < 2) {
        toast.error("El nombre debe tener al menos 2 caracteres");
        return;
      }
      if (!DISPLAY_NAME_RE.test(name)) {
        toast.error("El nombre contiene caracteres no permitidos");
        return;
      }
      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const name = displayName.trim();
        const check = await validateDisplayName({ data: { name } });
        if (!check.ok) {
          if (check.reason === "taken") toast.error("Ese nombre ya está en uso. Elige otro.");
          else if (check.reason === "profanity") toast.error("Ese nombre no está permitido.");
          else toast.error("Nombre no válido");
          setBusy(false);
          return;
        }
        // Email confirmation disabled during beta — re-enable before public launch
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. ¡Bienvenido a Equit!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-2">
      <div className="w-full">
        <h1 className="text-[28px] font-semibold tracking-tight text-center" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>
          Bienvenido a Equit
        </h1>
        <p className="mt-2 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          Invierte como los grandes. Empieza en segundos.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={onGoogle}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 bg-white border shadow-card text-[15px] font-medium disabled:opacity-60"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          {!showEmail ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="w-full text-xs underline mt-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              o usar email y contraseña
            </button>
          ) : (
            <form onSubmit={onEmail} className="space-y-2 pt-2">
              {mode === "signup" && (
                <input
                  type="text" required placeholder="Tu nombre en Equit" maxLength={20}
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 border bg-white text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              )}
              <input
                type="email" required placeholder="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl px-4 border bg-white text-sm"
                style={{ borderColor: "var(--border)" }}
              />
              <input
                type="password" required placeholder="contraseña" minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl px-4 border bg-white text-sm"
                style={{ borderColor: "var(--border)" }}
              />
              {mode === "signup" && (
                <input
                  type="password" required placeholder="Confirma tu contraseña" minLength={6}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 border bg-white text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              )}
              <button
                type="submit" disabled={busy}
                className="w-full h-11 rounded-xl text-sm font-medium disabled:opacity-60"
                style={{ background: "var(--navy)", color: "var(--cream)" }}
              >
                {mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="w-full text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {mode === "signup" ? "¿Ya tienes cuenta? Inicia sesión" : "¿Nuevo en Equit? Crea una cuenta"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-[11px] text-center" style={{ color: "var(--muted-foreground)" }}>
          Al continuar aceptas los términos y la política de privacidad de Equit.
        </p>
      </div>
    </div>
  );
}

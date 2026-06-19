import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Camera, LogOut, Search, Star, X, Zap } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { investors, globalUsers, findUserByCode } from "@/lib/data";
import { usePortfolioSummary } from "@/lib/portfolio";
import { useServerFn } from "@tanstack/react-start";
import { getNotificationPrefs, updateNotificationPrefs } from "@/lib/notifications.functions";
import { toast } from "sonner";



export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Equit" },
      { name: "description", content: "Tu perfil, código de amigo, rendimiento y plan." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const {
    username, fullName, avatar, setAvatar, isPremium, setIsPremium,
    friendCode, favoriteReferenteId, isPortfolioPublic, setIsPortfolioPublic,
    friendCodes, addFriend, removeFriend, streak,
    isAuthenticated, signOut,
  } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const favRef = investors.find((i) => i.id === favoriteReferenteId);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const cleaned = search.replace(/[^0-9]/g, "");
  const found = cleaned.length === 8 ? findUserByCode(cleaned) : undefined;
  const myFriends = globalUsers.filter((u) => friendCodes.includes(u.code)).sort((a, b) => b.perf - a.perf);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col items-center pt-2">
        <div className="relative w-24 h-24">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-card" style={{ background: "var(--navy)" }}>
            {avatar ? (
              <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold" style={{ color: "var(--cream)" }}>{initials}</span>
            )}
          </div>

          {/* Camera button — bottom-left */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Cambiar foto"
            className="absolute -bottom-0.5 -left-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-soft"
            style={{ background: "var(--gold)", borderColor: "var(--cream)" }}
          >
            <Camera size={14} color="var(--navy)" />
          </button>

          {/* Favorite referente badge — bottom-right */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border-2 z-10 shadow-soft"
            style={{ background: "var(--cream)", borderColor: "var(--cream)" }}
          >
            {favRef ? (
              <img src={favRef.photo} alt={favRef.name} className="w-full h-full object-cover" />
            ) : (
              <Star size={14} color="var(--gold)" />
            )}
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="absolute opacity-0 pointer-events-none w-px h-px overflow-hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <h1 className="mt-3 text-xl font-semibold" style={{ color: "var(--navy)" }}>{fullName}</h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>@{username}</p>
        <p className="text-base font-semibold mt-1 tabular-nums" style={{ color: "var(--gold)" }}>#{friendCode}</p>
        <p className="text-[10px] tracking-wider" style={{ color: "var(--muted-foreground)" }}>TU CÓDIGO DE AMIGO</p>
      </div>


      {/* Settings — privacy toggle */}
      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Ajustes</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>Cartera {isPortfolioPublic ? "pública" : "privada"}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {isPortfolioPublic ? "Otros usuarios ven tu distribución y rendimiento" : "Solo se ve tu @handle y rendimiento"}
            </p>
          </div>
          <button
            onClick={() => setIsPortfolioPublic(!isPortfolioPublic)}
            className="relative w-12 h-7 rounded-full transition-colors"
            style={{ background: isPortfolioPublic ? "var(--gold)" : "var(--muted)" }}
            aria-label="Toggle privacy"
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full shadow-card transition-all"
              style={{ background: "var(--cream)", left: isPortfolioPublic ? "calc(100% - 26px)" : "2px" }}
            />
          </button>
        </div>
      </section>

      {/* Friends */}
      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Amigos</h3>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9A9AAB" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código #XXXXXXXX"
            inputMode="numeric"
            maxLength={9}
            className="w-full pl-9 pr-3 py-2.5 rounded-full text-sm outline-none border"
            style={{ background: "var(--muted)", borderColor: "transparent", color: "var(--navy)" }}
          />
        </div>

        {cleaned.length >= 1 && cleaned.length < 8 && (
          <p className="text-[11px] mb-3" style={{ color: "var(--muted-foreground)" }}>Introduce los 8 dígitos</p>
        )}

        {cleaned.length === 8 && !found && (
          <p className="text-[11px] mb-3" style={{ color: "var(--danger)" }}>Código no encontrado</p>
        )}

        {found && (
          <div className="flex items-center gap-3 p-3 rounded-2xl mb-3" style={{ background: "var(--muted)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--navy)", color: "var(--cream)" }}>
              {found.name.split(" ").map(w => w[0]).slice(0,2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{found.name}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{found.handle} · #{found.code}</p>
            </div>
            {friendCodes.includes(found.code) ? (
              <span className="text-[11px] font-medium" style={{ color: "var(--success)" }}>Añadido</span>
            ) : (
              <button
                onClick={() => { addFriend(found.code); setSearch(""); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "var(--navy)", color: "var(--cream)" }}
              >
                Agregar
              </button>
            )}
          </div>
        )}

        <p className="text-[10px] tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>MIS AMIGOS ({myFriends.length})</p>
        <ul className="space-y-3">
          {myFriends.map((f) => (
            <li key={f.code} className="flex items-center gap-3">
              <Link to="/u/$code" params={{ code: f.code }} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "var(--muted)", color: "var(--navy)" }}>
                  {f.handle.slice(1, 3).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{f.handle}</p>
                  <p className="text-[10px] tabular-nums" style={{ color: "var(--muted-foreground)" }}>#{f.code}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums" style={{ color: f.perf >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {f.perf >= 0 ? "+" : ""}{f.perf.toFixed(1)}%
                </span>
              </Link>
              <button onClick={() => removeFriend(f.code)} className="p-1" aria-label="Eliminar">
                <X size={14} color="#9A9AAB" />
              </button>
            </li>
          ))}
          {!myFriends.length && <p className="text-xs text-center py-3" style={{ color: "var(--muted-foreground)" }}>Aún no tienes amigos. Busca un código arriba.</p>}
        </ul>
      </section>

      {/* Performance card — real data from wallet */}
      <PerformanceCard />

      {/* Streak card — bigger, with weekly view */}
      <StreakCard
        current={streak.current}
        longest={streak.longest}
        lastReadDate={streak.lastReadDate}
      />


      {/* Plan + logout */}
      <div className="flex items-center justify-between bg-card rounded-2xl p-4 shadow-soft">
        <div>
          <p className="text-[10px] tracking-widest" style={{ color: "var(--muted-foreground)" }}>PLAN</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: isPremium ? "var(--gold)" : "var(--navy)" }}>
            {isPremium ? "Equit Premium" : "Free"}
          </p>
        </div>
        <button
          onClick={() => setIsPremium(!isPremium)}
          className="px-4 py-2 rounded-full border text-xs font-medium"
          style={{ borderColor: "var(--border)", color: "var(--navy)" }}
        >
          {isPremium ? "Cambiar a Free" : "Probar Premium"}
        </button>
      </div>

      <NotificationSettings />

      <button
        onClick={async () => {
          await signOut();
          navigate({ to: "/auth" });
        }}
        disabled={!isAuthenticated}
        className="w-full py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ color: "var(--muted-foreground)" }}
      >
        <LogOut size={14} /> Cerrar sesión
      </button>
    </div>
  );
}

function PerformanceCard() {
  const summary = usePortfolioSummary();
  const series = summary.series;
  const hasSeries = series.length >= 2;

  const points = useMemo(() => {
    if (!hasSeries) return "";
    const vals = series.map((s) => s.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    return series
      .map((s, i) => `${(i / (series.length - 1)) * 300},${50 - ((s.v - min) / span) * 40}`)
      .join(" ");
  }, [series, hasSeries]);

  const pct = summary.totalReturnPct;
  const pctStr = (pct >= 0 ? "+" : "") + pct.toLocaleString("es-ES", { maximumFractionDigits: 1 }) + "%";
  const color = pct >= 0 ? "var(--gold)" : "#FF7A8A";

  return (
    <section className="rounded-3xl p-5 shadow-card" style={{ background: "var(--navy)", color: "var(--cream)" }}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-widest" style={{ color: "rgba(250,248,245,0.5)" }}>RENDIMIENTO TOTAL</p>
          <p className="text-4xl font-semibold mt-1 tabular-nums" style={{ color }}>{summary.hasWallet ? pctStr : "—"}</p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(250,248,245,0.6)" }}>
            {summary.hasWallet
              ? `Valor ${summary.totalValue.toLocaleString("es-ES", { maximumFractionDigits: 0 })} € · invertido ${summary.starting.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €`
              : "Crea tu cartera para ver tu rendimiento real"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-widest" style={{ color: "rgba(250,248,245,0.5)" }}>OPERACIONES</p>
          <p className="text-lg font-semibold mt-1 tabular-nums">{summary.hasWallet ? series.length - 1 : 0}</p>
        </div>
      </div>
      {hasSeries ? (
        <svg viewBox="0 0 300 55" className="w-full h-16 mt-4">
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
        </svg>
      ) : (
        <div className="h-16 mt-4 flex items-center justify-center text-[11px]" style={{ color: "rgba(250,248,245,0.4)" }}>
          {summary.hasWallet ? "Aún sin operaciones registradas" : ""}
        </div>
      )}
    </section>
  );
}

function StreakCard({ current, longest, lastReadDate }: { current: number; longest: number; lastReadDate: string | null }) {
  // Build last 7 days view (Mon..Sun of current week).
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const weekday = (today.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(today);
  monday.setDate(today.getDate() - weekday);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const isFuture = iso > todayISO;
    const isToday = iso === todayISO;
    // A day is "read" if it's within the consecutive streak window ending on lastReadDate
    let read = false;
    if (lastReadDate && current > 0) {
      const last = new Date(lastReadDate + "T00:00:00");
      const diffDays = Math.round((last.getTime() - d.getTime()) / 86_400_000);
      read = diffDays >= 0 && diffDays < current;
    }
    const missed = !read && !isFuture && !isToday;
    return { iso, label: ["L", "M", "X", "J", "V", "S", "D"][i], read, missed, isToday, isFuture };
  });

  return (
    <section className="bg-card rounded-3xl p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] tracking-widest" style={{ color: "var(--muted-foreground)" }}>RACHA DE LECTURA</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-6xl font-semibold tabular-nums leading-none" style={{ color: "var(--gold)" }}>{current}</p>
            <p className="text-sm" style={{ color: "var(--navy)" }}>días</p>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--navy)" }}>días consecutivos leyendo</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Récord personal · {longest} días
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {[7, 30, 100].map((m) => {
            const earned = longest >= m;
            return (
              <span
                key={m}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums"
                style={{
                  background: earned ? "var(--gold)" : "transparent",
                  color: earned ? "var(--navy)" : "var(--muted-foreground)",
                  border: earned ? "none" : "1px solid var(--border)",
                  opacity: earned ? 1 : 0.55,
                }}
              >
                <Zap size={9} fill={earned ? "var(--navy)" : "none"} color={earned ? "var(--navy)" : "currentColor"} />
                {m}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-[10px] tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>ESTA SEMANA</p>
        <div className="flex items-center justify-between">
          {days.map((d) => (
            <div key={d.iso} className="flex flex-col items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: d.read ? "var(--gold)" : d.isToday ? "transparent" : d.missed ? "rgba(255,122,138,0.12)" : "var(--muted)",
                  border: d.isToday ? "2px solid var(--gold)" : "none",
                }}
              >
                {d.missed && (
                  <X size={12} color="#FF7A8A" strokeWidth={2.5} />
                )}
              </div>
              <span className="text-[10px] font-medium" style={{ color: d.isToday ? "var(--navy)" : "var(--muted-foreground)" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


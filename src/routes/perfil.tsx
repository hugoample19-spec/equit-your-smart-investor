import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Copy, Camera, LogOut, Search } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { friends } from "@/lib/data";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Equit" },
      { name: "description", content: "Tu perfil, rendimiento, amigos y plan." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { username, fullName, avatar, setAvatar, isPremium, setIsPremium } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`equit.app/@${username}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const filtered = friends.filter((f) => f.handle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col items-center pt-2">
        <button onClick={() => fileRef.current?.click()} className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-card" style={{ background: "var(--navy)" }}>
          {avatar ? (
            <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold" style={{ color: "var(--cream)" }}>{initials}</span>
          )}
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2" style={{ background: "var(--gold)", borderColor: "var(--cream)" }}>
            <Camera size={12} color="var(--navy)" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <h1 className="mt-3 text-xl font-semibold" style={{ color: "var(--navy)" }}>{fullName}</h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>@{username}</p>

        <button onClick={copyLink} className="mt-3 px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
          equit.app/@{username} <Copy size={12} />
          {copied && <span style={{ color: "var(--success)" }}>· copiado</span>}
        </button>
      </div>

      {/* Performance card */}
      <section className="rounded-3xl p-5 shadow-card" style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-widest" style={{ color: "rgba(250,248,245,0.5)" }}>RENDIMIENTO YTD</p>
            <p className="text-4xl font-semibold mt-1" style={{ color: "var(--gold)" }}>+18,4%</p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(250,248,245,0.6)" }}>S&P 500 · +11,2%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-widest" style={{ color: "rgba(250,248,245,0.5)" }}>RANKING</p>
            <p className="text-lg font-semibold mt-1">#142<span style={{ color: "rgba(250,248,245,0.5)" }}> / 8.420</span></p>
          </div>
        </div>
        <MiniChart />
        <div className="grid grid-cols-3 gap-3 mt-3 text-center">
          <DarkStat label="SHARPE" value="1,68" />
          <DarkStat label="VOL" value="14,2%" />
          <DarkStat label="MAX DD" value="-6,1%" />
        </div>
      </section>

      <button className="w-full py-3 rounded-full border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
        Compartir perfil
      </button>

      {/* Friends */}
      <section className="bg-card rounded-2xl p-5 shadow-soft">
        <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Amigos</h3>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9A9AAB" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="# buscar usuario por #handle"
            className="w-full pl-9 pr-3 py-2.5 rounded-full text-sm outline-none border"
            style={{ background: "var(--muted)", borderColor: "transparent", color: "var(--navy)" }}
          />
        </div>
        <ul className="space-y-3">
          {filtered.map((f) => (
            <li key={f.handle} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "var(--muted)", color: "var(--navy)" }}>
                {f.handle.slice(1, 3).toUpperCase()}
              </div>
              <p className="flex-1 text-sm font-medium" style={{ color: "var(--navy)" }}>{f.handle}</p>
              <span className="text-sm font-semibold tabular-nums" style={{ color: f.perf >= 0 ? "var(--success)" : "var(--danger)" }}>
                {f.perf >= 0 ? "+" : ""}{f.perf.toFixed(1)}%
              </span>
            </li>
          ))}
          {!filtered.length && <p className="text-xs text-center py-3" style={{ color: "var(--muted-foreground)" }}>Sin resultados</p>}
        </ul>
      </section>

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

      <button className="w-full py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2" style={{ color: "var(--muted-foreground)" }}>
        <LogOut size={14} /> Cerrar sesión
      </button>
    </div>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] tracking-wider" style={{ color: "rgba(250,248,245,0.5)" }}>{label}</p>
      <p className="text-sm font-semibold mt-1 tabular-nums" style={{ color: "var(--cream)" }}>{value}</p>
    </div>
  );
}

function MiniChart() {
  const pts = [50, 52, 48, 55, 58, 54, 62, 60, 65, 68, 64, 72, 70, 78];
  const min = Math.min(...pts), max = Math.max(...pts);
  const norm = pts.map((v, i) => `${(i / (pts.length - 1)) * 300},${50 - ((v - min) / (max - min)) * 40}`);
  return (
    <svg viewBox="0 0 300 55" className="w-full h-16 mt-4">
      <polyline points={norm.join(" ")} fill="none" stroke="var(--gold)" strokeWidth="2" />
    </svg>
  );
}

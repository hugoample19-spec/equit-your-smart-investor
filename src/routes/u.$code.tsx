import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Star, UserPlus, Lock } from "lucide-react";
import { findUserByCode, investors } from "@/lib/data";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/u/$code")({
  head: ({ params }) => {
    const u = findUserByCode(params.code);
    return {
      meta: [
        { title: `${u?.handle ?? "Usuario"} · Equit` },
        { name: "description", content: u ? `Perfil de ${u.handle} en Equit.` : "Perfil de usuario" },
      ],
    };
  },
  loader: ({ params }) => {
    const user = findUserByCode(params.code);
    if (!user) throw notFound();
    return { user };
  },
  notFoundComponent: () => <p className="pt-10 text-center text-sm">Usuario no encontrado</p>,
  component: PublicProfile,
});

function PublicProfile() {
  const { user } = Route.useLoaderData() as { user: ReturnType<typeof findUserByCode> & object };
  const { friendCodes, addFriend } = useApp();
  const isFriend = friendCodes.includes(user.code);
  const favRef = investors.find((i) => i.id === user.favoriteReferenteId);
  const initials = user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("");
  const isPublic = user.isPublic;

  return (
    <div className="space-y-5 pb-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--navy)" }}>
        <ArrowLeft size={16} /> Atrás
      </Link>

      <div className="flex flex-col items-center pt-2">
        <div className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-card" style={{ background: "var(--navy)" }}>
          <span className="text-2xl font-semibold" style={{ color: "var(--cream)" }}>{initials}</span>
          <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border-2" style={{ background: "var(--cream)", borderColor: "var(--cream)" }}>
            {favRef ? <img src={favRef.photo} alt={favRef.name} className="w-full h-full object-cover" /> : <Star size={14} color="var(--gold)" />}
          </span>
        </div>
        <h1 className="mt-3 text-xl font-semibold" style={{ color: "var(--navy)" }}>{user.name}</h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{user.handle}</p>
        <p className="text-sm font-semibold tabular-nums mt-1" style={{ color: "var(--gold)" }}>#{user.code}</p>
        <p className="text-lg font-semibold tabular-nums mt-2" style={{ color: user.perf >= 0 ? "var(--success)" : "var(--danger)" }}>
          {user.perf >= 0 ? "+" : ""}{user.perf.toFixed(1)}%
        </p>
        <p className="text-[10px] tracking-wider" style={{ color: "var(--muted-foreground)" }}>{user.strategy}</p>
      </div>

      <div className="flex gap-2">
        <Link
          to="/chat/$code"
          params={{ code: user.code }}
          className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--navy)", color: "var(--cream)" }}
        >
          <MessageCircle size={14} /> Mensaje
        </Link>
        {!isFriend && (
          <button
            onClick={() => addFriend(user.code)}
            className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border"
            style={{ borderColor: "var(--navy)", color: "var(--navy)" }}
          >
            <UserPlus size={14} /> Añadir
          </button>
        )}
      </div>

      {isPublic ? (
        <>
          <section className="bg-card rounded-2xl p-5 shadow-soft">
            <p className="text-[10px] tracking-widest" style={{ color: "var(--muted-foreground)" }}>VALOR TOTAL</p>
            <p className="text-3xl font-semibold mt-1 tabular-nums" style={{ color: "var(--navy)" }}>
              €{user.totalValue.toLocaleString("es-ES")}
            </p>
            <p className="text-sm font-semibold mt-1 tabular-nums" style={{ color: user.perf >= 0 ? "var(--success)" : "var(--danger)" }}>
              {user.perf >= 0 ? "+" : ""}€{((user.totalValue * user.perf) / 100).toFixed(0)} · {user.perf >= 0 ? "+" : ""}{user.perf.toFixed(1)}%
            </p>
          </section>

          <section className="bg-card rounded-2xl p-5 shadow-soft">
            <h3 className="font-semibold mb-4" style={{ color: "var(--navy)" }}>Distribución</h3>
            <div className="flex items-center gap-4">
              <Donut data={user.distribution} />
              <ul className="flex-1 space-y-1.5">
                {user.distribution.map((d, idx) => (
                  <li key={d.ticker} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: donutColor(idx) }} />
                    <span className="flex-1" style={{ color: "var(--navy)" }}>{d.ticker}</span>
                    <span className="tabular-nums font-semibold" style={{ color: "var(--navy)" }}>{d.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {favRef && (
            <section className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-3">
              <img src={favRef.photo} alt={favRef.name} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-widest" style={{ color: "var(--gold)" }}>REFERENTE FAVORITO</p>
                <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{favRef.name}</p>
                <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{favRef.fund}</p>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="bg-card rounded-2xl p-6 shadow-soft text-center">
          <Lock size={20} className="mx-auto" color="var(--muted-foreground)" />
          <p className="text-sm font-semibold mt-2" style={{ color: "var(--navy)" }}>Cartera privada</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Este usuario ha decidido no mostrar su distribución de cartera.
          </p>
        </section>
      )}
    </div>
  );
}

function donutColor(i: number) {
  const colors = ["#1A1A2E", "#C9A84C", "#16A572", "#6B6B7D", "#D9534F", "#5BD2A5", "#76B900"];
  return colors[i % colors.length];
}

function Donut({ data }: { data: { ticker: string; pct: number }[] }) {
  const size = 96, r = 38, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
      {data.map((d, i) => {
        const len = (d.pct / 100) * c;
        const dash = `${len} ${c - len}`;
        const offset = -acc;
        acc += len;
        return (
          <circle
            key={d.ticker}
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={donutColor(i)}
            strokeWidth="14"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        );
      })}
    </svg>
  );
}

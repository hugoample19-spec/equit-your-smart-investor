import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Trophy, Newspaper, BarChart3 } from "lucide-react";
import { getNotifications, markAllNotificationsRead } from "@/lib/notifications.functions";
import { useAuth } from "@/lib/app-context";

export const Route = createFileRoute("/notificaciones")({
  head: () => ({ meta: [{ title: "Equit · Notificaciones" }] }),
  component: NotificacionesPage,
});

type Notif = {
  id: string;
  category: "friend_overtake" | "news_reminder" | "daily_summary";
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

const icons = {
  friend_overtake: Trophy,
  news_reminder: Newspaper,
  daily_summary: BarChart3,
};

function NotificacionesPage() {
  const { isAuthenticated } = useAuth();
  const getFn = useServerFn(getNotifications);
  const markAll = useServerFn(markAllNotificationsRead);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    getFn().then((d) => { setItems(d as Notif[]); setLoading(false); }).catch(() => setLoading(false));
  }, [isAuthenticated, getFn]);

  const onClearAll = async () => {
    await markAll();
    setItems((p) => p.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-20 text-center">
        <Bell size={32} className="mx-auto opacity-40" />
        <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>Inicia sesión para ver tus notificaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--navy)", letterSpacing: "-0.02em" }}>Notificaciones</h1>
        {items.some((n) => !n.read_at) && (
          <button onClick={onClearAll} className="text-xs underline" style={{ color: "var(--muted-foreground)" }}>
            Marcar todas leídas
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando…</p>
      ) : items.length === 0 ? (
        <div className="pt-16 text-center">
          <Bell size={32} className="mx-auto opacity-40" />
          <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>Sin notificaciones todavía.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const Icon = icons[n.category] ?? Bell;
            const unread = !n.read_at;
            return (
              <li key={n.id} className="rounded-2xl p-4 border bg-white flex gap-3" style={{ borderColor: "var(--border)" }}>
                <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: unread ? "var(--gold)" : "rgba(0,0,0,0.04)", color: unread ? "var(--navy)" : "var(--muted-foreground)" }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{n.body}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                    {new Date(n.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {unread && <div className="h-2 w-2 rounded-full mt-2" style={{ background: "var(--gold)" }} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

// Cron route triggered by pg_cron hourly. Authenticates via Supabase apikey header.
// Generates notifications for all users following priority rules:
//  P1 friend_overtake, P2 news_reminder, P3 daily_summary
// Max 2 notifications per user per Madrid-local day.

export const Route = createFileRoute("/api/public/cron/notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Anon-key auth
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Madrid hour
        const madridNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
        const hour = madridNow.getHours();
        const today = madridNow.toISOString().slice(0, 10);

        // Get all users with preferences
        const { data: users } = await supabaseAdmin
          .from("notification_prefs")
          .select("user_id, friend_alerts, news_reminder, daily_summary");
        if (!users) return Response.json({ ok: true, sent: 0 });

        let sent = 0;

        for (const u of users) {
          // Daily cap: count notifications already created today
          const { count } = await supabaseAdmin
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.user_id)
            .gte("created_at", `${today}T00:00:00Z`);
          if ((count ?? 0) >= 2) continue;

          const queue: { priority: number; category: string; title: string; body: string }[] = [];

          // P2 news reminder (19:00+, no read today)
          if (u.news_reminder && hour >= 19) {
            const { data: read } = await supabaseAdmin
              .from("news_reads")
              .select("user_id")
              .eq("user_id", u.user_id)
              .eq("read_date", today)
              .maybeSingle();
            if (!read) {
              // Already alerted today?
              const { count: already } = await supabaseAdmin
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", u.user_id)
                .eq("category", "news_reminder")
                .gte("created_at", `${today}T00:00:00Z`);
              if ((already ?? 0) === 0) {
                queue.push({
                  priority: 2,
                  category: "news_reminder",
                  title: "Mantén tu racha",
                  body: "Lee una noticia hoy para mantener tu racha informativa.",
                });
              }
            }
          }

          // P3 daily summary (21:00+)
          if (u.daily_summary && hour >= 21) {
            const { count: already } = await supabaseAdmin
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", u.user_id)
              .eq("category", "daily_summary")
              .gte("created_at", `${today}T00:00:00Z`);
            if ((already ?? 0) === 0) {
              // Look at today's snapshot
              const { data: snap } = await supabaseAdmin
                .from("leaderboard_snapshots")
                .select("rank, return_pct")
                .eq("user_id", u.user_id)
                .eq("snapshot_date", today)
                .maybeSingle();
              if (snap) {
                const ret = Number(snap.return_pct);
                queue.push({
                  priority: 3,
                  category: "daily_summary",
                  title: "Resumen del día",
                  body: `Has cerrado el día en el puesto #${snap.rank} con un ${ret >= 0 ? "+" : ""}${ret.toFixed(2)}% 📈`,
                });
              }
            }
          }

          // Sort by priority asc and take up to remaining slots
          queue.sort((a, b) => a.priority - b.priority);
          const remaining = 2 - (count ?? 0);
          const toInsert = queue.slice(0, remaining).map((q) => ({
            user_id: u.user_id,
            ...q,
          }));
          if (toInsert.length) {
            await supabaseAdmin.from("notifications").insert(toInsert);
            sent += toInsert.length;
          }
        }

        return Response.json({ ok: true, sent });
      },
    },
  },
});

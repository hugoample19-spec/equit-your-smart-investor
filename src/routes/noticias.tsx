import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Zap } from "lucide-react";
import { getMarketNews, type NewsItem } from "@/lib/news.functions";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias · Equit" },
      { name: "description", content: "Mercados, cripto, tech y macro en tiempo real." },
    ],
  }),
  component: NoticiasPage,
});

function isLikelyEnglish(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(lower)) return false;
  if (/\b(el|la|los|las|de|que|para|con|por|una|del|más|también|según|hoy|ayer|mañana)\b/.test(lower)) return false;
  return /\b(the|and|of|to|in|for|on|with|is|are|was|were|will|from|by|at|as|this|that|after|before)\b/.test(lower);
}

// Translate the full text by chunking on sentence boundaries (mymemory caps ~500 chars/call).
async function translateChunk(chunk: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`;
    const res = await fetch(url);
    if (!res.ok) return chunk;
    const json = await res.json();
    const translated = json?.responseData?.translatedText as string | undefined;
    if (!translated || /MYMEMORY WARNING/i.test(translated)) return chunk;
    return translated;
  } catch {
    return chunk;
  }
}

async function translateToSpanish(text: string): Promise<string> {
  if (!text) return text;
  if (!isLikelyEnglish(text)) return text;
  const MAX = 460;
  if (text.length <= MAX) return translateChunk(text);
  // Split into sentence-ish chunks under MAX chars.
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length > MAX) {
      if (cur) chunks.push(cur.trim());
      cur = s;
    } else {
      cur = cur ? cur + " " + s : s;
    }
  }
  if (cur) chunks.push(cur.trim());
  const out = await Promise.all(chunks.map(translateChunk));
  return out.join(" ");
}

type DisplayNews = NewsItem & { displayTitle: string; displaySummary: string };

function NoticiasPage() {
  const { streak, markNewsRead } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["market-news"],
    queryFn: () => getMarketNews(),
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.items ?? [];
  const translations = useQueries({
    queries: items.map((n, idx) => ({
      queryKey: ["news-translate", idx, n.title],
      queryFn: async () => ({
        title: await translateToSpanish(n.title),
        summary: n.summary ? await translateToSpanish(n.summary) : "",
      }),
      staleTime: 24 * 60 * 60 * 1000,
    })),
  });

  const today = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", "").toUpperCase();
  const todayISO = new Date().toISOString().slice(0, 10);
  const readToday = streak.lastReadDate === todayISO;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (readToday) return;
    if (Notification.permission === "default") Notification.requestPermission().catch(() => {});
    if (Notification.permission !== "granted") return;
    const now = new Date();
    const target = new Date(); target.setHours(19, 0, 0, 0);
    if (target.getTime() <= now.getTime()) return;
    const ms = target.getTime() - now.getTime();
    const t = setTimeout(() => {
      const nowISO = new Date().toISOString().slice(0, 10);
      if (streak.lastReadDate === nowISO) return;
      try {
        new Notification("Equit", {
          body: `Llevas ${streak.current} días seguidos informándote. Lee una noticia para mantener tu racha.`,
        });
      } catch { /* noop */ }
    }, ms);
    return () => clearTimeout(t);
  }, [readToday, streak.current, streak.lastReadDate]);

  const opened: DisplayNews | null = openIdx != null && items[openIdx]
    ? {
        ...items[openIdx],
        displayTitle: translations[openIdx]?.data?.title ?? items[openIdx].title,
        displaySummary: translations[openIdx]?.data?.summary ?? items[openIdx].summary,
      }
    : null;

  const openArticle = (idx: number) => {
    setOpenIdx(idx);
    markNewsRead();
  };

  if (opened) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setOpenIdx(null)}
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: "var(--navy)" }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <article className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>{opened.cat}</span>
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{opened.time}</span>
          </div>
          <h1 className="text-xl font-semibold mt-3 leading-tight" style={{ color: "var(--navy)" }}>
            {opened.displayTitle}
          </h1>
          {opened.displaySummary && (
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--navy)" }}>
              {opened.displaySummary}
            </p>
          )}
          {opened.source && (
            <p className="text-[10px] tracking-wider mt-4 font-medium" style={{ color: "var(--muted-foreground)" }}>
              FUENTE · {opened.source.toUpperCase()}
            </p>
          )}
          {(() => {
            const raw = opened.url;
            console.log("[noticias] raw article url:", raw);
            const trimmed = (raw ?? "").trim();
            const href = trimmed
              ? (trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
              : "";
            if (!href) {
              return (
                <p className="mt-5 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                  Artículo no disponible externamente
                </p>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "var(--navy)", color: "var(--cream)" }}
              >
                Leer artículo completo <ExternalLink size={14} />
              </a>
            );
          })()}
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>Noticias</h1>
          <p className="text-[11px] tracking-widest font-semibold mt-2" style={{ color: "var(--muted-foreground)" }}>HOY · {today}</p>
        </div>
        <StreakBadge current={streak.current} readToday={readToday} />
      </div>

      {isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </ul>
      ) : (
        <ul className="space-y-3">
          {items.map((n, idx) => {
            const t = translations[idx]?.data;
            const title = t?.title ?? n.title;
            const summary = t?.summary ?? n.summary;
            return (
              <li key={idx} className="bg-card rounded-2xl p-4 shadow-soft">
                <button
                  type="button"
                  onClick={() => openArticle(idx)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>{n.cat}</span>
                    <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n.time}</span>
                  </div>
                  <h2 className="text-base font-semibold mt-2 leading-snug" style={{ color: "var(--navy)" }}>{title}</h2>
                  {summary && (
                    <p className="text-sm mt-1.5 leading-relaxed line-clamp-3" style={{ color: "var(--muted-foreground)" }}>{summary}</p>
                  )}
                  {n.source && (
                    <p className="text-[10px] tracking-wider mt-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
                      {n.source.toUpperCase()}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StreakBadge({ current, readToday }: { current: number; readToday: boolean }) {
  const bg = readToday ? "var(--gold)" : "var(--muted)";
  const fg = readToday ? "var(--navy)" : "var(--navy)";
  const boltColor = readToday ? "var(--navy)" : "var(--muted-foreground)";
  const boltFill = readToday ? "var(--navy)" : "none";
  return (
    <div
      className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full"
      style={{ background: bg, color: fg, border: readToday ? "none" : "1px solid var(--border)" }}
      title={readToday ? "Hoy leído" : "Hoy pendiente"}
    >
      <div className="relative">
        <Zap size={18} fill={boltFill} color={boltColor} strokeWidth={2} />
        {readToday && (
          <span
            className="absolute -bottom-0.5 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: "var(--navy)" }}
          >
            <Check size={9} color="var(--gold)" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] tracking-wider font-semibold uppercase" style={{ opacity: 0.7 }}>
          Racha
        </span>
        <span className="text-sm font-bold tabular-nums">
          {current} · {readToday ? "Hoy leído" : "Hoy pendiente"}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <li className="bg-card rounded-2xl p-4 shadow-soft animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <span className="h-3 w-16 rounded" style={{ background: "var(--muted)" }} />
        <span className="h-3 w-12 rounded" style={{ background: "var(--muted)" }} />
      </div>
      <div className="h-4 mt-3 rounded w-[90%]" style={{ background: "var(--muted)" }} />
      <div className="h-4 mt-2 rounded w-[60%]" style={{ background: "var(--muted)" }} />
      <div className="h-3 mt-3 rounded w-full" style={{ background: "var(--muted)" }} />
      <div className="h-3 mt-1.5 rounded w-[80%]" style={{ background: "var(--muted)" }} />
    </li>
  );
}

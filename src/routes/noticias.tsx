import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Zap, Lightbulb, Sparkles, X, Lock } from "lucide-react";
import { getMarketNews, type NewsItem } from "@/lib/news.functions";
import { getNewsInsight } from "@/lib/news-insight.functions";
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
  const { streak, markNewsRead, isPremium, setIsPremium, refreshProfile } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(false);
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

  // Mark the streak as soon as the user lands on the Noticias tab — no need
  // to open an individual article.
  useEffect(() => {
    if (!readToday) markNewsRead();
  }, [readToday, markNewsRead]);

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
    setInsight(null);
    setInsightError(null);
    markNewsRead();
  };

  const handleInsight = async () => {
    if (!opened) return;
    if (!isPremium) { setShowPremium(true); return; }
    if (insight || insightLoading) return;
    setInsightLoading(true);
    setInsightError(null);
    try {
      let res = await getNewsInsight({ data: { headline: opened.displayTitle, summary: opened.displaySummary } });
      // If the server says premium_required but local thinks user is premium,
      // the DB write may have raced — refresh the profile and retry once.
      if (!res.ok && res.reason === "premium_required") {
        await refreshProfile();
        res = await getNewsInsight({ data: { headline: opened.displayTitle, summary: opened.displaySummary } });
      }
      if (res.ok) {
        setInsight(res.insight);
      } else if (res.reason === "premium_required") {
        setShowPremium(true);
      } else {
        setInsightError("No se pudo generar el análisis. Inténtalo de nuevo en un momento.");
      }
    } catch (e) {
      setInsightError("No se pudo generar el análisis. Inténtalo de nuevo en un momento.");
      console.error(e);
    } finally {
      setInsightLoading(false);
    }
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
          {opened.source && (
            <p className="text-[10px] tracking-wider mt-4 font-medium" style={{ color: "var(--muted-foreground)" }}>
              FUENTE · {opened.source.toUpperCase()}
            </p>
          )}
        </article>

        {!insight && !insightLoading && (
          <button
            type="button"
            onClick={handleInsight}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-soft"
            style={{ background: "var(--navy)", color: "var(--gold)" }}
          >
            {!isPremium && <Lock size={14} />}
            <Sparkles size={16} />
            ¿Por qué importa esta noticia y cómo afecta a mi cartera?
          </button>
        )}

        {insightLoading && (
          <div className="rounded-2xl p-5 shadow-soft animate-pulse" style={{ background: "color-mix(in srgb, var(--gold) 14%, var(--card))" }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} style={{ color: "var(--gold)" }} />
              <span className="text-[11px] tracking-widest font-bold" style={{ color: "var(--navy)" }}>ANALIZANDO…</span>
            </div>
            <div className="h-3 rounded w-full mb-2" style={{ background: "var(--muted)" }} />
            <div className="h-3 rounded w-[92%] mb-2" style={{ background: "var(--muted)" }} />
            <div className="h-3 rounded w-[70%]" style={{ background: "var(--muted)" }} />
          </div>
        )}

        {insight && (
          <div className="rounded-2xl p-5 shadow-soft" style={{ background: "color-mix(in srgb, var(--gold) 18%, var(--card))", border: "1px solid color-mix(in srgb, var(--gold) 40%, transparent)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} style={{ color: "var(--gold)" }} fill="var(--gold)" />
              <span className="text-[11px] tracking-widest font-bold" style={{ color: "var(--navy)" }}>POR QUÉ IMPORTA</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--navy)" }}>{insight}</p>
          </div>
        )}

        {insightError && (
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>{insightError}</p>
        )}

        {showPremium && (
          <PremiumModal
            onClose={() => setShowPremium(false)}
            onSubscribe={() => { setIsPremium(true); setShowPremium(false); }}
          />
        )}
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
            return (
              <li key={idx} className="bg-card rounded-2xl p-4 shadow-soft">
                <button
                  type="button"
                  onClick={() => openArticle(idx)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>{n.cat}</span>
                    <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n.time}</span>
                  </div>
                  <h2 className="text-base font-semibold mt-2 leading-snug" style={{ color: "var(--navy)" }}>{title}</h2>
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

function PremiumModal({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  const benefits = [
    "Todos los referentes desbloqueados (Buffett, Dalio, Ackman, Cathie Wood…)",
    "Inversión en criptomonedas",
    "Análisis IA de noticias: entiende cómo afectan a tu cartera",
    "Insignia Premium en tu perfil",
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(10,18,40,0.55)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-soft relative"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4" aria-label="Cerrar">
          <X size={18} style={{ color: "var(--muted-foreground)" }} />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "var(--gold)" }} />
          <span className="text-[11px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>EQUIT PREMIUM</span>
        </div>
        <h2 className="text-2xl font-semibold mt-2 leading-tight" style={{ color: "var(--navy)" }}>
          Desbloquea el análisis IA y mucho más
        </h2>
        <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
          Lleva tu aprendizaje al siguiente nivel con herramientas premium para inversores.
        </p>
        <ul className="mt-4 space-y-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm" style={{ color: "var(--navy)" }}>
              <Check size={16} style={{ color: "var(--gold)" }} className="mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: "var(--navy)" }}>€3,99</span>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>/mes</span>
        </div>
        <button
          onClick={onSubscribe}
          className="mt-4 w-full rounded-2xl py-3.5 text-sm font-semibold shadow-soft"
          style={{ background: "var(--gold)", color: "var(--navy)" }}
        >
          Suscribirme
        </button>
        <p className="text-[10px] text-center mt-3" style={{ color: "var(--muted-foreground)" }}>
          Cancela cuando quieras desde tu perfil.
        </p>
      </div>
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

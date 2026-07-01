import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Zap, Lightbulb, Sparkles, Lock, Bell, HelpCircle, X as XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getMarketNews, type NewsItem } from "@/lib/news.functions";
import { getNewsInsight } from "@/lib/news-insight.functions";
import { getDailyQuestion, answerDailyQuestion } from "@/lib/daily-question.functions";
import { useApp, madridDateISO } from "@/lib/app-context";
import { PremiumModal } from "@/components/PremiumModal";
import { supabase } from "@/integrations/supabase/client";

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

// SHA-256 hex hash for cache key (browser-native via Web Crypto).
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Try MyMemory first, then fall back to Google Translate's unofficial endpoint.
async function translateViaMyMemory(chunk: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[translate] MyMemory HTTP error:", res.status);
      return null;
    }
    const json = await res.json();
    const translated = json?.responseData?.translatedText as string | undefined;
    if (!translated || /MYMEMORY WARNING/i.test(translated)) {
      console.warn("[translate] MyMemory fallback triggered (likely quota):", translated?.slice(0, 120));
      return null;
    }
    return translated;
  } catch (e) {
    console.warn("[translate] MyMemory threw:", e);
    return null;
  }
}

async function translateViaGoogle(chunk: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[translate] Google fallback HTTP error:", res.status);
      return null;
    }
    const data = await res.json();
    // Response shape: [[["translated", "original", ...], ...], ...]
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const joined = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? (seg[0] as string) : ""))
      .join("");
    if (!joined) return null;
    console.log("[translate] Google fallback OK");
    return joined;
  } catch (e) {
    console.warn("[translate] Google fallback threw:", e);
    return null;
  }
}

// Translate the full text by chunking on sentence boundaries (mymemory caps ~500 chars/call).
async function translateChunk(chunk: string): Promise<string> {
  // 1. Check shared Supabase cache first.
  let hash: string | null = null;
  try {
    hash = await sha256Hex(chunk);
    const { data: cached, error } = await supabase
      .from("news_translations")
      .select("translated_text")
      .eq("content_hash", hash)
      .eq("lang", "es")
      .maybeSingle();
    if (error) console.warn("[translate] cache read error:", error);
    if (cached?.translated_text) return cached.translated_text;
  } catch (e) {
    console.warn("[translate] cache lookup threw:", e);
  }

  // 2. MyMemory → Google fallback.
  let translated = await translateViaMyMemory(chunk);
  if (!translated) translated = await translateViaGoogle(chunk);
  if (!translated) return chunk; // last resort: original English

  // 3. Write-through to shared cache (best-effort, ignore RLS-anon failures).
  if (hash) {
    try {
      const { error } = await supabase
        .from("news_translations")
        .insert({ content_hash: hash, lang: "es", translated_text: translated });
      if (error && error.code !== "23505") {
        console.warn("[translate] cache write error:", error);
      }
    } catch (e) {
      console.warn("[translate] cache write threw:", e);
    }
  }
  return translated;
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


const KNOWN_SOURCES: Array<{ match: RegExp; label: string }> = [
  { match: /reuters\./i, label: "Reuters" },
  { match: /cnbc\./i, label: "CNBC" },
  { match: /bloomberg\./i, label: "Bloomberg" },
  { match: /ft\.com/i, label: "FT" },
  { match: /wsj\.com/i, label: "WSJ" },
  { match: /nytimes\./i, label: "NY Times" },
  { match: /marketwatch\./i, label: "MarketWatch" },
  { match: /seekingalpha\./i, label: "Seeking Alpha" },
];

function displaySource(item: NewsItem): string {
  const raw = (item.source || "").trim();
  const isGeneric = !raw || /^finnhub$/i.test(raw);
  if (!isGeneric) return raw;
  try {
    const host = new URL(item.url).hostname.toLowerCase().replace(/^www\./, "");
    for (const { match, label } of KNOWN_SOURCES) {
      if (match.test(host)) return label;
    }
    return host || raw;
  } catch {
    return raw;
  }
}

type DisplayNews = NewsItem & { displayTitle: string; displaySummary: string };

function NoticiasPage() {
  const { streak, streakReady, markNewsRead, isPremium, refreshProfile } = useApp();
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

  const today = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", timeZone: "Europe/Madrid" }).replace(".", "").toUpperCase();
  const todayISO = madridDateISO();
  const readToday = streak.lastReadDate === todayISO;

  // Mark the streak as soon as the user lands on the Noticias tab — only
  // after the authoritative Supabase rebuild has run, to avoid spurious writes.
  useEffect(() => {
    if (!streakReady) return;
    if (!readToday) markNewsRead();
  }, [streakReady, readToday, markNewsRead]);

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
      const nowISO = madridDateISO();
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
          {(() => {
            const src = displaySource(opened);
            return src ? (
              <p className="text-[10px] tracking-wider mt-4 font-medium" style={{ color: "var(--muted-foreground)" }}>
                FUENTE · {src.toUpperCase()}
              </p>
            ) : null;
          })()}
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
            <div className="text-sm leading-relaxed markdown-navy" style={{ color: "var(--navy)" }}>
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          </div>
        )}

        {insightError && (
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>{insightError}</p>
        )}

        {showPremium && (
          <PremiumModal
            onClose={() => setShowPremium(false)}
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
        <div className="flex items-center gap-2">
          <DailyQuestionButton />
          <StreakBadge current={streak.current} readToday={readToday} ready={streakReady} />
        </div>
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
                  {(() => {
                    const src = displaySource(n);
                    return src ? (
                      <p className="text-[10px] tracking-wider mt-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
                        {src.toUpperCase()}
                      </p>
                    ) : null;
                  })()}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      </div>
  );
}


function StreakBadge({ current, readToday, ready }: { current: number; readToday: boolean; ready: boolean }) {
  const bg = readToday ? "var(--gold)" : "var(--muted)";
  const fg = readToday ? "var(--navy)" : "var(--navy)";
  const boltColor = readToday ? "var(--navy)" : "var(--muted-foreground)";
  const boltFill = readToday ? "var(--navy)" : "none";
  return (
    <div
      className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full"
      style={{ background: bg, color: fg, border: readToday ? "none" : "1px solid var(--border)" }}
      title={readToday ? "Hoy leído" : "Hoy pendiente"}
    >
      <div className="relative">
        <Zap size={15} fill={boltFill} color={boltColor} strokeWidth={2} />
        {readToday && (
          <span
            className="absolute -bottom-0.5 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: "var(--navy)" }}
          >
            <Check size={8} color="var(--gold)" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[8px] tracking-wider font-semibold uppercase" style={{ opacity: 0.7 }}>
          Racha
        </span>
        {ready ? (
          <span className="text-[13px] font-bold tabular-nums">
            {current} · {readToday ? "Hoy leído" : "Hoy pendiente"}
          </span>
        ) : (
          <span className="h-3 w-20 rounded animate-pulse mt-0.5" style={{ background: "rgba(0,0,0,0.08)" }} />
        )}
      </div>
    </div>
  );
}

function DailyQuestionButton() {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correctIndex: number; wasCorrect: boolean; explanation: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getFn = useServerFn(getDailyQuestion);
  const answerFn = useServerFn(answerDailyQuestion);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["daily-question", madridDateISO()],
    queryFn: () => getFn(),
    staleTime: 60 * 60 * 1000,
  });

  const data = query.data;
  const alreadyAnswered = data?.ok && data.alreadyAnswered;

  useEffect(() => {
    if (data?.ok && data.alreadyAnswered && data.correctIndex != null && data.explanation) {
      setResult({
        correctIndex: data.correctIndex,
        wasCorrect: !!data.wasCorrect,
        explanation: data.explanation,
      });
    }
  }, [data]);

  const handleAnswer = async (idx: number) => {
    if (selected != null || submitting) return;
    setSelected(idx);
    setSubmitting(true);
    try {
      const res = await answerFn({ data: { selectedIndex: idx } });
      setResult({
        correctIndex: res.correctIndex,
        wasCorrect: "isCorrect" in res ? res.isCorrect : res.wasCorrect,
        explanation: res.explanation,
      });
      qc.invalidateQueries({ queryKey: ["daily-question"] });
    } catch (e) {
      console.error("[daily-question] answer failed", e);
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-transform active:scale-95 ${!alreadyAnswered ? "animate-bounce" : ""}`}
        style={{
          background: "color-mix(in srgb, var(--gold) 18%, var(--card))",
          borderColor: "color-mix(in srgb, var(--gold) 50%, transparent)",
          color: "var(--gold)",
        }}
        aria-label="Pregunta diaria"
      >
        <Bell size={16} fill={!alreadyAnswered ? "var(--gold)" : "none"} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-5 pb-8 shadow-lg animate-in slide-in-from-bottom duration-300"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>
                  PREGUNTA DIARIA
                </span>
              </div>
              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  onClick={() => setShowHelp((s) => !s)}
                  aria-label="Ayuda"
                >
                  <HelpCircle size={16} style={{ color: "var(--muted-foreground)" }} />
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
                  <XIcon size={18} style={{ color: "var(--muted-foreground)" }} />
                </button>
                {showHelp && (
                  <div
                    className="absolute right-6 top-6 w-56 p-3 rounded-xl text-[11px] shadow-lg z-10"
                    style={{ background: "var(--navy)", color: "var(--cream)" }}
                  >
                    Responde correctamente para ganar 3 puntos. Una pregunta por día.
                  </div>
                )}
              </div>
            </div>

            {query.isLoading || !data ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-5 w-3/4 rounded" style={{ background: "var(--muted)" }} />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl" style={{ background: "var(--muted)" }} />
                ))}
              </div>
            ) : !data.ok ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>
                No se pudo cargar la pregunta de hoy. Vuelve a intentarlo en un momento.
              </p>
            ) : (
              <>
                <p className="text-base font-semibold mb-4" style={{ color: "var(--navy)" }}>
                  {data.question.question}
                </p>
                <div className="space-y-2">
                  {data.question.options.map((opt, idx) => {
                    const answered = selected != null || alreadyAnswered;
                    const isCorrectAnswer = result && idx === result.correctIndex;
                    const isSelected = selected === idx;
                    let bg = "var(--card)";
                    let border = "var(--border)";
                    let color = "var(--navy)";
                    if (answered && result) {
                      if (isCorrectAnswer) {
                        bg = "color-mix(in srgb, var(--success) 18%, var(--card))";
                        border = "var(--success)";
                        color = "var(--success)";
                      } else if (isSelected && !result.wasCorrect) {
                        bg = "color-mix(in srgb, var(--danger) 15%, var(--card))";
                        border = "var(--danger)";
                        color = "var(--danger)";
                      }
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={answered}
                        onClick={() => handleAnswer(idx)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left text-sm font-medium disabled:cursor-default"
                        style={{ background: bg, borderColor: border, color }}
                      >
                        <span>{opt}</span>
                        {answered && result && isCorrectAnswer && <Check size={16} />}
                        {answered && result && isSelected && !result.wasCorrect && <XIcon size={16} />}
                      </button>
                    );
                  })}
                </div>
                {result && (
                  <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {result.explanation}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
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

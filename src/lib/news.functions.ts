import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";

export type NewsItem = {
  cat: string;
  time: string;
  title: string;
  summary: string;
  source: string;
  url: string;
};

type Raw = {
  category?: string;
  datetime: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  related?: string;
};

const fallback: NewsItem[] = [
  { cat: "MERCADOS", time: "hace 24 min", source: "Equit", url: "#", title: "El IBEX 35 supera los 12.400 puntos y marca máximos del año", summary: "La banca lidera las subidas mientras Inditex aporta un nuevo récord en sesión europea." },
  { cat: "CRIPTO", time: "hace 1 h", source: "Equit", url: "#", title: "Bitcoin rompe los $74.000 con flujos récord en ETFs spot", summary: "BlackRock IBIT acumula más de $2.400M en una semana mientras la oferta en exchanges cae." },
  { cat: "EMPRESAS", time: "hace 2 h", source: "Equit", url: "#", title: "Nvidia presenta su nueva familia Blackwell B300 para inferencia", summary: "Las acciones suben un 4,2% en pre-market tras superar las expectativas del mercado." },
  { cat: "MACRO", time: "hace 3 h", source: "Equit", url: "#", title: "El BCE mantiene tipos y abre la puerta a un recorte en septiembre", summary: "Lagarde subraya la moderación de la inflación subyacente en la eurozona durante el último trimestre." },
];

function relTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts * 1000);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function normTitle(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s: string): Set<string> {
  return new Set(normTitle(s).split(" ").filter((w) => w.length > 2));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

const EN_STOPWORDS = ["the", "and", "of", "in", "to", "for", "on", "with", "is", "are", "was", "were", "will", "from", "by", "at", "as", "this", "that"];

function isLikelyEnglish(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(lower)) return false;
  if (/\b(el|la|los|las|de|que|para|con|por|una|del|más|también|según|hoy|ayer|mañana)\b/.test(lower)) return false;
  return /\b(the|and|of|to|in|for|on|with|is|are|was|were|will|from|by|at|as|this|that|after|before)\b/.test(lower);
}

// Stronger check used to validate cached translations: if >40% of words are English stopwords,
// treat the cache entry as a failed/untranslated string and force re-translation.
function cachedLooksEnglish(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(lower)) return false;
  const words = lower.replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length < 4) return isLikelyEnglish(text);
  const stopCount = words.filter((w) => EN_STOPWORDS.includes(w)).length;
  const ratio = stopCount / words.length;
  return ratio > 0.4 || isLikelyEnglish(text);
}

async function translateViaGemini(chunk: string): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    console.warn("[translate] missing LOVABLE_API_KEY");
    return null;
  }
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres un traductor profesional especializado en noticias financieras. Traduce el siguiente texto del inglés al español de forma natural y precisa, manteniendo el tono periodístico. Responde ÚNICAMENTE con la traducción, sin comentarios ni explicaciones.",
          },
          { role: "user", content: chunk },
        ],
      }),
    });
    if (!res.ok) {
      console.warn("[translate] Gemini HTTP error:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const translated = json.choices?.[0]?.message?.content?.trim();
    if (!translated) {
      console.warn("[translate] Gemini empty response");
      return null;
    }
    return translated;
  } catch (e) {
    console.warn("[translate] Gemini threw:", e);
    return null;
  }
}

async function translateChunk(text: string, targetLang: "es" = "es"): Promise<string> {
  if (!text) return text;
  if (!isLikelyEnglish(text)) return text;

  const MAX = 460;
  const chunks: string[] = [];
  if (text.length <= MAX) {
    chunks.push(text);
  } else {
    const sentences = text.split(/(?<=[.!?])\s+/);
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
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const out: string[] = [];
  for (const chunk of chunks) {
    const hash = sha256Hex(chunk);
    let cachedText: string | null = null;
    try {
      const { data: cached } = await supabaseAdmin
        .from("news_translations")
        .select("translated_text")
        .eq("content_hash", hash)
        .eq("lang", targetLang)
        .maybeSingle();
      if (cached?.translated_text) cachedText = cached.translated_text;
    } catch (e) {
      console.warn("[translate-fail] cache read threw:", e);
    }

    if (cachedText && !cachedLooksEnglish(cachedText)) {
      out.push(cachedText);
      continue;
    }
    if (cachedText) {
      console.warn("[translate-fail] cached value looks English, re-translating:", cachedText.slice(0, 80));
    }

    const translated = await translateViaGemini(chunk);
    if (!translated) {
      console.warn("[translate] Gemini failed; returning original:", chunk.slice(0, 80));
      out.push(chunk);
      continue;
    }

    try {
      const { error } = await supabaseAdmin
        .from("news_translations")
        .upsert(
          { content_hash: hash, lang: targetLang, translated_text: translated },
          { onConflict: "content_hash,lang" },
        );
      if (error) console.warn("[translate-fail] cache write error:", error.message);
    } catch (e) {
      console.warn("[translate-fail] cache write threw:", e);
    }
    out.push(translated);
  }
  return out.join(" ");
}

const COMPANY_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA", "META"];

function toItem(n: Raw, forcedCat?: string): NewsItem {
  const rawCat = (n.category || "").toLowerCase();
  let cat = forcedCat ?? "MERCADOS";
  if (!forcedCat) {
    if (rawCat.includes("crypto")) cat = "CRIPTO";
    else if (rawCat.includes("company") || rawCat.includes("ipo") || rawCat.includes("earnings")) cat = "EMPRESAS";
    else if (rawCat.includes("forex") || rawCat.includes("economy")) cat = "MACRO";
  }
  return {
    cat,
    time: relTime(n.datetime),
    title: n.headline,
    summary: n.summary || "",
    source: n.source || "",
    url: n.url || "#",
  };
}

function isYahoo(item: NewsItem): boolean {
  const s = (item.source || "").toLowerCase();
  if (s.includes("yahoo")) return true;
  try {
    const host = new URL(item.url).hostname.toLowerCase();
    if (host.includes("yahoo")) return true;
  } catch { /* noop */ }
  return false;
}

async function translateItems(items: NewsItem[]): Promise<NewsItem[]> {
  const result: NewsItem[] = [];
  for (const it of items) {
    const [title, summary] = await Promise.all([
      translateChunk(it.title),
      it.summary ? translateChunk(it.summary) : Promise.resolve(""),
    ]);
    result.push({ ...it, title, summary });
    // pacing for live provider calls; cache hits still incur this but it's negligible
    await new Promise((r) => setTimeout(r, 300));
  }
  return result;
}

export const getMarketNews = createServerFn({ method: "GET" }).handler(async (): Promise<{ items: NewsItem[]; fallback: boolean }> => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { items: fallback, fallback: true };

  const today = new Date();
  const from = new Date(today.getTime() - 7 * 86400_000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  const [general, ipo, crypto, ...companyLists] = await Promise.all([
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=ipo&token=${key}`),
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=crypto&token=${key}`),
    ...COMPANY_TICKERS.map((t) =>
      fetchJson<Raw[]>(`https://finnhub.io/api/v1/company-news?symbol=${t}&from=${from}&to=${to}&token=${key}`),
    ),
  ]);

  const generalItems = (general ?? []).map((n) => toItem(n, "MERCADOS")).filter((x) => !isYahoo(x));
  const ipoItems = (ipo ?? []).map((n) => toItem(n, "EMPRESAS")).filter((x) => !isYahoo(x));
  const cryptoItems = (crypto ?? []).map((n) => toItem(n, "CRIPTO")).filter((x) => !isYahoo(x));
  const companyItems = companyLists
    .flatMap((arr) => arr ?? [])
    .map((n) => toItem(n, "EMPRESAS"))
    .filter((x) => !isYahoo(x));

  if (!generalItems.length && !ipoItems.length && !cryptoItems.length && !companyItems.length) {
    return { items: fallback, fallback: true };
  }

  const TOTAL = 30;
  const MAX_PER_CAT = Math.floor(TOTAL * 0.4); // 12

  const pool: NewsItem[] = [
    ...generalItems,
    ...cryptoItems,
    ...ipoItems,
    ...companyItems,
  ];

  const deduped: NewsItem[] = [];
  const tokenCache: Set<string>[] = [];
  for (const item of pool) {
    const t = tokens(item.title);
    let dup = false;
    for (const existing of tokenCache) {
      if (jaccard(t, existing) >= 0.6) { dup = true; break; }
    }
    if (dup) continue;
    tokenCache.push(t);
    deduped.push(item);
  }

  const counts: Record<string, number> = {};
  const capped: NewsItem[] = [];
  for (const it of deduped) {
    counts[it.cat] = (counts[it.cat] ?? 0) + 1;
    if (counts[it.cat] > MAX_PER_CAT) continue;
    capped.push(it);
  }

  const order = ["EMPRESAS", "MERCADOS", "CRIPTO", "MACRO"];
  const byCat: Record<string, NewsItem[]> = {};
  for (const it of capped) (byCat[it.cat] ||= []).push(it);
  const interleaved: NewsItem[] = [];
  let added = true;
  while (added && interleaved.length < TOTAL) {
    added = false;
    for (const k of order) {
      const next = byCat[k]?.shift();
      if (next) { interleaved.push(next); added = true; if (interleaved.length >= TOTAL) break; }
    }
  }

  const translated = await translateItems(interleaved);
  return { items: translated, fallback: false };
});

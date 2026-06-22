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
  { cat: "FUSIONES", time: "hace 5 h", source: "Equit", url: "#", title: "Cierre de adquisición millonaria en el sector tecnológico", summary: "Una de las mayores operaciones del año redefine el mapa competitivo del software empresarial." },
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

function isLikelyEnglish(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (/[áéíóúñ¿¡]/.test(lower)) return false;
  if (/\b(el|la|los|las|de|que|para|con|por|una|del|más|también|según|hoy|ayer|mañana)\b/.test(lower)) return false;
  return /\b(the|and|of|to|in|for|on|with|is|are|was|were|will|from|by|at|as|this|that|after|before)\b/.test(lower);
}

async function translateViaMyMemory(chunk: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[translate] MyMemory HTTP error:", res.status);
      return null;
    }
    const json = (await res.json()) as { responseData?: { translatedText?: string } };
    const translated = json?.responseData?.translatedText;
    if (!translated || /MYMEMORY WARNING/i.test(translated)) {
      console.warn("[translate] MyMemory quota/warning:", translated?.slice(0, 100));
      return null;
    }
    console.log("[translate] MyMemory OK");
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
      console.warn("[translate] Google HTTP error:", res.status);
      return null;
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const joined = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? (seg[0] as string) : ""))
      .join("");
    if (!joined) return null;
    console.log("[translate] Google fallback OK");
    return joined;
  } catch (e) {
    console.warn("[translate] Google threw:", e);
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
    try {
      const { data: cached } = await supabaseAdmin
        .from("news_translations")
        .select("translated_text")
        .eq("content_hash", hash)
        .eq("lang", targetLang)
        .maybeSingle();
      if (cached?.translated_text) {
        console.log("[translate] cache hit");
        out.push(cached.translated_text);
        continue;
      }
    } catch (e) {
      console.warn("[translate] cache read threw:", e);
    }

    let translated = await translateViaMyMemory(chunk);
    if (!translated) translated = await translateViaGoogle(chunk);
    if (!translated) {
      console.warn("[translate] both providers failed; returning original");
      out.push(chunk);
      continue;
    }

    try {
      const { error } = await supabaseAdmin
        .from("news_translations")
        .insert({ content_hash: hash, lang: targetLang, translated_text: translated });
      if (error && error.code !== "23505") {
        console.warn("[translate] cache write error:", error.message);
      }
    } catch (e) {
      console.warn("[translate] cache write threw:", e);
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
    else if (rawCat.includes("merger")) cat = "FUSIONES";
    else if (rawCat.includes("company")) cat = "EMPRESAS";
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
  // Sequential with small delay between provider-bound items to avoid rate limits.
  // Cache hits don't hit any network so they fly through.
  for (const it of items) {
    const [title, summary] = await Promise.all([
      translateChunk(it.title),
      it.summary ? translateChunk(it.summary) : Promise.resolve(""),
    ]);
    result.push({ ...it, title, summary });
    // tiny pacing for live calls; harmless on cache hits
    await new Promise((r) => setTimeout(r, 40));
  }
  return result;
}

export const getMarketNews = createServerFn({ method: "GET" }).handler(async (): Promise<{ items: NewsItem[]; fallback: boolean }> => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { items: fallback, fallback: true };

  const today = new Date();
  const from = new Date(today.getTime() - 7 * 86400_000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  const [general, mergers, crypto, ...companyLists] = await Promise.all([
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=merger&token=${key}`),
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=crypto&token=${key}`),
    ...COMPANY_TICKERS.map((t) =>
      fetchJson<Raw[]>(`https://finnhub.io/api/v1/company-news?symbol=${t}&from=${from}&to=${to}&token=${key}`),
    ),
  ]);

  const generalItems = (general ?? []).map((n) => toItem(n, "MERCADOS")).filter((x) => !isYahoo(x));
  const mergerItems = (mergers ?? []).map((n) => toItem(n, "FUSIONES")).filter((x) => !isYahoo(x));
  const cryptoItems = (crypto ?? []).map((n) => toItem(n, "CRIPTO")).filter((x) => !isYahoo(x));
  const companyItems = companyLists
    .flatMap((arr) => arr ?? [])
    .map((n) => toItem(n, "EMPRESAS"))
    .filter((x) => !isYahoo(x));

  if (!generalItems.length && !mergerItems.length && !cryptoItems.length && !companyItems.length) {
    return { items: fallback, fallback: true };
  }

  const TOTAL = 30;
  const MAX_PER_CAT = Math.floor(TOTAL * 0.4); // 12

  // Dedupe across the whole pool, prefer freshness (per-bucket order from Finnhub is newest-first).
  const pool: NewsItem[] = [
    ...generalItems,
    ...cryptoItems,
    ...mergerItems,
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

  // Cap each category to MAX_PER_CAT, preserving freshness order within each.
  const counts: Record<string, number> = {};
  const capped: NewsItem[] = [];
  for (const it of deduped) {
    counts[it.cat] = (counts[it.cat] ?? 0) + 1;
    if (counts[it.cat] > MAX_PER_CAT) continue;
    capped.push(it);
  }

  // Interleave categories for visual variety.
  const order = ["EMPRESAS", "MERCADOS", "CRIPTO", "FUSIONES", "MACRO"];
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

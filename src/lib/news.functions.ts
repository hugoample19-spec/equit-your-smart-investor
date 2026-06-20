import { createServerFn } from "@tanstack/react-start";

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

// Title-based dedupe: normalize, then drop near-duplicates via Jaccard on word sets.
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

export const getMarketNews = createServerFn({ method: "GET" }).handler(async (): Promise<{ items: NewsItem[]; fallback: boolean }> => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { items: fallback, fallback: true };

  // Pull from multiple buckets in parallel.
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 86400_000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  const [general, mergers, ...companyLists] = await Promise.all([
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
    fetchJson<Raw[]>(`https://finnhub.io/api/v1/news?category=merger&token=${key}`),
    ...COMPANY_TICKERS.map((t) =>
      fetchJson<Raw[]>(`https://finnhub.io/api/v1/company-news?symbol=${t}&from=${from}&to=${to}&token=${key}`),
    ),
  ]);

  const generalItems = (general ?? []).map((n) => toItem(n, "MERCADOS"));
  const mergerItems = (mergers ?? []).map((n) => toItem(n, "FUSIONES"));
  const companyItems = companyLists
    .flatMap((arr) => arr ?? [])
    .map((n) => toItem(n, "EMPRESAS"));

  if (generalItems.length === 0 && mergerItems.length === 0 && companyItems.length === 0) {
    return { items: fallback, fallback: true };
  }

  // Target distribution: ~30% general, ~30% mergers, ~40% companies. Total ~30.
  const TOTAL = 30;
  const sortDesc = (a: NewsItem, b: NewsItem) =>
    // we sort by approximate freshness via 'time' string is unreliable — use stored datetime via slice order
    a.time.localeCompare(b.time); // best-effort; replaced below

  // We don't keep datetime on NewsItem, so sort by original arrays which are already newest-first from Finnhub.
  void sortDesc;

  const pickGen = generalItems.slice(0, Math.round(TOTAL * 0.3));
  const pickMerg = mergerItems.slice(0, Math.round(TOTAL * 0.3));
  const pickComp = companyItems
    .sort(() => 0) // already roughly fresh per-ticker; keep as-is
    .slice(0, TOTAL - pickGen.length - pickMerg.length);

  // Merge, dedupe by near-identical headline.
  const merged: NewsItem[] = [];
  const tokenCache: Set<string>[] = [];
  for (const item of [...pickComp, ...pickMerg, ...pickGen]) {
    const t = tokens(item.title);
    let dup = false;
    for (const existing of tokenCache) {
      if (jaccard(t, existing) >= 0.6) { dup = true; break; }
    }
    if (dup) continue;
    tokenCache.push(t);
    merged.push(item);
    if (merged.length >= TOTAL) break;
  }

  // Interleave so EMPRESAS / FUSIONES / MERCADOS feel mixed rather than clumped.
  const byCat: Record<string, NewsItem[]> = { EMPRESAS: [], FUSIONES: [], MERCADOS: [] };
  for (const it of merged) (byCat[it.cat] ||= []).push(it);
  const interleaved: NewsItem[] = [];
  const order = ["EMPRESAS", "MERCADOS", "FUSIONES"];
  let added = true;
  while (added) {
    added = false;
    for (const k of order) {
      const next = byCat[k]?.shift();
      if (next) { interleaved.push(next); added = true; }
    }
  }

  return { items: interleaved, fallback: false };
});

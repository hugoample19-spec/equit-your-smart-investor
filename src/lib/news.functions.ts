import { createServerFn } from "@tanstack/react-start";

export type NewsItem = {
  cat: string;
  time: string;
  title: string;
  summary: string;
  source: string;
  url: string;
};

const fallback: NewsItem[] = [
  { cat: "MERCADOS", time: "hace 24 min", source: "Equit", url: "#", title: "El IBEX 35 supera los 12.400 puntos y marca máximos del año", summary: "La banca lidera las subidas mientras Inditex aporta un nuevo récord en sesión europea." },
  { cat: "CRIPTO", time: "hace 1 h", source: "Equit", url: "#", title: "Bitcoin rompe los $74.000 con flujos récord en ETFs spot", summary: "BlackRock IBIT acumula más de $2.400M en una semana mientras la oferta en exchanges cae." },
  { cat: "TECH", time: "hace 2 h", source: "Equit", url: "#", title: "Nvidia presenta su nueva familia Blackwell B300 para inferencia", summary: "Las acciones suben un 4,2% en pre-market tras superar las expectativas del mercado." },
  { cat: "MACRO", time: "hace 3 h", source: "Equit", url: "#", title: "El BCE mantiene tipos y abre la puerta a un recorte en septiembre", summary: "Lagarde subraya la moderación de la inflación subyacente en la eurozona durante el último trimestre." },
  { cat: "EMPRESAS", time: "hace 5 h", source: "Equit", url: "#", title: "Inditex eleva ventas un 7,1% y supera las previsiones del consenso", summary: "El grupo gallego mantiene márgenes y anuncia un dividendo extraordinario para julio." },
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

function mapCategory(c: string): string {
  const x = (c || "").toLowerCase();
  if (x.includes("crypto")) return "CRIPTO";
  if (x.includes("tech")) return "TECH";
  if (x.includes("forex") || x.includes("macro") || x.includes("economy")) return "MACRO";
  if (x.includes("merger") || x.includes("company")) return "EMPRESAS";
  return "MERCADOS";
}

export const getMarketNews = createServerFn({ method: "GET" }).handler(async (): Promise<{ items: NewsItem[]; fallback: boolean }> => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { items: fallback, fallback: true };
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return { items: fallback, fallback: true };
    const raw = (await res.json()) as Array<{
      category: string; datetime: number; headline: string; summary: string; source: string; url: string;
    }>;
    if (!Array.isArray(raw) || raw.length === 0) return { items: fallback, fallback: true };
    const items: NewsItem[] = raw.slice(0, 30).map((n) => ({
      cat: mapCategory(n.category),
      time: relTime(n.datetime),
      title: n.headline,
      summary: n.summary || "",
      source: n.source || "",
      url: n.url || "#",
    }));
    return { items, fallback: false };
  } catch {
    return { items: fallback, fallback: true };
  }
});

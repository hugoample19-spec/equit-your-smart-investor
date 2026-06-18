import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getMarketNews } from "@/lib/news.functions";

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

async function translateToSpanish(text: string): Promise<string> {
  if (!text) return text;
  if (!isLikelyEnglish(text)) return text;
  try {
    const chunk = text.slice(0, 480);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    const translated = json?.responseData?.translatedText as string | undefined;
    if (!translated) return text;
    if (/MYMEMORY WARNING/i.test(translated)) return text;
    return text.length > 480 ? translated + "…" : translated;
  } catch {
    return text;
  }
}

function NoticiasPage() {
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>Noticias</h1>
        <p className="text-[11px] tracking-widest font-semibold mt-2" style={{ color: "var(--muted-foreground)" }}>HOY · {today}</p>
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
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>{n.cat}</span>
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n.time}</span>
                </div>
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="block">
                  <h2 className="text-base font-semibold mt-2 leading-snug" style={{ color: "var(--navy)" }}>{title}</h2>
                  {summary && (
                    <p className="text-sm mt-1.5 leading-relaxed line-clamp-3" style={{ color: "var(--muted-foreground)" }}>{summary}</p>
                  )}
                  {n.source && (
                    <p className="text-[10px] tracking-wider mt-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
                      {n.source.toUpperCase()}
                    </p>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
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

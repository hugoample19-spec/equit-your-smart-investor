import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

function NoticiasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["market-news"],
    queryFn: () => getMarketNews(),
    staleTime: 5 * 60 * 1000,
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
          {data?.items.map((n, idx) => (
            <li key={idx} className="bg-card rounded-2xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>{n.cat}</span>
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n.time}</span>
              </div>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h2 className="text-base font-semibold mt-2 leading-snug" style={{ color: "var(--navy)" }}>{n.title}</h2>
                {n.summary && (
                  <p className="text-sm mt-1.5 leading-relaxed line-clamp-3" style={{ color: "var(--muted-foreground)" }}>{n.summary}</p>
                )}
                {n.source && (
                  <p className="text-[10px] tracking-wider mt-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {n.source.toUpperCase()}
                  </p>
                )}
              </a>
            </li>
          ))}
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

import { createFileRoute } from "@tanstack/react-router";
import { news } from "@/lib/data";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias · Equit" },
      { name: "description", content: "Mercados, cripto, tech y macro. Gratis para todos." },
    ],
  }),
  component: NoticiasPage,
});

function NoticiasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>Noticias</h1>
        <p className="text-[11px] tracking-widest font-semibold mt-2" style={{ color: "var(--muted-foreground)" }}>HOY · 18 JUN</p>
      </div>
      <ul className="space-y-3">
        {news.map((n, idx) => (
          <li key={idx} className="bg-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] tracking-widest font-bold" style={{ color: "var(--gold)" }}>{n.cat}</span>
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n.time}</span>
            </div>
            <h2 className="text-base font-semibold mt-2 leading-snug" style={{ color: "var(--navy)" }}>{n.title}</h2>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{n.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

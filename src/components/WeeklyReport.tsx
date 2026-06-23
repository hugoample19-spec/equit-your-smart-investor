import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ChevronRight } from "lucide-react";

// The full weekly report now lives at /informe. This component is just the
// entry pill rendered on the home screen.
export function WeeklyReport({ isPremium: _isPremium }: { isPremium: boolean }) {
  const navigate = useNavigate();

  // Always shows the same label — the actual current week is rendered inside
  // /informe, where it can be derived from the loaded report.
  return (
    <button
      onClick={() => navigate({ to: "/informe" })}
      className="w-full flex items-center justify-between gap-3 rounded-2xl pl-4 pr-3.5 py-3 text-left transition-transform active:scale-[0.99]"
      style={{
        background: "var(--navy)",
        borderLeft: "3px solid var(--gold)",
        boxShadow: "0 8px 20px -12px rgba(26,26,46,0.45)",
        color: "var(--navy-foreground)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Sparkles size={16} style={{ color: "var(--gold)" }} />
        <div className="flex flex-col min-w-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em] leading-tight"
            style={{ color: "var(--navy-foreground)" }}
          >
            Informe Semanal
          </span>
          <span
            className="text-[11px] leading-tight mt-0.5"
            style={{ color: "rgba(201,168,76,0.85)" }}
          >
            Esta semana
          </span>
        </div>
      </div>
      <span
        className="flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap"
        style={{ color: "var(--gold)" }}
      >
        Ver
        <ChevronRight size={14} />
      </span>
    </button>
  );
}

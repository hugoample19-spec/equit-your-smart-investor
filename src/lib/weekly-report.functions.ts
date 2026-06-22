import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WeeklyReportSections = {
  macro: string;
  bolsa: string;
  cripto: string;
  referentes: string;
  radar: string;
};

export type WeeklyReportPayload =
  | { ok: false; reason: "premium_required" }
  | {
      ok: true;
      report: {
        weekLabel: string;
        sections: WeeklyReportSections;
        createdAt: string;
      };
    };

const SECTION_KEYS: (keyof WeeklyReportSections)[] = [
  "macro",
  "bolsa",
  "cripto",
  "referentes",
  "radar",
];

const SECTION_HEADERS: Record<keyof WeeklyReportSections, RegExp> = {
  macro: /^\s*(?:\d\)\s*)?MACRO[:\s-]*/i,
  bolsa: /^\s*(?:\d\)\s*)?BOLSA[:\s-]*/i,
  cripto: /^\s*(?:\d\)\s*)?CRIPTO[:\s-]*/i,
  referentes: /^\s*(?:\d\)\s*)?REFERENTES[:\s-]*/i,
  radar: /^\s*(?:\d\)\s*)?RADAR[:\s-]*/i,
};

function parseSections(raw: string): WeeklyReportSections {
  const lines = raw.split(/\r?\n/);
  const out: WeeklyReportSections = { macro: "", bolsa: "", cripto: "", referentes: "", radar: "" };
  let current: keyof WeeklyReportSections | null = null;
  const buffers: Record<string, string[]> = { macro: [], bolsa: [], cripto: [], referentes: [], radar: [] };

  for (const line of lines) {
    let matched: keyof WeeklyReportSections | null = null;
    for (const key of SECTION_KEYS) {
      // Also match patterns like "**1) MACRO:**"
      const stripped = line.replace(/[*#`]/g, "").trim();
      if (SECTION_HEADERS[key].test(stripped)) {
        matched = key;
        const after = stripped.replace(SECTION_HEADERS[key], "").trim();
        if (after) buffers[key].push(after);
        break;
      }
    }
    if (matched) {
      current = matched;
      continue;
    }
    if (current) buffers[current].push(line);
  }

  for (const key of SECTION_KEYS) {
    out[key] = buffers[key].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  return out;
}

function currentWeekLabel(d: Date = new Date()): string {
  // Monday of current week in Europe/Madrid
  const fmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
  });
  const day = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (day - 1));
  return `Semana del ${fmt.format(monday).replace(".", "")}`;
}

export const getWeeklyReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklyReportPayload> => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.is_premium) {
      return { ok: false, reason: "premium_required" };
    }

    const { data: latest } = await supabase
      .from("weekly_reports")
      .select("id, content, week_label, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
    if (latest && Date.now() - new Date(latest.created_at).getTime() < SIX_DAYS_MS) {
      return {
        ok: true,
        report: {
          weekLabel: latest.week_label,
          sections: latest.content as WeeklyReportSections,
          createdAt: latest.created_at,
        },
      };
    }

    // Generate a fresh report via Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const todayLabel = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const systemPrompt =
      "Eres un analista financiero senior que redacta informes semanales de mercado para inversores jóvenes españoles. Escribe en español profesional pero accesible. Usa datos reales de la semana actual.";
    const userPrompt = `Redacta el informe semanal de mercados para inversores españoles de la semana del ${todayLabel}. Estructura el informe en estas secciones exactas con estos títulos: 1) MACRO: resumen del entorno macro global (Fed, BCE, inflación, tipos). 2) BOLSA: principales movimientos de índices (S&P500, Nasdaq, IBEX35, DAX) y sectores destacados. 3) CRIPTO: comportamiento de Bitcoin y Ethereum, tendencias relevantes. 4) REFERENTES: qué harían los grandes inversores en este entorno (basado en sus filosofías conocidas — Buffett value, Dalio macro, Druckenmiller momentum, Burry contrarian). 5) RADAR: 2-3 catalizadores a vigilar la próxima semana. Sé concreto, usa porcentajes y datos reales donde puedas. Máximo 600 palabras en total.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      // Fallback: serve stale report if we have one
      if (latest) {
        return {
          ok: true,
          report: {
            weekLabel: latest.week_label,
            sections: latest.content as WeeklyReportSections,
            createdAt: latest.created_at,
          },
        };
      }
      throw new Error(`Lovable AI error ${aiRes.status}: ${text}`);
    }

    const aiJson = (await aiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = aiJson.choices?.[0]?.message?.content ?? "";
    const sections = parseSections(raw);
    const weekLabel = currentWeekLabel();

    // Persist via admin client (bypass RLS for insert)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: inserted } = await supabaseAdmin
        .from("weekly_reports")
        .insert({ content: sections, week_label: weekLabel })
        .select("created_at")
        .single();
      return {
        ok: true,
        report: {
          weekLabel,
          sections,
          createdAt: inserted?.created_at ?? new Date().toISOString(),
        },
      };
    } catch (e) {
      console.error("[weekly-report] insert failed", e);
      return {
        ok: true,
        report: { weekLabel, sections, createdAt: new Date().toISOString() },
      };
    }
  });

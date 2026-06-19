import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHash } from "crypto";

export type NewsInsightResult =
  | { ok: true; insight: string; cached: boolean }
  | { ok: false; reason: "premium_required" | "ai_failed" | "ai_empty" | "missing_ai_key" };

export const getNewsInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as { headline?: string; summary?: string };
    if (!v?.headline || typeof v.headline !== "string") throw new Error("headline required");
    return { headline: v.headline, summary: typeof v.summary === "string" ? v.summary : "" };
  })
  .handler(async ({ data, context }): Promise<NewsInsightResult> => {
    const hash = createHash("sha256").update(data.headline.trim().toLowerCase()).digest("hex");

    const { data: prof } = await context.supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", context.userId)
      .maybeSingle();
    if (!prof?.is_premium) return { ok: false, reason: "premium_required" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cached } = await supabaseAdmin
      .from("news_insights")
      .select("insight")
      .eq("headline_hash", hash)
      .maybeSingle();
    if (cached?.insight) return { ok: true, insight: cached.insight, cached: true };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, reason: "missing_ai_key" };

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
                "Eres un analista financiero que explica noticias a inversores jóvenes principiantes en España. Responde en español claro y directo, sin tecnicismos, en 3-4 frases.",
            },
            {
              role: "user",
              content: `Noticia: ${data.headline}\n${data.summary ? `Resumen: ${data.summary}\n` : ""}\nExplica por qué importa esta noticia y cómo podría afectar a la cartera de un inversor minorista. Sé concreto y educativo.`,
            },
          ],
        }),
      });
      if (!res.ok) return { ok: false, reason: "ai_failed" };
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const insight = json.choices?.[0]?.message?.content?.trim();
      if (!insight) return { ok: false, reason: "ai_empty" };

      await supabaseAdmin
        .from("news_insights")
        .insert({ headline_hash: hash, headline: data.headline, insight });

      return { ok: true, insight, cached: false };
    } catch {
      return { ok: false, reason: "ai_failed" };
    }
  });

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
                "Eres el analista de Equit. Tu trabajo es leer un titular de noticia financiera y dar una respuesta directa, inteligente y orientada a la acción — como lo haría un amigo que sabe mucho de mercados. Sin condescendencia, sin explicar qué es el S&P500 ni el Dow Jones. El usuario ya sabe invertir básicamente. Responde en español directo, máximo 4 frases, sin saludos ni introducciones. Usa Markdown: **negrita** para datos o conceptos clave.",
            },
            {
              role: "user",
              content: `Titular: ${data.headline}${data.summary ? `\nContexto: ${data.summary}` : ""}\n\nDa una respuesta directa a esta noticia: qué está pasando realmente, qué implica para los mercados o para activos concretos, y si hay algo que un inversor joven debería considerar hacer (o no hacer) con su cartera. Sin rodeos.`,
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
